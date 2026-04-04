import type {
  CreateOrderCancellationAuditInput,
  CreateOrderCancellationStatusHistoryInput,
  CreateOrderCancelledEventInput,
  CreateOrderRefundUpdatedEventInput,
  OrderCancellationAuditRecord,
  OrderCancellationEventRecord,
  OrderCancellationOrderRecord,
  OrderCancellationOrderStatus,
  OrderCancellationPaymentStatus,
  OrderCancellationRefundStatus,
  OrderCancellationRepository,
  OrderCancellationStatusHistoryRecord,
  OrderCancellationArtifactsRecord,
  OrderRefundUpdateArtifactsRecord,
  PersistOrderCancellationInput,
  PersistOrderRefundUpdateInput,
} from "../domain/order-cancellation.types";
import { AppError } from "../../../shared/errors/app-error";

type OrderCancellationOrderFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    courierId: true;
    status: true;
    paymentStatus: true;
    refundStatus: true;
    refundNote: true;
    cancelledByUserId: true;
    cancellationReasonCode: true;
    cancelledAt: true;
    updatedAt: true;
    isDeleted: true;
  };
};

type OrderCancellationOrderUpdateArgs = {
  where: {
    id: string;
  };
  data:
    | {
        status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE";
        cancelledByUserId: string;
        cancellationReasonCode: string;
        cancelledAt: Date;
        refundStatus: OrderCancellationRefundStatus;
        refundNote: string | null;
      }
    | {
        refundStatus: "DONE" | "REJECTED" | "NOT_REQUIRED";
        refundNote: string | null;
      };
  select: {
    id: true;
    courierId: true;
    status: true;
    paymentStatus: true;
    refundStatus: true;
    refundNote: true;
    cancelledByUserId: true;
    cancellationReasonCode: true;
    cancelledAt: true;
    updatedAt: true;
    isDeleted: true;
  };
};

type OrderCancellationStatusHistoryCreateArgs = {
  data: CreateOrderCancellationStatusHistoryInput;
};

type OrderCancellationAuditCreateArgs = {
  data: CreateOrderCancellationAuditInput;
};

type OrderCancellationEventCreateArgs = {
  data: CreateOrderCancelledEventInput | CreateOrderRefundUpdatedEventInput;
};

export type OrderCancellationPrismaClientLike = {
  order: {
    findUnique(args: OrderCancellationOrderFindUniqueArgs): Promise<OrderCancellationOrderRecord | null>;
    update(args: OrderCancellationOrderUpdateArgs): Promise<OrderCancellationOrderRecord>;
  };
  orderStatusHistory: {
    create(args: OrderCancellationStatusHistoryCreateArgs): Promise<OrderCancellationStatusHistoryRecord>;
  };
  orderCancellationAudit: {
    create(args: OrderCancellationAuditCreateArgs): Promise<OrderCancellationAuditRecord>;
  };
  event: {
    create(args: OrderCancellationEventCreateArgs): Promise<OrderCancellationEventRecord>;
  };
};

type OrderCancellationPrismaTransactionalClientLike = OrderCancellationPrismaClientLike & {
  $transaction<T>(callback: (client: OrderCancellationPrismaClientLike) => Promise<T>): Promise<T>;
};

export type OrderCancellationPrismaProvider = {
  readonly client: OrderCancellationPrismaTransactionalClientLike;
};

const mapOrderStatus = (status: string): OrderCancellationOrderStatus =>
  status as OrderCancellationOrderStatus;

const mapPaymentStatus = (status: string): OrderCancellationPaymentStatus =>
  status as OrderCancellationPaymentStatus;

const mapRefundStatus = (status: string): OrderCancellationRefundStatus =>
  status as OrderCancellationRefundStatus;

const isCancellationStatus = (
  status: OrderCancellationOrderStatus,
): status is "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE" =>
  status === "CANCELLED_BY_ADMIN" || status === "CANCELLED_BY_COURIER_UNAVAILABLE";

export class PrismaOrderCancellationRepository implements OrderCancellationRepository {
  constructor(private readonly prisma: OrderCancellationPrismaProvider) {}

