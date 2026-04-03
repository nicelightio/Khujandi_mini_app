import type {
  AssignDeliveryOrderInput,
  DeliveryAssignmentCommandResult,
  DeliveryAssignmentNotifier,
  DeliveryAssignmentOrderId,
  DeliveryAssignmentOrderRecord,
  DeliveryAssignmentRepository,
  DeliveryAssignmentUserId,
} from "../domain/delivery-assignment.types";
import { AppError } from "../../../shared/errors/app-error";

const ALLOWED_ASSIGNMENT_ROLE = "admin";
const ASSIGNABLE_ORDER_STATUS = "CREATED";
const NOOP_DELIVERY_ASSIGNMENT_NOTIFIER: DeliveryAssignmentNotifier = {
  async notifyCourierAssigned() {
    return undefined;
  },
};

export class DeliveryAssignmentService {
  constructor(
    private readonly repository: DeliveryAssignmentRepository,
    private readonly notifier: DeliveryAssignmentNotifier = NOOP_DELIVERY_ASSIGNMENT_NOTIFIER,
  ) {}

  findOrderById(orderId: DeliveryAssignmentOrderId) {
    return this.repository.findOrderById(orderId);
  }

  findCourierById(courierId: DeliveryAssignmentUserId) {
    return this.repository.findCourierById(courierId);
  }

  async assignCourier(input: AssignDeliveryOrderInput): Promise<DeliveryAssignmentCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Assignment requires an authenticated admin", 401);
    }

    if (actor.role !== ALLOWED_ASSIGNMENT_ROLE) {
      throw new AppError("FORBIDDEN", "User role cannot assign couriers", 403, {
        role: actor.role,
      });
    }

    const order = await this.repository.findOrderById(input.orderId);

    this.assertAssignableOrder(order, input.orderId);

    const courier = await this.repository.findCourierById(input.courierId);

    if (courier === null || courier.role !== "courier" || !courier.isActive) {
      throw new AppError("COURIER_INVALID", "Courier is not eligible for assignment", 400, {
        courierId: input.courierId,
      });
    }

    const assignmentArtifacts = await this.repository.assignCourier({
      orderId: order.id,
      courierId: courier.id,
      adminUserId: actor.userId,
      assignedAt: new Date(),
    });

    try {
      await this.notifier.notifyCourierAssigned({
        orderId: assignmentArtifacts.order.id,
        courierId: courier.id,
        courierTelegramId: courier.telegramId,
        courierName: courier.name,
        assignedByUserId: actor.userId,
        status: "ASSIGNED",
        updatedAt: assignmentArtifacts.order.updatedAt,
        revision: assignmentArtifacts.revision,
      });
    } catch {
      // Transport outages must not roll back the committed assignment semantics.
    }

    return {
      orderId: assignmentArtifacts.order.id,
      courierId: assignmentArtifacts.order.courierId ?? courier.id,
      status: "ASSIGNED",
      updatedAt: assignmentArtifacts.order.updatedAt,
      revision: assignmentArtifacts.revision,
    };
  }

  private assertAssignableOrder(
    order: DeliveryAssignmentOrderRecord | null,
    orderId: DeliveryAssignmentOrderId,
  ): asserts order is DeliveryAssignmentOrderRecord {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (order.status !== ASSIGNABLE_ORDER_STATUS) {
      throw new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId,
        currentStatus: order.status,
        expectedStatus: ASSIGNABLE_ORDER_STATUS,
      });
    }
  }
}
