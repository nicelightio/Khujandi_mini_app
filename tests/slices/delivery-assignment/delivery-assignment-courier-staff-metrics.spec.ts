import { PrismaCourierStaffMetricsReader } from "../../../backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader";

describe("delivery-assignment courier staff table metrics read model", () => {
  it("counts delivered courier orders by DELIVERED reach, applies rating formula, and excludes active orders from unsuccessful percent", async () => {
    const userFindMany = jest.fn(async () => [
      {
        id: "courier-1",
        telegramId: "10001",
        role: "COURIER",
        staffNickname: "Courier One",
        ratingScore: -1,
        staffDeactivatedAt: null,
      },
      {
        id: "courier-2",
        telegramId: "10002",
        role: "COURIER",
        staffNickname: "Courier Two",
        ratingScore: 0,
        staffDeactivatedAt: new Date("2026-05-14T10:00:00.000Z"),
      },
      {
        id: "client-1",
        telegramId: "90001",
        role: "CLIENT",
        staffNickname: null,
        ratingScore: 0,
        staffDeactivatedAt: null,
      },
    ]);
    const orderFindMany = jest.fn(async () => [
      {
        id: "order-delivered-current",
        courierId: "courier-1",
        status: "DELIVERED",
        isDeleted: false,
      },
      {
        id: "order-completed-after-delivered",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
      },
      {
        id: "order-completed-without-delivered-history",
        courierId: "courier-1",
        status: "COMPLETED",
        isDeleted: false,
      },
      {
        id: "order-cancelled",
        courierId: "courier-1",
        status: "CANCELLED_BY_ADMIN",
        isDeleted: false,
      },
      {
        id: "order-active",
        courierId: "courier-1",
        status: "IN_PROGRESS",
        isDeleted: false,
      },
      {
        id: "order-courier-two-cancelled",
        courierId: "courier-2",
        status: "CANCELLED_BY_COURIER_UNAVAILABLE",
        isDeleted: false,
      },
    ]);
    const orderStatusHistoryFindMany = jest.fn(async () => [
      {
        orderId: "order-completed-after-delivered",
      },
    ]);
    const courierStaffRatingAdjustmentFindMany = jest.fn(async () => [
      {
        courierUserId: "courier-1",
        delta: 1 as const,
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
      },
    });

    await expect(
      reader.listCourierStaffTableMetrics({
        averageClientReviewRatings: [
          {
            courierUserId: "courier-1",
            averageRating: 4,
            reviewCount: 2,
          },
        ],
      }),
    ).resolves.toEqual([
      {
        courierUserId: "courier-1",
        nickname: "Courier One",
        telegramUserId: "10001",
        activeStatus: "active",
        deliveredOrdersCount: 2,
        manualRatingAdjustment: 1,
        automaticPenalties: -1,
        courierOrderRating: 0,
        courierAverageReviewRating: 4,
        courierClientReviewCount: 2,
        unsuccessfulOrdersCount: 1,
        unsuccessfulPercent: (1 / 3) * 100,
      },
      {
        courierUserId: "courier-2",
        nickname: "Courier Two",
        telegramUserId: "10002",
        activeStatus: "soft_deleted",
        deliveredOrdersCount: 0,
        manualRatingAdjustment: 0,
        automaticPenalties: 0,
        courierOrderRating: 0,
        courierAverageReviewRating: null,
        courierClientReviewCount: 0,
        unsuccessfulOrdersCount: 1,
        unsuccessfulPercent: 100,
      },
    ]);

    expect(userFindMany).toHaveBeenCalledWith({
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
    expect(orderFindMany).toHaveBeenCalledWith({
      where: {
        courierId: {
          in: ["courier-1", "courier-2"],
        },
        isDeleted: false,
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        isDeleted: true,
      },
    });
    expect(orderStatusHistoryFindMany).toHaveBeenCalledWith({
      where: {
        orderId: {
          in: [
            "order-delivered-current",
            "order-completed-after-delivered",
            "order-completed-without-delivered-history",
            "order-cancelled",
            "order-active",
            "order-courier-two-cancelled",
          ],
        },
        newStatus: "DELIVERED",
      },
      select: {
        orderId: true,
      },
    });
  });
});
