import { PrismaAdminAccessOperatorStaffMetricsReader } from "../../../backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader";

describe("admin-access operator staff card read model", () => {
  it("composes operator card metadata, histories, rating history and delivery-tracking order blocks", async () => {
    const adminAccountFindMany = jest.fn(async () => [
      {
        id: "operator-1",
        login: "operator1@example.com",
        role: "OPERATOR",
        nickname: "Operator One",
        isActive: true,
        staffCreatedAt: new Date("2026-05-14T08:00:00.000Z"),
        staffCreatedByAdminAccountId: "admin-1",
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: new Date("2026-05-14T09:00:00.000Z"),
        staffReactivatedByAdminAccountId: "boss-1",
        createdAt: new Date("2026-05-14T07:59:00.000Z"),
        updatedAt: new Date("2026-05-14T09:00:00.000Z"),
      },
      {
        id: "admin-1",
        login: "admin@example.com",
        role: "ADMIN",
        nickname: "Admin One",
        isActive: true,
        staffCreatedAt: null,
        staffCreatedByAdminAccountId: null,
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: null,
        staffReactivatedByAdminAccountId: null,
        createdAt: new Date("2026-05-14T07:00:00.000Z"),
        updatedAt: new Date("2026-05-14T07:00:00.000Z"),
      },
    ]);
    const operatorStaffRatingAdjustmentFindMany = jest.fn(async () => [
      {
        operatorAdminAccountId: "operator-1",
        delta: 1 as const,
        actorAdminAccountId: "admin-1",
        reason: "shift quality",
        createdAt: new Date("2026-05-14T10:00:00.000Z"),
      },
      {
        operatorAdminAccountId: "operator-1",
        delta: -1 as const,
        actorAdminAccountId: "boss-1",
        reason: "missed close",
        createdAt: new Date("2026-05-14T10:05:00.000Z"),
      },
    ]);
    const operatorStaffLifecycleEventFindMany = jest.fn(async () => [
      {
        operatorAdminAccountId: "operator-1",
        actorAdminAccountId: "boss-1",
        action: "REACTIVATED",
        previousNickname: null,
        newNickname: null,
        reason: "returned",
        createdAt: new Date("2026-05-14T09:00:00.000Z"),
      },
      {
        operatorAdminAccountId: "operator-1",
        actorAdminAccountId: "admin-1",
        action: "DEACTIVATED",
        previousNickname: null,
        newNickname: null,
        reason: "pause",
        createdAt: new Date("2026-05-14T08:30:00.000Z"),
      },
    ]);
    const reader = new PrismaAdminAccessOperatorStaffMetricsReader({
      client: {
        adminAccount: {
          findMany: adminAccountFindMany,
        },
        operatorStaffRatingAdjustment: {
          findMany: operatorStaffRatingAdjustmentFindMany,
        },
        operatorStaffLifecycleEvent: {
          findMany: operatorStaffLifecycleEventFindMany,
        },
      },
    });

    await expect(
      reader.listOperatorStaffCards({
        processedOrderMetrics: [
          {
            operatorAdminAccountId: "operator-1",
            processedOrdersCount: 205,
          },
        ],
        orderHistories: [
          {
            operatorAdminAccountId: "operator-1",
            lastProcessedOrders: [
              {
                orderId: "order-1",
                status: "COMPLETED",
                createdAt: new Date("2026-05-14T07:00:00.000Z"),
                updatedAt: new Date("2026-05-14T08:00:00.000Z"),
                lastWriteAt: new Date("2026-05-14T08:00:00.000Z"),
                actionTypes: ["status:COMPLETED"],
                personallyCompleted: true,
                problemReasons: [],
              },
            ],
            problemOrders: [
              {
                orderId: "order-2",
                status: "COMPLETED",
                createdAt: new Date("2026-05-14T07:10:00.000Z"),
                updatedAt: new Date("2026-05-14T08:10:00.000Z"),
                lastWriteAt: new Date("2026-05-14T08:10:00.000Z"),
                actionTypes: ["order.offer_created"],
                personallyCompleted: false,
                problemReasons: ["not_personally_completed"],
              },
            ],
          },
        ],
      }),
    ).resolves.toEqual([
      {
        operatorAdminAccountId: "operator-1",
        nickname: "Operator One",
        email: "operator1@example.com",
        activeStatus: "active",
        authActive: true,
        addedByAdminAccountId: "admin-1",
        addedAt: new Date("2026-05-14T08:00:00.000Z"),
        deactivatedByAdminAccountId: null,
        deactivatedAt: null,
        reactivatedByAdminAccountId: "boss-1",
        reactivatedAt: new Date("2026-05-14T09:00:00.000Z"),
        lifecycleHistory: [
          {
            actorAdminAccountId: "boss-1",
            action: "reactivated",
            previousNickname: null,
            newNickname: null,
            reason: "returned",
            createdAt: new Date("2026-05-14T09:00:00.000Z"),
          },
          {
            actorAdminAccountId: "admin-1",
            action: "deactivated",
            previousNickname: null,
            newNickname: null,
            reason: "pause",
            createdAt: new Date("2026-05-14T08:30:00.000Z"),
          },
        ],
        deactivationHistory: [
          {
            actorAdminAccountId: "admin-1",
            action: "deactivated",
            previousNickname: null,
            newNickname: null,
            reason: "pause",
            createdAt: new Date("2026-05-14T08:30:00.000Z"),
          },
        ],
        reactivationHistory: [
          {
            actorAdminAccountId: "boss-1",
            action: "reactivated",
            previousNickname: null,
            newNickname: null,
            reason: "returned",
            createdAt: new Date("2026-05-14T09:00:00.000Z"),
          },
        ],
        manualRatingAdjustmentHistory: [
          {
            actorAdminAccountId: "boss-1",
            delta: -1,
            reason: "missed close",
            createdAt: new Date("2026-05-14T10:05:00.000Z"),
          },
          {
            actorAdminAccountId: "admin-1",
            delta: 1,
            reason: "shift quality",
            createdAt: new Date("2026-05-14T10:00:00.000Z"),
          },
        ],
        processedOrdersCount: 205,
        manualRatingAdjustment: 0,
        operatorRating: 2,
        lastProcessedOrders: [
          {
            orderId: "order-1",
            status: "COMPLETED",
            createdAt: new Date("2026-05-14T07:00:00.000Z"),
            updatedAt: new Date("2026-05-14T08:00:00.000Z"),
            lastWriteAt: new Date("2026-05-14T08:00:00.000Z"),
            actionTypes: ["status:COMPLETED"],
            personallyCompleted: true,
            problemReasons: [],
          },
        ],
        problemOrders: [
          {
            orderId: "order-2",
            status: "COMPLETED",
            createdAt: new Date("2026-05-14T07:10:00.000Z"),
            updatedAt: new Date("2026-05-14T08:10:00.000Z"),
            lastWriteAt: new Date("2026-05-14T08:10:00.000Z"),
            actionTypes: ["order.offer_created"],
            personallyCompleted: false,
            problemReasons: ["not_personally_completed"],
          },
        ],
      },
    ]);
    expect(adminAccountFindMany).toHaveBeenCalledWith({
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
  });
});
