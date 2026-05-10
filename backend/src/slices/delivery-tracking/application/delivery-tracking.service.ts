import type {
  DeliveryTrackingActionStatus,
  DeliveryTrackingCommandResult,
  DeliveryTrackingCursor,
  DeliveryTrackingNotifier,
  DeliveryTrackingOrderRecord,
  DeliveryTrackingOrderId,
  DeliveryTrackingOrderStatus,
  DeliveryTrackingRepository,
  DeliveryTrackingStatusCommandInput,
} from "../domain/delivery-tracking.types";
import { AppError } from "../../../shared/errors/app-error";

const ALLOWED_TRACKING_ROLE = "courier";
const ALLOWED_OPERATOR_TRACKING_ROLES = new Set(["operator", "admin"]);
const NOOP_DELIVERY_TRACKING_NOTIFIER: DeliveryTrackingNotifier = {
  async notifyStatusChanged() {
    return undefined;
  },
};

const NEXT_STATUS_BY_CURRENT_STATUS: Partial<Record<DeliveryTrackingOrderStatus, DeliveryTrackingOrderStatus>> = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_PROGRESS",
  IN_PROGRESS: "DELIVERED",
};

const NEXT_OPERATOR_STATUS_BY_CURRENT_STATUS: Partial<Record<DeliveryTrackingOrderStatus, DeliveryTrackingOrderStatus>> = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_PROGRESS",
  IN_PROGRESS: "DELIVERED",
  DELIVERED: "COMPLETED",
};

const getAvailableActionsForStatus = (
  status: DeliveryTrackingActionStatus,
): DeliveryTrackingActionStatus[] => {
  const nextStatus = NEXT_STATUS_BY_CURRENT_STATUS[status];

  return nextStatus === undefined ? [] : [nextStatus as DeliveryTrackingActionStatus];
};

const toNotificationStatus = (status: DeliveryTrackingOrderStatus): DeliveryTrackingActionStatus => {
  if (status === "PICKED_UP" || status === "IN_PROGRESS" || status === "DELIVERED") {
    return status;
  }

  throw new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
    currentStatus: status,
    expectedStatus: NEXT_STATUS_BY_CURRENT_STATUS[status] ?? null,
  });
};

export class DeliveryTrackingService {
  constructor(
    private readonly repository: DeliveryTrackingRepository,
    private readonly notifier: DeliveryTrackingNotifier = NOOP_DELIVERY_TRACKING_NOTIFIER,
  ) {}

  findOrderById(orderId: DeliveryTrackingOrderId) {
    return this.repository.findOrderById(orderId);
  }

  getEventsSince(cursor?: DeliveryTrackingCursor) {
    return this.repository.listEventsSince(cursor);
  }

  async recordStatusTransition(
    input: DeliveryTrackingStatusCommandInput,
  ): Promise<DeliveryTrackingCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Status update requires an authenticated courier", 401);
    }

    if (actor.role !== ALLOWED_TRACKING_ROLE) {
      throw new AppError("FORBIDDEN", "User role cannot update delivery status", 403, {
        role: actor.role,
      });
    }

    const order = await this.repository.findOrderById(input.orderId);

    this.assertTrackableOrder(order, input.orderId, input.nextStatus);

    if (order.courierId !== actor.userId) {
      throw new AppError("FORBIDDEN", "Courier cannot update an order assigned to another courier", 403, {
        orderId: input.orderId,
        courierId: actor.userId,
        assignedCourierId: order.courierId,
      });
    }

    const expectedStatus = NEXT_STATUS_BY_CURRENT_STATUS[order.status] ?? null;

    if (expectedStatus !== input.nextStatus) {
      throw new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
        orderId: input.orderId,
        currentStatus: order.status,
        nextStatus: input.nextStatus,
        expectedStatus,
      });
    }

    const artifacts = await this.repository.recordStatusTransition({
      orderId: order.id,
      changedByUserId: actor.userId,
      oldStatus: order.status,
      newStatus: input.nextStatus,
      changedAt: new Date(),
    });

    const courierTelegramId = await this.repository.findUserTelegramIdById(actor.userId);

    if (courierTelegramId !== null) {
      const notificationStatus = toNotificationStatus(artifacts.order.status);

      try {
        await this.notifier.notifyStatusChanged({
          orderId: artifacts.order.id,
          courierTelegramId,
          status: notificationStatus,
          revision: artifacts.revision,
          availableActions: getAvailableActionsForStatus(notificationStatus),
        });
      } catch {
        // Transport outages must not roll back the committed lifecycle write.
      }
    }

    return {
      orderId: artifacts.order.id,
      status: artifacts.order.status,
      updatedAt: artifacts.order.updatedAt,
      revision: artifacts.revision,
    };
  }

  async recordOperatorStatusTransition(
    input: DeliveryTrackingStatusCommandInput,
  ): Promise<DeliveryTrackingCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Status control requires an authenticated operator", 401);
    }

    if (!ALLOWED_OPERATOR_TRACKING_ROLES.has(actor.role)) {
      throw new AppError("FORBIDDEN", "User role cannot control delivery status", 403, {
        role: actor.role,
      });
    }

    const order = await this.repository.findOrderById(input.orderId);

    this.assertOperatorTrackableOrder(order, input.orderId, input.nextStatus);

    const expectedStatus = NEXT_OPERATOR_STATUS_BY_CURRENT_STATUS[order.status] ?? null;

    if (expectedStatus !== input.nextStatus) {
      throw new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
        orderId: input.orderId,
        currentStatus: order.status,
        nextStatus: input.nextStatus,
        expectedStatus,
      });
    }

    const artifacts = await this.repository.recordStatusTransition({
      orderId: order.id,
      changedByUserId: actor.userId,
      changedByRole: actor.role,
      changedByName: actor.name,
      oldStatus: order.status,
      newStatus: input.nextStatus,
      changedAt: new Date(),
    });

    return {
      orderId: artifacts.order.id,
      status: artifacts.order.status,
      updatedAt: artifacts.order.updatedAt,
      revision: artifacts.revision,
    };
  }

  private assertTrackableOrder(
    order: DeliveryTrackingOrderRecord | null,
    orderId: DeliveryTrackingOrderId,
    nextStatus: DeliveryTrackingOrderStatus,
  ): asserts order is DeliveryTrackingOrderRecord {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (!(order.status in NEXT_STATUS_BY_CURRENT_STATUS)) {
      throw new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
        orderId,
        currentStatus: order.status,
        nextStatus,
        expectedStatus: null,
      });
    }
  }

  private assertOperatorTrackableOrder(
    order: DeliveryTrackingOrderRecord | null,
    orderId: DeliveryTrackingOrderId,
    nextStatus: DeliveryTrackingOrderStatus,
  ): asserts order is DeliveryTrackingOrderRecord {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (!(order.status in NEXT_OPERATOR_STATUS_BY_CURRENT_STATUS)) {
      throw new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
        orderId,
        currentStatus: order.status,
        nextStatus,
        expectedStatus: null,
      });
    }
  }
}
