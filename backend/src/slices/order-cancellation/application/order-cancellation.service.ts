import type {
  AuthorizedOrderRefundUpdateInput,
  AuthorizedOrderCancellationInput,
  OrderCancellationCommandResult,
  OrderCancellationOrderRecord,
  OrderCancellationOrderId,
  OrderCancellationOrderStatus,
  OrderCancellationRepository,
  OrderRefundUpdateResult,
  PersistOrderCancellationInput,
  PersistOrderRefundUpdateInput,
} from "../domain/order-cancellation.types";
import { AppError } from "../../../shared/errors/app-error";

const ALLOWED_ADMIN_ROLE = "admin";
const ALLOWED_COURIER_ROLE = "courier";
const ALLOWED_REFUND_OPERATOR_ROLES = new Set(["boss", "manager", "admin"] as const);
const COURIER_UNAVAILABLE_REASON_CODE = "COURIER_UNAVAILABLE";

const ADMIN_CANCELLABLE_STATUSES = new Set<OrderCancellationOrderStatus>([
  "CREATED",
  "ASSIGNED",
  "IN_PROGRESS",
]);
const COURIER_CANCELLABLE_STATUSES = new Set<OrderCancellationOrderStatus>([
  "ASSIGNED",
  "IN_PROGRESS",
]);
const CANCELLED_STATUSES = new Set<OrderCancellationOrderStatus>([
  "CANCELLED_BY_ADMIN",
  "CANCELLED_BY_COURIER_UNAVAILABLE",
]);

export class OrderCancellationService {
  constructor(private readonly repository: OrderCancellationRepository) {}

  findOrderById(orderId: OrderCancellationOrderId) {
    return this.repository.findOrderById(orderId);
  }

