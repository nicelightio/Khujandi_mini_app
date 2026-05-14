import type {
  DeliveryAssignmentCourierAverageClientReviewRatingInput,
  DeliveryAssignmentCourierProblemReviewRatingInput,
  DeliveryAssignmentCourierStaffCardLifecycleHistoryItem,
  DeliveryAssignmentCourierStaffCardOrder,
  DeliveryAssignmentCourierStaffCardOrderProblemReason,
  DeliveryAssignmentCourierStaffCardRatingAdjustmentHistoryItem,
  DeliveryAssignmentCourierStaffCardReadModel,
  DeliveryAssignmentCourierStaffTableMetricRow,
} from "../domain/delivery-assignment.types";

type CourierStaffPrismaRecord = {
  id: string;
  telegramId: string;
  role: string;
  name?: string;
  staffNickname: string | null;
  ratingScore: number;
  staffDeactivatedAt: Date | null;
  staffCreatedAt?: Date | null;
  staffCreatedByAdminAccountId?: string | null;
  staffDeactivatedByAdminAccountId?: string | null;
  staffReactivatedAt?: Date | null;
  staffReactivatedByAdminAccountId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type CourierOrderPrismaRecord = {
  id: string;
  courierId: string | null;
  status: string;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type CourierDeliveredHistoryPrismaRecord = {
  orderId: string;
};

type CourierLifecycleEventPrismaRecord = {
  courierUserId: string;
  actorAdminAccountId: string;
  action: string;
  previousNickname: string | null;
  newNickname: string | null;
  reason: string | null;
  createdAt: Date;
};

type CourierRatingAdjustmentPrismaRecord = {
  courierUserId: string;
  delta: -1 | 1;
  actorAdminAccountId?: string;
  reason?: string | null;
  createdAt?: Date;
};

type CourierStaffMetricsPrismaClientLike = {
  user: {
    findMany(args: {
      where: {
        role: "COURIER";
      };
      select: {
        id: true;
        telegramId: true;
        role: true;
        name?: true;
        staffNickname: true;
        ratingScore: true;
        staffDeactivatedAt: true;
        staffCreatedAt?: true;
        staffCreatedByAdminAccountId?: true;
        staffDeactivatedByAdminAccountId?: true;
        staffReactivatedAt?: true;
        staffReactivatedByAdminAccountId?: true;
        createdAt?: true;
        updatedAt?: true;
      };
    }): Promise<CourierStaffPrismaRecord[]>;
  };
  order: {
    findMany(args: {
      where: {
        courierId: {
          in: string[];
        };
        isDeleted: false;
      };
      select: {
        id: true;
        courierId: true;
        status: true;
        isDeleted: true;
        createdAt?: true;
        updatedAt?: true;
      };
    }): Promise<CourierOrderPrismaRecord[]>;
  };
  orderStatusHistory: {
    findMany(args: {
      where: {
        orderId: {
          in: string[];
        };
        newStatus: "DELIVERED";
      };
      select: {
        orderId: true;
      };
    }): Promise<CourierDeliveredHistoryPrismaRecord[]>;
  };
  courierStaffRatingAdjustment: {
    findMany(args: {
      where: {
        courierUserId: {
          in: string[];
        };
      };
      select: {
        courierUserId: true;
        delta: true;
        actorAdminAccountId?: true;
        reason?: true;
        createdAt?: true;
      };
    }): Promise<CourierRatingAdjustmentPrismaRecord[]>;
  };
  courierStaffLifecycleEvent?: {
    findMany(args: {
      where: {
        courierUserId: {
          in: string[];
        };
      };
      select: {
        courierUserId: true;
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
    }): Promise<CourierLifecycleEventPrismaRecord[]>;
  };
};

export type CourierStaffMetricsPrismaProvider = {
  readonly client: CourierStaffMetricsPrismaClientLike;
};

const UNSUCCESSFUL_COURIER_ORDER_STATUSES = new Set([
  "CANCELLED_BY_ADMIN",
  "CANCELLED_BY_COURIER_UNAVAILABLE",
]);

const COURIER_UNFINISHED_PROBLEM_STATUSES = new Set([
  "CREATED",
  "DELAYED",
  "ASSIGNED",
  "PICKED_UP",
  "IN_PROGRESS",
]);

const buildRatingMap = (
  ratings: DeliveryAssignmentCourierAverageClientReviewRatingInput[] = [],
): Map<string, DeliveryAssignmentCourierAverageClientReviewRatingInput> =>
  new Map(ratings.map((rating) => [rating.courierUserId, rating]));

const buildProblemReviewMap = (
  ratings: DeliveryAssignmentCourierProblemReviewRatingInput[] = [],
): Map<string, DeliveryAssignmentCourierProblemReviewRatingInput> =>
  new Map(
    ratings
      .filter((rating) => rating.rating === 1)
      .map((rating) => [rating.orderId, rating]),
  );

const sortByCreatedAtDesc = <T extends { createdAt: Date }>(items: T[]): T[] =>
  [...items].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

const sortOrdersByCreatedAtDesc = (orders: CourierOrderPrismaRecord[]): CourierOrderPrismaRecord[] =>
  [...orders].sort((left, right) => {
    const leftCreatedAt = left.createdAt ?? left.updatedAt ?? new Date(0);
    const rightCreatedAt = right.createdAt ?? right.updatedAt ?? new Date(0);

    return rightCreatedAt.getTime() - leftCreatedAt.getTime();
  });

const mapLifecycleHistory = (
  events: CourierLifecycleEventPrismaRecord[],
): DeliveryAssignmentCourierStaffCardLifecycleHistoryItem[] =>
  sortByCreatedAtDesc(events).map((event) => ({
    actorAdminAccountId: event.actorAdminAccountId,
    action: event.action.toLowerCase() as DeliveryAssignmentCourierStaffCardLifecycleHistoryItem["action"],
    previousNickname: event.previousNickname,
    newNickname: event.newNickname,
    reason: event.reason,
    createdAt: event.createdAt,
  }));

const mapRatingAdjustmentHistory = (
  adjustments: CourierRatingAdjustmentPrismaRecord[],
): DeliveryAssignmentCourierStaffCardRatingAdjustmentHistoryItem[] =>
  sortByCreatedAtDesc(
    adjustments.filter(
      (
        adjustment,
      ): adjustment is CourierRatingAdjustmentPrismaRecord & {
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

export class PrismaCourierStaffMetricsReader {
  constructor(private readonly prisma: CourierStaffMetricsPrismaProvider) {}

  async listCourierStaffTableMetrics(input: {
    averageClientReviewRatings?: DeliveryAssignmentCourierAverageClientReviewRatingInput[];
  } = {}): Promise<DeliveryAssignmentCourierStaffTableMetricRow[]> {
    const couriers = await this.prisma.client.user.findMany({
      where: {
        role: "COURIER",
      },
      select: {
        id: true,
        telegramId: true,
        role: true,
        staffNickname: true,
        ratingScore: true,
        staffDeactivatedAt: true,
      },
    });
    const courierIds = couriers
      .filter((courier) => courier.role === "COURIER")
      .map((courier) => courier.id);

    if (courierIds.length === 0) {
      return [];
    }

    const [orders, adjustments] = await Promise.all([
      this.prisma.client.order.findMany({
        where: {
          courierId: {
            in: courierIds,
          },
          isDeleted: false,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          isDeleted: true,
        },
      }),
      this.prisma.client.courierStaffRatingAdjustment.findMany({
        where: {
          courierUserId: {
            in: courierIds,
          },
        },
        select: {
          courierUserId: true,
          delta: true,
        },
      }),
    ]);
    const deliveredHistory = orders.length === 0
      ? []
      : await this.prisma.client.orderStatusHistory.findMany({
          where: {
            orderId: {
              in: orders.map((order) => order.id),
            },
            newStatus: "DELIVERED",
          },
          select: {
            orderId: true,
          },
        });
    const deliveredHistoryOrderIds = new Set(deliveredHistory.map((history) => history.orderId));
    const reviewRatingsByCourierId = buildRatingMap(input.averageClientReviewRatings);
    const ordersByCourierId = new Map<string, CourierOrderPrismaRecord[]>();
    const manualAdjustmentByCourierId = new Map<string, number>();

    for (const order of orders) {
      if (order.courierId === null || order.isDeleted) {
        continue;
      }

      const existing = ordersByCourierId.get(order.courierId) ?? [];
      existing.push(order);
      ordersByCourierId.set(order.courierId, existing);
    }

    for (const adjustment of adjustments) {
      manualAdjustmentByCourierId.set(
        adjustment.courierUserId,
        (manualAdjustmentByCourierId.get(adjustment.courierUserId) ?? 0) + adjustment.delta,
      );
    }

    return couriers
      .filter((courier) => courier.role === "COURIER")
      .map((courier) => {
        const courierOrders = ordersByCourierId.get(courier.id) ?? [];
        const deliveredOrderIds = new Set(
          courierOrders
            .filter((order) => order.status === "DELIVERED" || deliveredHistoryOrderIds.has(order.id))
            .map((order) => order.id),
        );
        const unsuccessfulOrderIds = new Set(
          courierOrders
            .filter((order) => UNSUCCESSFUL_COURIER_ORDER_STATUSES.has(order.status))
            .map((order) => order.id),
        );
        const deliveredOrdersCount = deliveredOrderIds.size;
        const unsuccessfulOrdersCount = unsuccessfulOrderIds.size;
        const unsuccessfulDenominator = deliveredOrdersCount + unsuccessfulOrdersCount;
        const manualRatingAdjustment = manualAdjustmentByCourierId.get(courier.id) ?? 0;
        const automaticPenalties = courier.ratingScore;
        const reviewRating = reviewRatingsByCourierId.get(courier.id);

        return {
          courierUserId: courier.id,
          nickname: courier.staffNickname,
          telegramUserId: courier.telegramId,
          activeStatus: courier.staffDeactivatedAt === null ? "active" : "soft_deleted",
          deliveredOrdersCount,
          manualRatingAdjustment,
          automaticPenalties,
          courierOrderRating:
            Math.floor(deliveredOrdersCount / 100) + manualRatingAdjustment + automaticPenalties,
          courierAverageReviewRating: reviewRating?.averageRating ?? null,
          courierClientReviewCount: reviewRating?.reviewCount ?? 0,
          unsuccessfulOrdersCount,
          unsuccessfulPercent:
            unsuccessfulDenominator === 0
              ? 0
              : (unsuccessfulOrdersCount / unsuccessfulDenominator) * 100,
        };
      });
  }

  async listCourierStaffCards(input: {
    averageClientReviewRatings?: DeliveryAssignmentCourierAverageClientReviewRatingInput[];
    problemClientReviewRatings?: DeliveryAssignmentCourierProblemReviewRatingInput[];
  } = {}): Promise<DeliveryAssignmentCourierStaffCardReadModel[]> {
    if (this.prisma.client.courierStaffLifecycleEvent?.findMany === undefined) {
      throw new Error("Prisma courierStaffLifecycleEvent.findMany is required for courier staff cards");
    }

    const couriers = await this.prisma.client.user.findMany({
      where: {
        role: "COURIER",
      },
      select: {
        id: true,
        telegramId: true,
        role: true,
        name: true,
        staffNickname: true,
        ratingScore: true,
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
    const courierIds = couriers
      .filter((courier) => courier.role === "COURIER")
      .map((courier) => courier.id);

    if (courierIds.length === 0) {
      return [];
    }

    const [orders, adjustments, lifecycleEvents] = await Promise.all([
      this.prisma.client.order.findMany({
        where: {
          courierId: {
            in: courierIds,
          },
          isDeleted: false,
        },
        select: {
          id: true,
          courierId: true,
          status: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.client.courierStaffRatingAdjustment.findMany({
        where: {
          courierUserId: {
            in: courierIds,
          },
        },
        select: {
          courierUserId: true,
          delta: true,
          actorAdminAccountId: true,
          reason: true,
          createdAt: true,
        },
      }),
      this.prisma.client.courierStaffLifecycleEvent.findMany({
        where: {
          courierUserId: {
            in: courierIds,
          },
        },
        select: {
          courierUserId: true,
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
    const deliveredHistory = orders.length === 0
      ? []
      : await this.prisma.client.orderStatusHistory.findMany({
          where: {
            orderId: {
              in: orders.map((order) => order.id),
            },
            newStatus: "DELIVERED",
          },
          select: {
            orderId: true,
          },
        });
    const deliveredHistoryOrderIds = new Set(deliveredHistory.map((history) => history.orderId));
    const reviewRatingsByCourierId = buildRatingMap(input.averageClientReviewRatings);
    const problemReviewByOrderId = buildProblemReviewMap(input.problemClientReviewRatings);
    const ordersByCourierId = new Map<string, CourierOrderPrismaRecord[]>();
    const adjustmentsByCourierId = new Map<string, CourierRatingAdjustmentPrismaRecord[]>();
    const lifecycleEventsByCourierId = new Map<string, CourierLifecycleEventPrismaRecord[]>();

    for (const order of orders) {
      if (order.courierId === null || order.isDeleted) {
        continue;
      }

      const existing = ordersByCourierId.get(order.courierId) ?? [];
      existing.push(order);
      ordersByCourierId.set(order.courierId, existing);
    }

    for (const adjustment of adjustments) {
      const existing = adjustmentsByCourierId.get(adjustment.courierUserId) ?? [];
      existing.push(adjustment);
      adjustmentsByCourierId.set(adjustment.courierUserId, existing);
    }

    for (const event of lifecycleEvents) {
      const existing = lifecycleEventsByCourierId.get(event.courierUserId) ?? [];
      existing.push(event);
      lifecycleEventsByCourierId.set(event.courierUserId, existing);
    }

    return couriers
      .filter((courier) => courier.role === "COURIER")
      .map((courier) => {
        const courierOrders = ordersByCourierId.get(courier.id) ?? [];
        const courierAdjustments = adjustmentsByCourierId.get(courier.id) ?? [];
        const manualRatingAdjustment = courierAdjustments.reduce(
          (sum, adjustment) => sum + adjustment.delta,
          0,
        );
        const deliveredOrderIds = new Set(
          courierOrders
            .filter((order) => order.status === "DELIVERED" || deliveredHistoryOrderIds.has(order.id))
            .map((order) => order.id),
        );
        const unsuccessfulOrderIds = new Set(
          courierOrders
            .filter((order) => UNSUCCESSFUL_COURIER_ORDER_STATUSES.has(order.status))
            .map((order) => order.id),
        );
        const deliveredOrdersCount = deliveredOrderIds.size;
        const unsuccessfulOrdersCount = unsuccessfulOrderIds.size;
        const unsuccessfulDenominator = deliveredOrdersCount + unsuccessfulOrdersCount;
        const reviewRating = reviewRatingsByCourierId.get(courier.id);
        const lifecycleHistory = mapLifecycleHistory(lifecycleEventsByCourierId.get(courier.id) ?? []);
        const sortedOrders = sortOrdersByCreatedAtDesc(courierOrders);
        const mapOrder = (order: CourierOrderPrismaRecord): DeliveryAssignmentCourierStaffCardOrder => {
          const problemReview = problemReviewByOrderId.get(order.id);
          const problemReasons: DeliveryAssignmentCourierStaffCardOrderProblemReason[] = [];

          if (COURIER_UNFINISHED_PROBLEM_STATUSES.has(order.status)) {
            problemReasons.push("unfinished");
          }

          if (order.status === "FAILED") {
            problemReasons.push("future_failed");
          }

          if (problemReview?.courierUserId === courier.id && problemReview.rating === 1) {
            problemReasons.push("client_rating_1");
          }

          return {
            orderId: order.id,
            status: order.status,
            createdAt: order.createdAt ?? order.updatedAt ?? new Date(0),
            updatedAt: order.updatedAt ?? order.createdAt ?? new Date(0),
            clientReviewRating:
              problemReview?.courierUserId === courier.id ? problemReview.rating : null,
            problemReasons,
          };
        };
        const lastOrders = sortedOrders.slice(0, 10).map(mapOrder);
        const problemOrders = sortedOrders
          .map(mapOrder)
          .filter((order) => order.problemReasons.length > 0)
          .slice(0, 10);

        return {
          courierUserId: courier.id,
          nickname: courier.staffNickname,
          telegramUserId: courier.telegramId,
          activeStatus: courier.staffDeactivatedAt === null ? "active" : "soft_deleted",
          addedByAdminAccountId: courier.staffCreatedByAdminAccountId ?? null,
          addedAt: courier.staffCreatedAt ?? courier.createdAt ?? null,
          deactivatedByAdminAccountId: courier.staffDeactivatedByAdminAccountId ?? null,
          deactivatedAt: courier.staffDeactivatedAt,
          reactivatedByAdminAccountId: courier.staffReactivatedByAdminAccountId ?? null,
          reactivatedAt: courier.staffReactivatedAt ?? null,
          lifecycleHistory,
          deactivationHistory: lifecycleHistory.filter((event) => event.action === "deactivated"),
          reactivationHistory: lifecycleHistory.filter((event) => event.action === "reactivated"),
          manualRatingAdjustmentHistory: mapRatingAdjustmentHistory(courierAdjustments),
          deliveredOrdersCount,
          manualRatingAdjustment,
          automaticPenalties: courier.ratingScore,
          courierOrderRating:
            Math.floor(deliveredOrdersCount / 100) + manualRatingAdjustment + courier.ratingScore,
          courierAverageReviewRating: reviewRating?.averageRating ?? null,
          courierClientReviewCount: reviewRating?.reviewCount ?? 0,
          unsuccessfulOrdersCount,
          unsuccessfulPercent:
            unsuccessfulDenominator === 0
              ? 0
              : (unsuccessfulOrdersCount / unsuccessfulDenominator) * 100,
          lastOrders,
          problemOrders,
        };
      });
  }
}
