import { PrismaAdminAccessOperatorStaffMetricsReader } from "../../../backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader";

describe("admin-access operator staff table metrics read model", () => {
  it("composes operator table rows from operator roster, unique processed counts, and manual rating adjustments", async () => {
    const adminAccountFindMany = jest.fn(async () => [
      {
        id: "operator-1",
        login: "operator1@example.com",
        role: "OPERATOR",
        nickname: "Operator One",
        isActive: true,
        staffDeactivatedAt: null,
      },
      {
        id: "operator-2",
        login: "operator2@example.com",
        role: "OPERATOR",
        nickname: "Operator Two",
        isActive: false,
        staffDeactivatedAt: new Date("2026-05-14T10:00:00.000Z"),
      },
      {
        id: "admin-1",
        login: "admin@example.com",
        role: "ADMIN",
        nickname: "Admin One",
        isActive: true,
        staffDeactivatedAt: null,
      },
    ]);
    const operatorStaffRatingAdjustmentFindMany = jest.fn(async () => [
      {
        operatorAdminAccountId: "operator-1",
        delta: 1 as const,
      },
      {
        operatorAdminAccountId: "operator-1",
        delta: 1 as const,
      },
      {
        operatorAdminAccountId: "operator-2",
        delta: -1 as const,
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
      },
    });

    await expect(
      reader.listOperatorStaffTableMetrics({
        processedOrderMetrics: [
          {
            operatorAdminAccountId: "operator-1",
            processedOrdersCount: 205,
          },
          {
            operatorAdminAccountId: "operator-2",
            processedOrdersCount: 99,
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
        processedOrdersCount: 205,
        manualRatingAdjustment: 2,
        operatorRating: 4,
      },
      {
        operatorAdminAccountId: "operator-2",
        nickname: "Operator Two",
        email: "operator2@example.com",
        activeStatus: "soft_deleted",
        authActive: false,
        processedOrdersCount: 99,
        manualRatingAdjustment: -1,
        operatorRating: -1,
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
        staffDeactivatedAt: true,
      },
    });
    expect(operatorStaffRatingAdjustmentFindMany).toHaveBeenCalledWith({
      where: {
        operatorAdminAccountId: {
          in: ["operator-1", "operator-2"],
        },
      },
      select: {
        operatorAdminAccountId: true,
        delta: true,
      },
    });
  });
});