  async cancelOrder(
    input: AuthorizedOrderCancellationInput,
  ): Promise<OrderCancellationCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Cancellation requires an authenticated operator", 401);
    }

    if (actor.role !== ALLOWED_ADMIN_ROLE && actor.role !== ALLOWED_COURIER_ROLE) {
      throw new AppError("FORBIDDEN", "User role cannot cancel orders", 403, {
        role: actor.role,
      });
    }

    const reasonCode = input.reasonCode.trim();

    if (reasonCode.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Cancellation reason is required", 400, {
        field: "reasonCode",
      });
    }

    const order = await this.repository.findOrderById(input.orderId);

    this.assertCancellableOrder(order, input.orderId);

    const cancellation =
      actor.role === ALLOWED_ADMIN_ROLE
        ? this.resolveAdminCancellation(order, input.orderId)
        : this.resolveCourierCancellation(order, input.orderId, actor.userId, reasonCode);

    const artifacts = await this.repository.recordCancellation({
      orderId: order.id,
      actor,
      oldStatus: order.status,
      newStatus: cancellation.newStatus,
      reasonCode,
      refundStatus: order.paymentStatus === "PAID" ? "PENDING_MANUAL" : "NOT_REQUIRED",
      refundNote: null,
      cancelledAt: new Date(),
    });

    return {
      orderId: artifacts.order.id,
      status: artifacts.order.status as OrderCancellationCommandResult["status"],
      refundStatus: artifacts.order.refundStatus as OrderCancellationCommandResult["refundStatus"],
      updatedAt: artifacts.order.updatedAt,
      revision: artifacts.revision,
    };
  }

  async recordCancellationBaseline(
    input: PersistOrderCancellationInput,
  ): Promise<OrderCancellationCommandResult> {
    const artifacts = await this.repository.recordCancellation(input);

    return {
      orderId: artifacts.order.id,
      status: artifacts.order.status as OrderCancellationCommandResult["status"],
      refundStatus: artifacts.order.refundStatus as OrderCancellationCommandResult["refundStatus"],
      updatedAt: artifacts.order.updatedAt,
      revision: artifacts.revision,
    };
  }

  async recordRefundUpdateBaseline(
    input: PersistOrderRefundUpdateInput,
  ): Promise<OrderRefundUpdateResult> {
    const artifacts = await this.repository.recordRefundUpdate(input);

    return {
      orderId: artifacts.order.id,
      status: artifacts.order.status as OrderRefundUpdateResult["status"],
      refundStatus: artifacts.order.refundStatus as OrderRefundUpdateResult["refundStatus"],
      refundNote: artifacts.order.refundNote,
      updatedAt: artifacts.order.updatedAt,
      revision: artifacts.revision,
    };
  }

  async recordRefundUpdate(
    input: AuthorizedOrderRefundUpdateInput,
  ): Promise<OrderRefundUpdateResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Refund tracking requires an authenticated operator", 401);
    }

    if (!ALLOWED_REFUND_OPERATOR_ROLES.has(actor.role as "boss" | "manager" | "admin")) {
      throw new AppError("FORBIDDEN", "User role cannot update refund tracking", 403, {
        role: actor.role,
      });
    }

    const refundNote = input.refundNote.trim();

    if (refundNote.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Refund note is required", 400, {
        field: "refundNote",
      });
    }

    const order = await this.repository.findOrderById(input.orderId);

    this.assertCancellableOrder(order, input.orderId);

    if (!CANCELLED_STATUSES.has(order.status)) {
      throw new AppError("CONFLICT", "Refund tracking can only be updated for cancelled orders", 409, {
        orderId: input.orderId,
        currentStatus: order.status,
      });
    }

    if (order.paymentStatus !== "PAID") {
      throw new AppError(
        "CONFLICT",
        "Manual refund tracking is not required for unpaid cancellations",
        409,
        {
          orderId: input.orderId,
          paymentStatus: order.paymentStatus,
          refundStatus: order.refundStatus,
        },
      );
    }

    if (order.refundStatus !== "PENDING_MANUAL") {
      throw new AppError(
        "CONFLICT",
        "Refund tracking can only progress from PENDING_MANUAL",
        409,
        {
          orderId: input.orderId,
          currentRefundStatus: order.refundStatus,
          expectedRefundStatus: "PENDING_MANUAL",
        },
      );
    }

    const artifacts = await this.repository.recordRefundUpdate({
      orderId: input.orderId,
      actor,
      refundStatus: input.refundStatus,
      refundNote,
      updatedAt: new Date(),
    });

    return {
      orderId: artifacts.order.id,
      status: artifacts.order.status as OrderRefundUpdateResult["status"],
      refundStatus: artifacts.order.refundStatus as OrderRefundUpdateResult["refundStatus"],
      refundNote: artifacts.order.refundNote,
      updatedAt: artifacts.order.updatedAt,
      revision: artifacts.revision,
    };
  }

  private assertCancellableOrder(
    order: OrderCancellationOrderRecord | null,
    orderId: OrderCancellationOrderId,
  ): asserts order is OrderCancellationOrderRecord {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }
  }

  private resolveAdminCancellation(
    order: OrderCancellationOrderRecord,
    orderId: OrderCancellationOrderId,
  ) {
    if (!ADMIN_CANCELLABLE_STATUSES.has(order.status)) {
      throw new AppError("CONFLICT", "Order cannot be cancelled from the current state", 409, {
        orderId,
        currentStatus: order.status,
        allowedStatuses: "CREATED,ASSIGNED,IN_PROGRESS",
      });
    }

    return {
      newStatus: "CANCELLED_BY_ADMIN" as const,
    };
  }

  private resolveCourierCancellation(
    order: OrderCancellationOrderRecord,
    orderId: OrderCancellationOrderId,
    actorUserId: string,
    reasonCode: string,
  ) {
    if (!COURIER_CANCELLABLE_STATUSES.has(order.status)) {
      throw new AppError("CONFLICT", "Order cannot be cancelled from the current state", 409, {
        orderId,
        currentStatus: order.status,
        allowedStatuses: "ASSIGNED,IN_PROGRESS",
      });
    }

    if (order.courierId !== actorUserId) {
      throw new AppError("FORBIDDEN", "Courier cannot cancel an order assigned to another courier", 403, {
        orderId,
        courierId: actorUserId,
        assignedCourierId: order.courierId,
      });
    }

    if (reasonCode !== COURIER_UNAVAILABLE_REASON_CODE) {
      throw new AppError(
        "FORBIDDEN",
        "Courier cancellation requires the unavailable-case reason",
        403,
        {
          orderId,
          reasonCode,
          expectedReasonCode: COURIER_UNAVAILABLE_REASON_CODE,
        },
      );
    }

    return {
      newStatus: "CANCELLED_BY_COURIER_UNAVAILABLE" as const,
    };
  }
}
