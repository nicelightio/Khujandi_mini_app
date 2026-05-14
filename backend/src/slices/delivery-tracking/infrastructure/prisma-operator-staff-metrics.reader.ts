import type {
  DeliveryTrackingOperatorProcessedOrderMetric,
  DeliveryTrackingOperatorStaffOrderHistory,
  DeliveryTrackingOperatorStaffOrderHistoryItem,
  DeliveryTrackingOperatorStaffOrderHistoryProblemReason,
  DeliveryTrackingUserId,
} from "../domain/delivery-tracking.types";

type OperatorStatusHistoryPrismaRecord = {
  orderId: string;
  changedByUserId: string;
  newStatus?: string;
  changedAt?: Date;
};

type OperatorWriteEventPrismaRecord = {
  type: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt?: Date;
};

type OperatorCancellationAuditPrismaRecord = {
  orderId: string;
  actorUserId: string;
  action: string;
  createdAt?: Date;
};

type OperatorOrderPrismaRecord = {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
};

type OperatorWriteEvidence = {
  operatorAdminAccountId: string;
  orderId: string;
  actionType: string;
  writtenAt: Date;
  status: string | null;
};

type OperatorStaffMetricsPrismaClientLike = {
  order?: {
    findMany(args: {
      where: {
        id: {
          in: string[];
        };
        isDeleted: false;
      };
      select: {
        id: true;
        status: true;
        createdAt: true;
        updatedAt: true;
        isDeleted: true;
      };
    }): Promise<OperatorOrderPrismaRecord[]>;
  };
  orderStatusHistory: {
    findMany(args: {
      where: {
        changedByUserId: {
          in: string[];
        };
      };
      select: {
        orderId: true;
        changedByUserId: true;
        newStatus?: true;
        changedAt?: true;
      };
    }): Promise<OperatorStatusHistoryPrismaRecord[]>;
  };
  event?: {
    findMany(args: {
      where: {
        type: {
          in: string[];
        };
      };
      select: {
        type: true;
        entityId: true;
        payload: true;
        createdAt?: true;
      };
    }): Promise<OperatorWriteEventPrismaRecord[]>;
  };
  orderCancellationAudit?: {
    findMany(args: {
      where: {
        actorUserId: {
          in: string[];
        };
      };
      select: {
        orderId: true;
        actorUserId: true;
        action: true;
        createdAt?: true;
      };
    }): Promise<OperatorCancellationAuditPrismaRecord[]>;
  };
};

export type OperatorStaffMetricsPrismaProvider = {
  readonly client: OperatorStaffMetricsPrismaClientLike;
};

const OPERATOR_WRITE_EVENT_TYPES = [
  "order.assigned",
  "order.offer_created",
  "order.status_changed",
  "order.cancelled",
  "order.refund_updated",
  "order.message_sent",
  "order.message_received",
] as const;
const OPERATOR_WRITE_EVENT_TYPE_SET = new Set<string>(OPERATOR_WRITE_EVENT_TYPES);

const KNOWN_OPERATOR_EVENT_ACTOR_FIELDS = [
  "changedByUserId",
  "createdByUserId",
  "updatedByUserId",
  "cancelledByUserId",
  "assignedByUserId",
  "actorUserId",
  "senderUserId",
] as const;

const readStringField = (payload: Record<string, unknown>, field: string): string | null => {
  const value = payload[field];

  return typeof value === "string" ? value : null;
};

const resolveEventActorUserId = (payload: Record<string, unknown>): string | null => {
  for (const field of KNOWN_OPERATOR_EVENT_ACTOR_FIELDS) {
    const value = readStringField(payload, field);

    if (value !== null) {
      return value;
    }
  }

  return null;
};

const resolveEventOrderId = (event: OperatorWriteEventPrismaRecord): string | null =>
  readStringField(event.payload, "orderId") ?? event.entityId;

const resolveEventStatus = (payload: Record<string, unknown>): string | null =>
  readStringField(payload, "status") ?? readStringField(payload, "newStatus");

