import { PrismaOperatorStaffMetricsReader } from "../../../backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader";

describe("delivery-tracking operator staff metrics read model", () => {
  it("counts unique operator write-touched orders and collapses duplicate writes", async () => {
    const orderStatusHistoryFindMany = jest.fn(async () => [
      {
        orderId: "order-a",
        changedByUserId: "operator-1",
      },
      {
        orderId: "order-a",
        changedByUserId: "operator-1",
      },
      {
        orderId: "order-b",
        changedByUserId: "operator-1",
      },
      {
        orderId: "order-c",
        changedByUserId: "operator-2",
      },
    ]);
    const eventFindMany = jest.fn(async () => [
      {
        type: "order.offer_created",
        entityId: "order-offer",
        payload: {
          orderId: "order-offer",
          createdByUserId: "operator-1",
        },
      },
      {
        type: "order.offer_created",
        entityId: "order-offer",
        payload: {
          orderId: "order-offer",
          createdByUserId: "operator-1",
        },
      },
      {
        type: "order.assigned",
        entityId: "order-override",
        payload: {
          orderId: "order-override",
          assignedByUserId: "operator-1",
        },
      },
      {
        type: "order.message_sent",
        entityId: "order-message",
        payload: {
          orderId: "order-message",
          senderUserId: "operator-2",
        },
      },
      {
        type: "order.viewed",
        entityId: "order-viewed",
        payload: {
          orderId: "order-viewed",
          actorUserId: "operator-1",
        },
      },
      {
        type: "order.offer_created",
        entityId: "order-courier",
        payload: {
          orderId: "order-courier",
          createdByUserId: "courier-1",
        },
      },
    ]);
    const orderCancellationAuditFindMany = jest.fn(async () => [
      {
        orderId: "order-cancel",
        actorUserId: "operator-1",
        action: "cancelled",
      },
      {
        orderId: "order-cancel",
        actorUserId: "operator-1",
        action: "refund_updated",
      },
      {
        orderId: "order-refund",
        actorUserId: "operator-1",
        action: "refund_updated",
      },
    ]);
    const reader = new PrismaOperatorStaffMetricsReader({
      client: {
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

    await expect(
      reader.listOperatorProcessedOrderMetrics(["operator-1", "operator-2", "operator-1"]),
    ).resolves.toEqual([
      {
        operatorAdminAccountId: "operator-1",
        processedOrdersCount: 6,
      },
      {
        operatorAdminAccountId: "operator-2",
        processedOrdersCount: 2,
      },
    ]);

    expect(orderStatusHistoryFindMany).toHaveBeenCalledWith({
      where: {
        changedByUserId: {
          in: ["operator-1", "operator-2"],
        },
      },
      select: {
        orderId: true,
        changedByUserId: true,
      },
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
      },
    });
  });
});