  async findOrderById(orderId: string): Promise<OrderCancellationOrderRecord | null> {
    const order = await this.prisma.client.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        paymentStatus: true,
        refundStatus: true,
        refundNote: true,
        cancelledByUserId: true,
        cancellationReasonCode: true,
        cancelledAt: true,
        updatedAt: true,
        isDeleted: true,
      },
    });

    if (order === null) {
      return null;
    }

    return {
      ...order,
      status: mapOrderStatus(order.status),
      paymentStatus: mapPaymentStatus(order.paymentStatus),
      refundStatus: mapRefundStatus(order.refundStatus),
    };
  }

  recordCancellation(
    input: PersistOrderCancellationInput,
  ): Promise<OrderCancellationArtifactsRecord> {
    return this.prisma.client.$transaction(async (transactionClient) => {
      const currentOrder = await transactionClient.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          paymentStatus: true,
          refundStatus: true,
          refundNote: true,
          cancelledByUserId: true,
          cancellationReasonCode: true,
          cancelledAt: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      if (currentOrder === null || currentOrder.isDeleted) {
        throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
          orderId: input.orderId,
        });
      }

      if (currentOrder.status !== input.oldStatus) {
        throw new AppError("CONFLICT", "Order cancellation baseline requires a matching current state", 409, {
          orderId: input.orderId,
          currentStatus: mapOrderStatus(currentOrder.status),
          expectedStatus: input.oldStatus,
        });
      }

      const order = await transactionClient.order.update({
        where: {
          id: input.orderId,
        },
        data: {
          status: input.newStatus,
          cancelledByUserId: input.actor.userId,
          cancellationReasonCode: input.reasonCode,
          cancelledAt: input.cancelledAt,
          refundStatus: input.refundStatus,
          refundNote: input.refundNote,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          paymentStatus: true,
          refundStatus: true,
          refundNote: true,
          cancelledByUserId: true,
          cancellationReasonCode: true,
          cancelledAt: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      const statusHistory = await transactionClient.orderStatusHistory.create({
        data: {
          orderId: input.orderId,
          oldStatus: input.oldStatus,
          newStatus: input.newStatus,
          changedByUserId: input.actor.userId,
          changedAt: input.cancelledAt,
        },
      });

      const audit = await transactionClient.orderCancellationAudit.create({
        data: {
          orderId: input.orderId,
          actorUserId: input.actor.userId,
          actorRole: input.actor.role.toUpperCase() as Uppercase<typeof input.actor.role>,
          action: "cancelled",
          reasonCode: input.reasonCode,
          refundStatus: input.refundStatus,
          refundNote: input.refundNote,
          fromStatus: input.oldStatus,
          toStatus: input.newStatus,
          createdAt: input.cancelledAt,
        },
      });

      const event = await transactionClient.event.create({
        data: {
          type: "order.cancelled",
          entity: "order",
          entityId: input.orderId,
          payload: {
            orderId: input.orderId,
            previousStatus: input.oldStatus,
            status: input.newStatus,
            cancelledByUserId: input.actor.userId,
            actorRole: input.actor.role,
            reasonCode: input.reasonCode,
            refundStatus: input.refundStatus,
            updatedAt: order.updatedAt.toISOString(),
          },
        },
      });

      return {
        order: {
          ...order,
          status: mapOrderStatus(order.status),
          paymentStatus: mapPaymentStatus(order.paymentStatus),
          refundStatus: mapRefundStatus(order.refundStatus),
        },
        statusHistory,
        audit,
        event,
        revision: event.id.toString(),
      };
    });
  }

  recordRefundUpdate(
    input: PersistOrderRefundUpdateInput,
  ): Promise<OrderRefundUpdateArtifactsRecord> {
    return this.prisma.client.$transaction(async (transactionClient) => {
      const currentOrder = await transactionClient.order.findUnique({
        where: {
          id: input.orderId,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          paymentStatus: true,
          refundStatus: true,
          refundNote: true,
          cancelledByUserId: true,
          cancellationReasonCode: true,
          cancelledAt: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      if (currentOrder === null || currentOrder.isDeleted) {
        throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
          orderId: input.orderId,
        });
      }

      const currentStatus = mapOrderStatus(currentOrder.status);

      if (!isCancellationStatus(currentStatus)) {
        throw new AppError("CONFLICT", "Refund baseline requires a cancelled order state", 409, {
          orderId: input.orderId,
          currentStatus,
        });
      }

      const order = await transactionClient.order.update({
        where: {
          id: input.orderId,
        },
        data: {
          refundStatus: input.refundStatus,
          refundNote: input.refundNote,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          paymentStatus: true,
          refundStatus: true,
          refundNote: true,
          cancelledByUserId: true,
          cancellationReasonCode: true,
          cancelledAt: true,
          updatedAt: true,
          isDeleted: true,
        },
      });

      const audit = await transactionClient.orderCancellationAudit.create({
        data: {
          orderId: input.orderId,
          actorUserId: input.actor.userId,
          actorRole: input.actor.role.toUpperCase() as Uppercase<typeof input.actor.role>,
          action: "refund_updated",
          reasonCode: currentOrder.cancellationReasonCode,
          refundStatus: input.refundStatus,
          refundNote: input.refundNote,
          fromStatus: currentStatus,
          toStatus: currentStatus,
          createdAt: input.updatedAt,
        },
      });

      const event = await transactionClient.event.create({
        data: {
          type: "order.refund_updated",
          entity: "order",
          entityId: input.orderId,
          payload: {
            orderId: input.orderId,
            status: currentStatus,
            refundStatus: input.refundStatus,
            refundNote: input.refundNote,
            updatedByUserId: input.actor.userId,
            updatedAt: order.updatedAt.toISOString(),
          },
        },
      });

      return {
        order: {
          ...order,
          status: mapOrderStatus(order.status),
          paymentStatus: mapPaymentStatus(order.paymentStatus),
          refundStatus: mapRefundStatus(order.refundStatus),
        },
        audit,
        event,
        revision: event.id.toString(),
      };
    });
  }
}