const sortByLastWriteAtDesc = (
  rows: DeliveryTrackingOperatorStaffOrderHistoryItem[],
): DeliveryTrackingOperatorStaffOrderHistoryItem[] =>
  [...rows].sort((left, right) => right.lastWriteAt.getTime() - left.lastWriteAt.getTime());

const latestDate = (dates: Date[]): Date =>
  dates.reduce((latest, value) => (value.getTime() > latest.getTime() ? value : latest), new Date(0));

export class PrismaOperatorStaffMetricsReader {
  constructor(private readonly prisma: OperatorStaffMetricsPrismaProvider) {}

  async listOperatorProcessedOrderMetrics(
    operatorAdminAccountIds: DeliveryTrackingUserId[],
  ): Promise<DeliveryTrackingOperatorProcessedOrderMetric[]> {
    const uniqueOperatorIds = [...new Set(operatorAdminAccountIds)];

    if (uniqueOperatorIds.length === 0) {
      return [];
    }

    const processedOrderIdsByOperatorId = new Map<string, Set<string>>(
      uniqueOperatorIds.map((operatorId) => [operatorId, new Set<string>()]),
    );
    const [statusHistory, writeEvents, cancellationAudits] = await Promise.all([
      this.prisma.client.orderStatusHistory.findMany({
        where: {
          changedByUserId: {
            in: uniqueOperatorIds,
          },
        },
        select: {
          orderId: true,
          changedByUserId: true,
        },
      }),
      this.prisma.client.event?.findMany({
        where: {
          type: {
            in: [...OPERATOR_WRITE_EVENT_TYPES],
          },
        },
        select: {
          type: true,
          entityId: true,
          payload: true,
        },
      }) ?? Promise.resolve([]),
      this.prisma.client.orderCancellationAudit?.findMany({
        where: {
          actorUserId: {
            in: uniqueOperatorIds,
          },
        },
        select: {
          orderId: true,
          actorUserId: true,
          action: true,
        },
      }) ?? Promise.resolve([]),
    ]);

    for (const history of statusHistory) {
      processedOrderIdsByOperatorId.get(history.changedByUserId)?.add(history.orderId);
    }

    for (const event of writeEvents) {
      if (!OPERATOR_WRITE_EVENT_TYPE_SET.has(event.type)) {
        continue;
      }

      const actorUserId = resolveEventActorUserId(event.payload);
      const orderId = resolveEventOrderId(event);

      if (actorUserId === null || orderId === null) {
        continue;
      }

      processedOrderIdsByOperatorId.get(actorUserId)?.add(orderId);
    }

    for (const audit of cancellationAudits) {
      if (audit.action !== "cancelled" && audit.action !== "refund_updated") {
        continue;
      }

      processedOrderIdsByOperatorId.get(audit.actorUserId)?.add(audit.orderId);
    }

    return uniqueOperatorIds.map((operatorAdminAccountId) => ({
      operatorAdminAccountId,
      processedOrdersCount: processedOrderIdsByOperatorId.get(operatorAdminAccountId)?.size ?? 0,
    }));
  }

