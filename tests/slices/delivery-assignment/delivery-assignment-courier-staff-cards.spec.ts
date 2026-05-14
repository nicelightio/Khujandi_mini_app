import { PrismaCourierStaffMetricsReader } from "../../../backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader";

describe("delivery-assignment courier staff card read model", () => {
  it("returns courier card metadata, histories, last orders and problem orders without lifecycle mutation", async () => {
    const userFindMany = jest.fn(async () => [
      {
        id: "courier-1",
        telegramId: "10001",
        role: "COURIER",
        name: "Courier One",
        staffNickname: "Courier One",
        ratingScore: -1,
        staffCreatedAt: new Date("2026-05-14T08:00:00.000Z"),
        staffCreatedByAdminAccountId: "admin-1",
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: new Date("2026-05-14T09:00:00.000Z"),
        staffReactivatedByAdminAccountId: "boss-1",
        createdAt: new Date("2026-05-14T07:59:00.000Z"),
        updatedAt: new Date("2026-05-14T09:00:00.000Z"),
      },
    ]);
    const orderFindMany = jest.fn(async () => [
      {
        id: "order-01",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:01:00.000Z"),
        updatedAt: new Date("2026-05-14T08:10:00.000Z"),
      },
      {
        id: "order-02",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:02:00.000Z"),
        updatedAt: new Date("2026-05-14T08:20:00.000Z"),
      },
      {
        id: "order-03",
        courierId: "courier-1",
        status: "CANCELLED_BY_ADMIN",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:03:00.000Z"),
        updatedAt: new Date("2026-05-14T08:30:00.000Z"),
      },
      {
        id: "order-04",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:04:00.000Z"),
        updatedAt: new Date("2026-05-14T08:40:00.000Z"),
      },
      {
        id: "order-05",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:05:00.000Z"),
        updatedAt: new Date("2026-05-14T08:50:00.000Z"),
      },
      {
        id: "order-06",
        courierId: "courier-1",
        status: "DELIVERED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:06:00.000Z"),
        updatedAt: new Date("2026-05-14T09:00:00.000Z"),
      },
      {
        id: "order-07",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:07:00.000Z"),
        updatedAt: new Date("2026-05-14T09:10:00.000Z"),
      },
      {
        id: "order-08-rating-one",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:08:00.000Z"),
        updatedAt: new Date("2026-05-14T09:20:00.000Z"),
      },
      {
        id: "order-09-failed-source",
        courierId: "courier-1",
        status: "FAILED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:09:00.000Z"),
        updatedAt: new Date("2026-05-14T09:30:00.000Z"),
      },
      {
        id: "order-10-delivered-history",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:10:00.000Z"),
        updatedAt: new Date("2026-05-14T09:40:00.000Z"),
      },
      {
        id: "order-11-unfinished",
        courierId: "courier-1",
        status: "IN_PROGRESS",
        isDeleted: false,
        createdAt: new Date("2026-05-14T08:11:00.000Z"),
        updatedAt: new Date("2026-05-14T09:50:00.000Z"),
      },
    ]);
    const orderStatusHistoryFindMany = jest.fn(async () => [
      {
        orderId: "order-10-delivered-history",
      },
    ]);
    const courierStaffRatingAdjustmentFindMany = jest.fn(async () => [
      {
        courierUserId: "courier-1",
        delta: 1 as const,
        actorAdminAccountId: "admin-1",
        reason: "good shift",
        createdAt: new Date("2026-05-14T10:00:00.000Z"),
      },
      {
        courierUserId: "courier-1",
        delta: -1 as const,
        actorAdminAccountId: "boss-1",
        reason: "late",
        createdAt: new Date("2026-05-14T10:05:00.000Z"),
      },
    ]);
    const courierStaffLifecycleEventFindMany = jest.fn(async () => [
      {
        courierUserId: "courier-1",
        actorAdminAccountId: "boss-1",
        action: "REACTIVATED",
        previousNickname: null,
        newNickname: null,
        reason: "returned",
        createdAt: new Date("2026-05-14T09:00:00.000Z"),
      },
      {
        courierUserId: "courier-1",
        actorAdminAccountId: "admin-1",
        action: "DEACTIVATED",
        previousNickname: null,
        newNickname: null,
        reason: "pause",
        createdAt: new Date("2026-05-14T08:30:00.000Z"),
      },
    ]);
    const reader = new PrismaCourierStaffMetricsReader({
      client: {
        user: {
          findMany: userFindMany,
        },
        order: {
          findMany: orderFindMany,
        },
        orderStatusHistory: {
          findMany: orderStatusHistoryFindMany,
        },
        courierStaffRatingAdjustment: {
          findMany: courierStaffRatingAdjustmentFindMany,
        },
        courierStaffLifecycleEvent: {
          findMany: courierStaffLifecycleEventFindMany,
        },
      },
    });

    const [card] = await reader.listCourierStaffCards({
      averageClientReviewRatings: [
        {
          courierUserId: "courier-1",
          averageRating: 4.5,
          reviewCount: 2,
        },
      ],
      problemClientReviewRatings: [
        {
          courierUserId: "courier-1",
          orderId: "order-08-rating-one",
          rating: 1,
          createdAt: new Date("2026-05-14T10:10:00.000Z"),
        },
      ],
    });

    expect(card).toMatchObject({
      courierUserId: "courier-1",
      nickname: "Courier One",
      telegramUserId: "10001",
      activeStatus: "active",
      addedByAdminAccountId: "admin-1",
      addedAt: new Date("2026-05-14T08:00:00.000Z"),
      reactivatedByAdminAccountId: "boss-1",
      deliveredOrdersCount: 2,
      manualRatingAdjustment: 0,
      automaticPenalties: -1,
      courierOrderRating: -1,
      courierAverageReviewRating: 4.5,
      courierClientReviewCount: 2,
      unsuccessfulOrdersCount: 1,
      unsuccessfulPercent: (1 / 3) * 100,
    });
    expect(card.lastOrders.map((order) => order.orderId)).toEqual([
      "order-11-unfinished",
      "order-10-delivered-history",
      "order-09-failed-source",
      "order-08-rating-one",
      "order-07",
      "order-06",
      "order-05",
      "order-04",
      "order-03",
      "order-02",
    ]);
    expect(card.problemOrders.map((order) => [order.orderId, order.problemReasons])).toEqual([
      ["order-11-unfinished", ["unfinished"]],
      ["order-09-failed-source", ["future_failed"]],
      ["order-08-rating-one", ["client_rating_1"]],
    ]);
    expect(card.deactivationHistory).toHaveLength(1);
    expect(card.reactivationHistory).toHaveLength(1);
    expect(card.manualRatingAdjustmentHistory.map((item) => item.delta)).toEqual([-1, 1]);
    expect(orderFindMany).toHaveBeenCalledWith({
      where: {
        courierId: {
          in: ["courier-1"],
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
    });
  });
});
