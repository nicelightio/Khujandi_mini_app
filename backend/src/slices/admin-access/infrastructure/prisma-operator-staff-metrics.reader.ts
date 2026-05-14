import type {
  AdminAccessOperatorStaffCardLifecycleHistoryItem,
  AdminAccessOperatorStaffCardOrderHistoryInput,
  AdminAccessOperatorStaffCardRatingAdjustmentHistoryItem,
  AdminAccessOperatorStaffCardReadModel,
  AdminAccessOperatorProcessedOrderMetricInput,
  AdminAccessOperatorStaffTableMetricRow,
} from "../domain/admin-access.types";

type OperatorStaffPrismaRecord = {
  id: string;
  login: string;
  role: string;
  nickname: string | null;
  isActive: boolean;
  staffDeactivatedAt: Date | null;
  staffCreatedAt?: Date | null;
  staffCreatedByAdminAccountId?: string | null;
  staffDeactivatedByAdminAccountId?: string | null;
  staffReactivatedAt?: Date | null;
  staffReactivatedByAdminAccountId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type OperatorStaffLifecycleEventPrismaRecord = {
  operatorAdminAccountId: string;
  actorAdminAccountId: string;
  action: string;
  previousNickname: string | null;
  newNickname: string | null;
  reason: string | null;
  createdAt: Date;
};

type OperatorRatingAdjustmentPrismaRecord = {
  operatorAdminAccountId: string;
  delta: -1 | 1;
  actorAdminAccountId?: string;
  reason?: string | null;
  createdAt?: Date;
};

type OperatorStaffMetricsPrismaClientLike = {
  adminAccount: {
    findMany(args: {
      where: {
        role: "OPERATOR";
      };
      select: {
        id: true;
        login: true;
        role: true;
        nickname: true;
        isActive: true;
        staffDeactivatedAt: true;
        staffCreatedAt?: true;
        staffCreatedByAdminAccountId?: true;
        staffDeactivatedByAdminAccountId?: true;
        staffReactivatedAt?: true;
        staffReactivatedByAdminAccountId?: true;
        createdAt?: true;
        updatedAt?: true;
      };
    }): Promise<OperatorStaffPrismaRecord[]>;
  };
  operatorStaffRatingAdjustment: {
    findMany(args: {
      where: {
        operatorAdminAccountId: {
          in: string[];
        };
      };
      select: {
        operatorAdminAccountId: true;
        delta: true;
        actorAdminAccountId?: true;
        reason?: true;
        createdAt?: true;
      };
    }): Promise<OperatorRatingAdjustmentPrismaRecord[]>;
  };
  operatorStaffLifecycleEvent?: {
    findMany(args: {
      where: {
        operatorAdminAccountId: {
          in: string[];
        };
      };
      select: {
        operatorAdminAccountId: true;
        actorAdminAccountId: true;
        action: true;
        previousNickname: true;
        newNickname: true;
        reason: true;
        createdAt: true;
      };
      orderBy: {
        createdAt: "desc";
      };
    }): Promise<OperatorStaffLifecycleEventPrismaRecord[]>;
  };
};

export type OperatorStaffMetricsPrismaProvider = {
  readonly client: OperatorStaffMetricsPrismaClientLike;
};

const sortByCreatedAtDesc = <T extends { createdAt: Date }>(items: T[]): T[] =>
  [...items].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

const mapLifecycleHistory = (
  events: OperatorStaffLifecycleEventPrismaRecord[],
): AdminAccessOperatorStaffCardLifecycleHistoryItem[] =>
  sortByCreatedAtDesc(events).map((event) => ({
    actorAdminAccountId: event.actorAdminAccountId,
    action: event.action.toLowerCase() as AdminAccessOperatorStaffCardLifecycleHistoryItem["action"],
    previousNickname: event.previousNickname,
    newNickname: event.newNickname,
    reason: event.reason,
    createdAt: event.createdAt,
  }));

const mapRatingAdjustmentHistory = (
  adjustments: OperatorRatingAdjustmentPrismaRecord[],
): AdminAccessOperatorStaffCardRatingAdjustmentHistoryItem[] =>
  sortByCreatedAtDesc(
    adjustments.filter(
      (
        adjustment,
      ): adjustment is OperatorRatingAdjustmentPrismaRecord & {
        actorAdminAccountId: string;
        createdAt: Date;
      } => adjustment.actorAdminAccountId !== undefined && adjustment.createdAt !== undefined,
    ),
  ).map((adjustment) => ({
    actorAdminAccountId: adjustment.actorAdminAccountId,
    delta: adjustment.delta,
    reason: adjustment.reason ?? null,
    createdAt: adjustment.createdAt,
  }));

export class PrismaAdminAccessOperatorStaffMetricsReader {
  constructor(private readonly prisma: OperatorStaffMetricsPrismaProvider) {}

  async listOperatorStaffTableMetrics(input: {
    processedOrderMetrics?: AdminAccessOperatorProcessedOrderMetricInput[];
  } = {}): Promise<AdminAccessOperatorStaffTableMetricRow[]> {
    const operators = await this.prisma.client.adminAccount.findMany({
      where: {
        role: "OPERATOR",
      },
      select: {
        id: true,
        login: true,
        role: true,
        nickname: true,
        isActive: true,
        staffDeactivatedAt: true,
      },
    });
    const operatorIds = operators
      .filter((operator) => operator.role === "OPERATOR")
      .map((operator) => operator.id);

    if (operatorIds.length === 0) {
      return [];
    }

    const adjustments = await this.prisma.client.operatorStaffRatingAdjustment.findMany({
      where: {
        operatorAdminAccountId: {
          in: operatorIds,
        },
      },
      select: {
        operatorAdminAccountId: true,
        delta: true,
      },
    });
    const processedOrdersByOperatorId = new Map(
      (input.processedOrderMetrics ?? []).map((metric) => [
        metric.operatorAdminAccountId,
        metric.processedOrdersCount,
      ]),
    );
    const manualAdjustmentByOperatorId = new Map<string, number>();

    for (const adjustment of adjustments) {
      manualAdjustmentByOperatorId.set(
        adjustment.operatorAdminAccountId,
        (manualAdjustmentByOperatorId.get(adjustment.operatorAdminAccountId) ?? 0) + adjustment.delta,
      );
    }

    return operators
      .filter((operator) => operator.role === "OPERATOR")
      .map((operator) => {
        const processedOrdersCount = processedOrdersByOperatorId.get(operator.id) ?? 0;
        const manualRatingAdjustment = manualAdjustmentByOperatorId.get(operator.id) ?? 0;

        return {
          operatorAdminAccountId: operator.id,
          nickname: operator.nickname,
          email: operator.login,
          activeStatus: operator.staffDeactivatedAt === null ? "active" : "soft_deleted",
          authActive: operator.isActive,
          processedOrdersCount,
          manualRatingAdjustment,
          operatorRating: Math.floor(processedOrdersCount / 100) + manualRatingAdjustment,
        };
      });
  }

  async listOperatorStaffCards(input: {
    processedOrderMetrics?: AdminAccessOperatorProcessedOrderMetricInput[];
    orderHistories?: AdminAccessOperatorStaffCardOrderHistoryInput[];
  } = {}): Promise<AdminAccessOperatorStaffCardReadModel[]> {
    if (this.prisma.client.operatorStaffLifecycleEvent?.findMany === undefined) {
      throw new Error("Prisma operatorStaffLifecycleEvent.findMany is required for operator staff cards");
    }

    const operators = await this.prisma.client.adminAccount.findMany({
      where: {
        role: "OPERATOR",
      },
      select: {
        id: true,
        login: true,
        role: true,
        nickname: true,
        isActive: true,
        staffCreatedAt: true,
        staffCreatedByAdminAccountId: true,
        staffDeactivatedAt: true,
        staffDeactivatedByAdminAccountId: true,
        staffReactivatedAt: true,
        staffReactivatedByAdminAccountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const operatorIds = operators
      .filter((operator) => operator.role === "OPERATOR")
      .map((operator) => operator.id);

    if (operatorIds.length === 0) {
      return [];
    }

    const [adjustments, lifecycleEvents] = await Promise.all([
      this.prisma.client.operatorStaffRatingAdjustment.findMany({
        where: {
          operatorAdminAccountId: {
            in: operatorIds,
          },
        },
        select: {
          operatorAdminAccountId: true,
          delta: true,
          actorAdminAccountId: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.prisma.client.operatorStaffLifecycleEvent.findMany({
        where: {
          operatorAdminAccountId: {
            in: operatorIds,
          },
        },
        select: {
          operatorAdminAccountId: true,
          actorAdminAccountId: true,
          action: true,
          previousNickname: true,
          newNickname: true,
          reason: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);
    const processedOrdersByOperatorId = new Map(
      (input.processedOrderMetrics ?? []).map((metric) => [
        metric.operatorAdminAccountId,
        metric.processedOrdersCount,
      ]),
    );
    const orderHistoryByOperatorId = new Map(
      (input.orderHistories ?? []).map((history) => [history.operatorAdminAccountId, history]),
    );
    const adjustmentsByOperatorId = new Map<string, OperatorRatingAdjustmentPrismaRecord[]>();
    const lifecycleEventsByOperatorId = new Map<string, OperatorStaffLifecycleEventPrismaRecord[]>();

    for (const adjustment of adjustments) {
      const existing = adjustmentsByOperatorId.get(adjustment.operatorAdminAccountId) ?? [];
      existing.push(adjustment);
      adjustmentsByOperatorId.set(adjustment.operatorAdminAccountId, existing);
    }

    for (const event of lifecycleEvents) {
      const existing = lifecycleEventsByOperatorId.get(event.operatorAdminAccountId) ?? [];
      existing.push(event);
      lifecycleEventsByOperatorId.set(event.operatorAdminAccountId, existing);
    }

    return operators
      .filter((operator) => operator.role === "OPERATOR")
      .map((operator) => {
        const operatorAdjustments = adjustmentsByOperatorId.get(operator.id) ?? [];
        const manualRatingAdjustment = operatorAdjustments.reduce(
          (sum, adjustment) => sum + adjustment.delta,
          0,
        );
        const processedOrdersCount = processedOrdersByOperatorId.get(operator.id) ?? 0;
        const lifecycleHistory = mapLifecycleHistory(lifecycleEventsByOperatorId.get(operator.id) ?? []);
        const orderHistory = orderHistoryByOperatorId.get(operator.id);

        return {
          operatorAdminAccountId: operator.id,
          nickname: operator.nickname,
          email: operator.login,
          activeStatus: operator.staffDeactivatedAt === null ? "active" : "soft_deleted",
          authActive: operator.isActive,
          addedByAdminAccountId: operator.staffCreatedByAdminAccountId ?? null,
          addedAt: operator.staffCreatedAt ?? operator.createdAt ?? null,
          deactivatedByAdminAccountId: operator.staffDeactivatedByAdminAccountId ?? null,
          deactivatedAt: operator.staffDeactivatedAt,
          reactivatedByAdminAccountId: operator.staffReactivatedByAdminAccountId ?? null,
          reactivatedAt: operator.staffReactivatedAt ?? null,
          lifecycleHistory,
          deactivationHistory: lifecycleHistory.filter((event) => event.action === "deactivated"),
          reactivationHistory: lifecycleHistory.filter((event) => event.action === "reactivated"),
          manualRatingAdjustmentHistory: mapRatingAdjustmentHistory(operatorAdjustments),
          processedOrdersCount,
          manualRatingAdjustment,
          operatorRating: Math.floor(processedOrdersCount / 100) + manualRatingAdjustment,
          lastProcessedOrders: orderHistory?.lastProcessedOrders ?? [],
          problemOrders: orderHistory?.problemOrders ?? [],
        };
      });
  }
}