  async listOperatorStaffOrderHistories(
    operatorAdminAccountIds: DeliveryTrackingUserId[],
  ): Promise<DeliveryTrackingOperatorStaffOrderHistory[]> {
    if (this.prisma.client.order?.findMany === undefined) {
      throw new Error("Prisma order.findMany is required for operator staff order histories");
    }

    const uniqueOperatorIds = [...new Set(operatorAdminAccountIds)];

    if (uniqueOperatorIds.length === 0) {
      return [];
    }

    const [statusHistory, writeEvents, cancellationAudits] = await Promise.all([
      this.prisma.client.orderStatusHistory.findMany({
        where: {
          changedByUserId: {
            in: uniqueOperatorIds,
          },
        },
        select: {
          orderId: true,
          changedByUserId: true,
          newStatus: true,
          changedAt: true,
        },
      }),
      this.prisma.client.event?.findMany({
        where: {
          type: {
            in: [...OPERATOR_WRITE_EVENT_TYPES],
          },
        },
        select: {
          type: true,
          entityId: true,
          payload: true,
          createdAt: true,
        },
      }) ?? Promise.resolve([]),
      this.prisma.client.orderCancellationAudit?.findMany({
        where: {
          actorUserId: {
            in: uniqueOperatorIds,
          },
        },
        select: {
          orderId: true,
          actorUserId: true,
          action: true,
          createdAt: true,
        },
      }) ?? Promise.resolve([]),
    ]);
    const evidence: OperatorWriteEvidence[] = [];

    for (const history of statusHistory) {
      evidence.push({
        operatorAdminAccountId: history.changedByUserId,
        orderId: history.orderId,
        actionType: history.newStatus === undefined ? "order.status_changed" : `status:${history.newStatus}`,
        writtenAt: history.changedAt ?? new Date(0),
        status: history.newStatus ?? null,
      });
    }

    for (const event of writeEvents) {
      if (!OPERATOR_WRITE_EVENT_TYPE_SET.has(event.type)) {
        continue;
      }

      const actorUserId = resolveEventActorUserId(event.payload);
      const orderId = resolveEventOrderId(event);

      if (actorUserId === null || orderId === null || !uniqueOperatorIds.includes(actorUserId)) {
        continue;
      }

      evidence.push({
        operatorAdminAccountId: actorUserId,
        orderId,
        actionType: event.type,
        writtenAt: event.createdAt ?? new Date(0),
        status: resolveEventStatus(event.payload),
      });
    }

    for (const audit of cancellationAudits) {
      if (audit.action !== "cancelled" && audit.action !== "refund_updated") {
        continue;
      }

      evidence.push({
        operatorAdminAccountId: audit.actorUserId,
        orderId: audit.orderId,
        actionType: audit.action,
        writtenAt: audit.createdAt ?? new Date(0),
        status: null,
      });
    }

    const orderIds = [...new Set(evidence.map((item) => item.orderId))];
    const orders = orderIds.length === 0
      ? []
      : await this.prisma.client.order.findMany({
          where: {
            id: {
              in: orderIds,
            },
            isDeleted: false,
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            isDeleted: true,
          },
        });
    const ordersById = new Map(orders.map((order) => [order.id, order]));
    const evidenceByOperatorId = new Map<string, OperatorWriteEvidence[]>(
      uniqueOperatorIds.map((operatorId) => [operatorId, []]),
    );

    for (const item of evidence) {
      if (!ordersById.has(item.orderId)) {
        continue;
      }

      evidenceByOperatorId.get(item.operatorAdminAccountId)?.push(item);
    }

    return uniqueOperatorIds.map((operatorAdminAccountId) => {
      const evidenceByOrderId = new Map<string, OperatorWriteEvidence[]>();

      for (const item of evidenceByOperatorId.get(operatorAdminAccountId) ?? []) {
        const existing = evidenceByOrderId.get(item.orderId) ?? [];
        existing.push(item);
        evidenceByOrderId.set(item.orderId, existing);
      }

      const rows = Array.from(evidenceByOrderId.entries()).map(([orderId, orderEvidence]) => {
        const order = ordersById.get(orderId);

        if (order === undefined) {
          throw new Error("Missing order for operator staff order history evidence");
        }

        const actionTypes = [...new Set(orderEvidence.map((item) => item.actionType))];
        const personallyCompleted = orderEvidence.some(
          (item) => item.status === "COMPLETED" || item.actionType === "status:COMPLETED",
        );
        const problemReasons: DeliveryTrackingOperatorStaffOrderHistoryProblemReason[] = [];

        if (
          order.status === "FAILED" ||
          orderEvidence.some((item) => item.status === "FAILED")
        ) {
          problemReasons.push("future_failed");
        }

        if (!personallyCompleted) {
          problemReasons.push("not_personally_completed");
        }

        return {
          orderId,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          lastWriteAt: latestDate(orderEvidence.map((item) => item.writtenAt)),
          actionTypes,
          personallyCompleted,
          problemReasons,
        };
      });
      const sortedRows = sortByLastWriteAtDesc(rows);

      return {
        operatorAdminAccountId,
        lastProcessedOrders: sortedRows.slice(0, 10),
        problemOrders: sortedRows
          .filter((row) => row.problemReasons.length > 0)
          .slice(0, 10),
      };
    });
  }
}
