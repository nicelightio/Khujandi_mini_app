import { PrismaOperatorStaffMetricsReader } from "../../../backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader";

describe("delivery-tracking operator staff card order history read model", () => {
  it("returns last processed orders and problem orders from write evidence without changing lifecycle state", async () => {
    const orderStatusHistoryFindMany = jest.fn(async () => [
      {
        orderId: "order-01",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:01:00.000Z"),
      },
      {
        orderId: "order-02",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:02:00.000Z"),
      },
      {
        orderId: "order-03",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:03:00.000Z"),
      },
      {
        orderId: "order-04",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:04:00.000Z"),
      },
      {
        orderId: "order-05",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:05:00.000Z"),
      },
      {
        orderId: "order-06",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:06:00.000Z"),
      },
      {
        orderId: "order-07",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:07:00.000Z"),
      },
      {
        orderId: "order-08",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:08:00.000Z"),
      },
      {
        orderId: "order-09-failed-source",
        changedByUserId: "operator-1",
        newStatus: "PICKED_UP",
        changedAt: new Date("2026-05-14T08:09:00.000Z"),
      },
      {
        orderId: "order-10-not-completed",
        changedByUserId: "operator-1",
        newStatus: "IN_PROGRESS",
        changedAt: new Date("2026-05-14T08:10:00.000Z"),
      },
      {
        orderId: "order-11-personally-completed",
        changedByUserId: "operator-1",
        newStatus: "COMPLETED",
        changedAt: new Date("2026-05-14T08:11:00.000Z"),
      },
      {
        orderId: "order-other",
        changedByUserId: "operator-2",
        newStatus: "IN_PROGRESS",
        changedAt: new Date("2026-05-14T08:12:00.000Z"),
      },
    ]);
    const eventFindMany = jest.fn(async () => [
      {
        type: "order.offer_created",
        entityId: "order-10-not-completed",
        payload: {
          orderId: "order-10-not-completed",
          createdByUserId: "operator-1",
        },
        createdAt: new Date("2026-05-14T08:12:00.000Z"),
      },
      {
        type: "order.viewed",
        entityId: "order-viewed",
        payload: {
          orderId: "order-viewed",
          actorUserId: "operator-1",
        },
        createdAt: new Date("2026-05-14T08:13:00.000Z"),
      },
    ]);
    const orderCancellationAuditFindMany = jest.fn(async () => [
      {
        orderId: "order-07",
        actorUserId: "operator-1",
        action: "refund_updated",
        createdAt: new Date("2026-05-14T08:14:00.000Z"),
      },
    ]);
    const orderFindMany = jest.fn(async () => [
      ...Array.from({ length: 8 }, (_, index) => {
        const orderNumber = index + 1;

        return {
          id: `order-0${orderNumber}`,
          status: orderNumber === 7 ? "CANCELLED_BY_ADMIN" : "COMPLETED",
          createdAt: new Date(`2026-05-14T07:0${orderNumber}:00.000Z`),
          updatedAt: new Date(`2026-05-14T08:0${orderNumber}:30.000Z`),
          isDeleted: false,
        };
      }),
      {
        id: "order-09-failed-source",
        status: "FAILED",
        createdAt: new Date("2026-05-14T07:09:00.000Z"),
        updatedAt: new Date("2026-05-14T08:09:30.000Z"),
        isDeleted: false,
      },
      {
        id: "order-10-not-completed",
        status: "COMPLETED",
        createdAt: new Date("2026-05-14T07:10:00.000Z"),
        updatedAt: new Date("2026-05-14T08:10:30.000Z"),
        isDeleted: false,
      },
      {
        id: "order-11-personally-completed",
        status: "COMPLETED",
        createdAt: new Date("2026-05-14T07:11:00.000Z"),
        updatedAt: new Date("2026-05-14T08:11:30.000Z"),
        isDeleted: false,
      },
      {
        id: "order-other",
        status: "IN_PROGRESS",
        createdAt: new Date("2026-05-14T07:12:00.000Z"),
        updatedAt: new Date("2026-05-14T08:12:30.000Z"),
        isDeleted: false,
      },
    ]);
    const reader = new PrismaOperatorStaffMetricsReader({
      client: {
        order: {
          findMany: orderFindMany,
        },
        orderStatusHistory: {
          findMany: orderStatusHistoryFindMany,
        },
        event: {
          findMany: eventFindMany,
        },
        orderCancellationAudit: {
          findMany: orderCancellationAuditFindMany,
        },
      },
    });

    const [operatorOne, operatorTwo] = await reader.listOperatorStaffOrderHistories([
      "operator-1",
      "operator-2",
    ]);

    expect(operatorOne.lastProcessedOrders.map((order) => order.orderId)).toEqual([
      "order-07",
      "order-10-not-completed",
      "order-11-personally-completed",
      "order-09-failed-source",
      "order-08",
      "order-06",
      "order-05",
      "order-04",
      "order-03",
      "order-02",
    ]);
    expect(operatorOne.problemOrders.map((order) => [order.orderId, order.problemReasons])).toContainEqual([
      "order-09-failed-source",
      ["future_failed", "not_personally_completed"],
    ]);
    expect(operatorOne.problemOrders.map((order) => [order.orderId, order.problemReasons])).toContainEqual([
      "order-10-not-completed",
      ["not_personally_completed"],
    ]);
    expect(operatorOne.problemOrders.some((order) => order.orderId === "order-11-personally-completed")).toBe(
      false,
    );
    expect(operatorTwo).toMatchObject({
      operatorAdminAccountId: "operator-2",
      lastProcessedOrders: [
        expect.objectContaining({
          orderId: "order-other",
          problemReasons: ["not_personally_completed"],
        }),
      ],
    });
    expect(eventFindMany).toHaveBeenCalledWith({
      where: {
        type: {
          in: [
            "order.assigned",
            "order.offer_created",
            "order.status_changed",
            "order.cancelled",
            "order.refund_updated",
            "order.message_sent",
            "order.message_received",
          ],
        },
      },
      select: {
        type: true,
        entityId: true,
        payload: true,
        createdAt: true,
      },
    });
    expect(orderFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: {
            in: expect.arrayContaining(["order-11-personally-completed", "order-10-not-completed"]),
          },
          isDeleted: false,
        },
      }),
    );
  });
});
