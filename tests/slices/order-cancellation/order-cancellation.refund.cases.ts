import { createOrderCancellationModule } from "../../../backend/src/slices/order-cancellation/presentation/order-cancellation.module";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import { createPrismaProvider } from "./order-cancellation.integration.test-helpers";

export const registerOrderCancellationRefundCases = () => {
  it("persists manual refund updates with note, audit, and canonical refund event writes", async () => {
    const orderFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "order-3",
        courierId: "courier-1",
        status: "CANCELLED_BY_ADMIN",
        paymentStatus: "PAID",
        refundStatus: "PENDING_MANUAL",
        refundNote: null,
        cancelledByUserId: "admin-1",
        cancellationReasonCode: "SHOP_UNAVAILABLE",
        cancelledAt: new Date("2026-04-03T10:05:00.000Z"),
        updatedAt: new Date("2026-04-03T10:05:00.000Z"),
        isDeleted: false,
      })
      .mockResolvedValueOnce({
        id: "order-3",
        courierId: "courier-1",
        status: "CANCELLED_BY_ADMIN",
        paymentStatus: "PAID",
        refundStatus: "PENDING_MANUAL",
        refundNote: null,
        cancelledByUserId: "admin-1",
        cancellationReasonCode: "SHOP_UNAVAILABLE",
        cancelledAt: new Date("2026-04-03T10:05:00.000Z"),
        updatedAt: new Date("2026-04-03T10:05:00.000Z"),
        isDeleted: false,
      })
      .mockResolvedValueOnce({
        id: "order-3",
        courierId: "courier-1",
        status: "CANCELLED_BY_ADMIN",
        paymentStatus: "PAID",
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
        cancelledByUserId: "admin-1",
        cancellationReasonCode: "SHOP_UNAVAILABLE",
        cancelledAt: new Date("2026-04-03T10:05:00.000Z"),
        updatedAt: new Date("2026-04-03T10:15:00.000Z"),
        isDeleted: false,
      });
    const orderUpdate = jest.fn();
    const orderUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const auditCreate = jest.fn().mockResolvedValue({
      id: 301n,
      orderId: "order-3",
      actorUserId: "manager-1",
      actorRole: "MANAGER",
      action: "refund_updated",
      reasonCode: "SHOP_UNAVAILABLE",
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
      fromStatus: "CANCELLED_BY_ADMIN",
      toStatus: "CANCELLED_BY_ADMIN",
      createdAt: new Date("2026-04-03T10:15:00.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 302n,
      type: "order.refund_updated",
      entity: "order",
      entityId: "order-3",
      payload: {
        orderId: "order-3",
        status: "CANCELLED_BY_ADMIN",
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
        updatedByUserId: "manager-1",
        updatedAt: "2026-04-03T10:15:00.000Z",
      },
      createdAt: new Date("2026-04-03T10:15:00.000Z"),
    });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
        updateMany: orderUpdateMany,
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      orderCancellationAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createOrderCancellationModule(prisma);

    await expect(
      module.controller.recordRefundUpdate({
        orderId: "order-3",
        actor: {
          userId: "manager-1",
          role: "manager",
        },
        refundStatus: "DONE",
        refundNote: "  Cash returned offline  ",
      }),
    ).resolves.toEqual({
      orderId: "order-3",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
      updatedAt: new Date("2026-04-03T10:15:00.000Z"),
      revision: "302",
    });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "order-3",
        refundStatus: "PENDING_MANUAL",
      },
      data: {
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
      },
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-3",
        actorUserId: "manager-1",
        actorRole: "MANAGER",
        action: "refund_updated",
        reasonCode: "SHOP_UNAVAILABLE",
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
        fromStatus: "CANCELLED_BY_ADMIN",
        toStatus: "CANCELLED_BY_ADMIN",
      }),
    });
    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        type: "order.refund_updated",
        entity: "order",
        entityId: "order-3",
        payload: {
          orderId: "order-3",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "DONE",
          refundNote: "Cash returned offline",
          updatedByUserId: "manager-1",
          updatedAt: "2026-04-03T10:15:00.000Z",
        },
      },
    });
  });

  it("rejects refund updates when the cancelled order is not paid and keeps writes side-effect free", async () => {
    const orderUpdate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-4",
          courierId: "courier-1",
          status: "CANCELLED_BY_COURIER_UNAVAILABLE",
          paymentStatus: "FAILED",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          cancelledByUserId: "courier-1",
          cancellationReasonCode: "COURIER_UNAVAILABLE",
          cancelledAt: new Date("2026-04-03T11:05:00.000Z"),
          updatedAt: new Date("2026-04-03T11:05:00.000Z"),
          isDeleted: false,
        }),
        update: orderUpdate,
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      orderCancellationAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createOrderCancellationModule(prisma);

    await expect(
      module.controller.recordRefundUpdate({
        orderId: "order-4",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        refundStatus: "REJECTED",
        refundNote: "Refund is not applicable.",
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Manual refund tracking is not required for unpaid cancellations", 409, {
        orderId: "order-4",
        paymentStatus: "FAILED",
        refundStatus: "NOT_REQUIRED",
      }),
    );
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("keeps end-to-end cancellation and refund evidence explicit across persistence, audit, and events", async () => {
    let storedOrder = {
      id: "order-5",
      courierId: "courier-7",
      status: "ASSIGNED",
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      cancelledByUserId: null,
      cancellationReasonCode: null,
      cancelledAt: null,
      updatedAt: new Date("2026-04-03T12:00:00.000Z"),
      isDeleted: false,
    };
    const orderFindUnique = jest.fn().mockImplementation(async () => ({ ...storedOrder }));
    const orderUpdate = jest.fn().mockImplementation(async ({ data }) => {
      storedOrder = {
        ...storedOrder,
        ...data,
        updatedAt:
          data.refundStatus === "DONE"
            ? new Date("2026-04-03T12:10:00.000Z")
            : new Date("2026-04-03T12:05:00.000Z"),
      };

      return { ...storedOrder };
    });
    const orderUpdateMany = jest.fn().mockImplementation(async ({ where, data }) => {
      if (storedOrder.id !== where.id) {
        return { count: 0 };
      }

      if (where.status !== undefined && storedOrder.status !== where.status) {
        return { count: 0 };
      }

      if (where.refundStatus !== undefined && storedOrder.refundStatus !== where.refundStatus) {
        return { count: 0 };
      }

      storedOrder = {
        ...storedOrder,
        ...data,
        updatedAt:
          data.refundStatus === "DONE"
            ? new Date("2026-04-03T12:10:00.000Z")
            : new Date("2026-04-03T12:05:00.000Z"),
      };

      return { count: 1 };
    });
    const statusHistoryCreate = jest.fn().mockResolvedValue({
      id: 401n,
      orderId: "order-5",
      oldStatus: "ASSIGNED",
      newStatus: "CANCELLED_BY_ADMIN",
      changedByUserId: "admin-9",
      changedAt: new Date("2026-04-03T12:05:00.000Z"),
    });
    const auditCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 402n,
        orderId: "order-5",
        actorUserId: "admin-9",
        actorRole: "ADMIN",
        action: "cancelled",
        reasonCode: "SHOP_UNAVAILABLE",
        refundStatus: "PENDING_MANUAL",
        refundNote: null,
        fromStatus: "ASSIGNED",
        toStatus: "CANCELLED_BY_ADMIN",
        createdAt: new Date("2026-04-03T12:05:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: 404n,
        orderId: "order-5",
        actorUserId: "manager-3",
        actorRole: "MANAGER",
        action: "refund_updated",
        reasonCode: "SHOP_UNAVAILABLE",
        refundStatus: "DONE",
        refundNote: "Cash returned to the client",
        fromStatus: "CANCELLED_BY_ADMIN",
        toStatus: "CANCELLED_BY_ADMIN",
        createdAt: new Date("2026-04-03T12:10:00.000Z"),
      });
    const eventCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 403n,
        type: "order.cancelled",
        entity: "order",
        entityId: "order-5",
        payload: {
          orderId: "order-5",
          previousStatus: "ASSIGNED",
          status: "CANCELLED_BY_ADMIN",
          cancelledByUserId: "admin-9",
          actorRole: "admin",
          reasonCode: "SHOP_UNAVAILABLE",
          refundStatus: "PENDING_MANUAL",
          updatedAt: "2026-04-03T12:05:00.000Z",
        },
        createdAt: new Date("2026-04-03T12:05:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: 405n,
        type: "order.refund_updated",
        entity: "order",
        entityId: "order-5",
        payload: {
          orderId: "order-5",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "DONE",
          refundNote: "Cash returned to the client",
          updatedByUserId: "manager-3",
          updatedAt: "2026-04-03T12:10:00.000Z",
        },
        createdAt: new Date("2026-04-03T12:10:00.000Z"),
      });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
        updateMany: orderUpdateMany,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      orderCancellationAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createOrderCancellationModule(prisma);

    await expect(
      module.controller.cancelOrder({
        orderId: "order-5",
        actor: {
          userId: "admin-9",
          role: "admin",
        },
        reasonCode: "SHOP_UNAVAILABLE",
      }),
    ).resolves.toEqual({
      orderId: "order-5",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "PENDING_MANUAL",
      updatedAt: new Date("2026-04-03T12:05:00.000Z"),
      revision: "403",
    });

    await expect(
      module.controller.recordRefundUpdate({
        orderId: "order-5",
        actor: {
          userId: "manager-3",
          role: "manager",
        },
        refundStatus: "DONE",
        refundNote: " Cash returned to the client ",
      }),
    ).resolves.toEqual({
      orderId: "order-5",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "DONE",
      refundNote: "Cash returned to the client",
      updatedAt: new Date("2026-04-03T12:10:00.000Z"),
      revision: "405",
    });

    expect(orderFindUnique).toHaveBeenCalledTimes(6);
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(orderUpdateMany).toHaveBeenNthCalledWith(
      1,
      {
        where: {
          id: "order-5",
          status: "ASSIGNED",
          isDeleted: false,
        },
        data: expect.objectContaining({
          status: "CANCELLED_BY_ADMIN",
          cancelledByUserId: "admin-9",
          cancellationReasonCode: "SHOP_UNAVAILABLE",
          refundStatus: "PENDING_MANUAL",
        }),
      },
    );
    expect(orderUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: "order-5",
        refundStatus: "PENDING_MANUAL",
      },
      data: {
        refundStatus: "DONE",
        refundNote: "Cash returned to the client",
      },
    });
    expect(statusHistoryCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: "admin-9",
          reasonCode: "SHOP_UNAVAILABLE",
          refundStatus: "PENDING_MANUAL",
        }),
      }),
    );
    expect(auditCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          actorUserId: "manager-3",
          reasonCode: "SHOP_UNAVAILABLE",
          refundStatus: "DONE",
          refundNote: "Cash returned to the client",
        }),
      }),
    );
    expect(eventCreate).toHaveBeenNthCalledWith(1, {
      data: {
        type: "order.cancelled",
        entity: "order",
        entityId: "order-5",
        payload: {
          orderId: "order-5",
          previousStatus: "ASSIGNED",
          status: "CANCELLED_BY_ADMIN",
          cancelledByUserId: "admin-9",
          actorRole: "admin",
          reasonCode: "SHOP_UNAVAILABLE",
          refundStatus: "PENDING_MANUAL",
          updatedAt: "2026-04-03T12:05:00.000Z",
        },
      },
    });
    expect(eventCreate).toHaveBeenNthCalledWith(2, {
      data: {
        type: "order.refund_updated",
        entity: "order",
        entityId: "order-5",
        payload: {
          orderId: "order-5",
          status: "CANCELLED_BY_ADMIN",
          refundStatus: "DONE",
          refundNote: "Cash returned to the client",
          updatedByUserId: "manager-3",
          updatedAt: "2026-04-03T12:10:00.000Z",
        },
      },
    });
  });

  it("rejects a stale concurrent refund update once another request already left PENDING_MANUAL", async () => {
    let pendingBarrierCount = 0;
    let releasePendingBarrier!: () => void;
    const pendingBarrier = new Promise<void>((resolve) => {
      releasePendingBarrier = resolve;
    });

    const staleOrderSnapshot = {
      id: "order-6",
      courierId: "courier-1",
      status: "CANCELLED_BY_ADMIN",
      paymentStatus: "PAID",
      refundStatus: "PENDING_MANUAL",
      refundNote: null,
      cancelledByUserId: "admin-1",
      cancellationReasonCode: "SHOP_UNAVAILABLE",
      cancelledAt: new Date("2026-04-03T13:05:00.000Z"),
      updatedAt: new Date("2026-04-03T13:05:00.000Z"),
      isDeleted: false,
    };
    let storedOrder = { ...staleOrderSnapshot };
    const orderFindUnique = jest.fn().mockImplementation(async () => {
      pendingBarrierCount += 1;

      if (pendingBarrierCount <= 2) {
        if (pendingBarrierCount === 2) {
          releasePendingBarrier();
        }

        await pendingBarrier;

        return { ...staleOrderSnapshot };
      }

      return { ...storedOrder };
    });
    const orderUpdate = jest.fn();
    const orderUpdateMany = jest.fn().mockImplementation(async ({ where, data }) => {
      if (storedOrder.id !== where.id || storedOrder.refundStatus !== where.refundStatus) {
        return { count: 0 };
      }

      storedOrder = {
        ...storedOrder,
        ...data,
        updatedAt: new Date("2026-04-03T13:10:00.000Z"),
      };

      return { count: 1 };
    });
    const auditCreate = jest.fn().mockResolvedValue({
      id: 501n,
      orderId: "order-6",
      actorUserId: "manager-1",
      actorRole: "MANAGER",
      action: "refund_updated",
      reasonCode: "SHOP_UNAVAILABLE",
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
      fromStatus: "CANCELLED_BY_ADMIN",
      toStatus: "CANCELLED_BY_ADMIN",
      createdAt: new Date("2026-04-03T13:10:00.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 502n,
      type: "order.refund_updated",
      entity: "order",
      entityId: "order-6",
      payload: {
        orderId: "order-6",
        status: "CANCELLED_BY_ADMIN",
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
        updatedByUserId: "manager-1",
        updatedAt: "2026-04-03T13:10:00.000Z",
      },
      createdAt: new Date("2026-04-03T13:10:00.000Z"),
    });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
        updateMany: orderUpdateMany,
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      orderCancellationAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createOrderCancellationModule(prisma);

    const [firstResult, secondResult] = await Promise.allSettled([
      module.controller.recordRefundUpdate({
        orderId: "order-6",
        actor: {
          userId: "manager-1",
          role: "manager",
        },
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
      }),
      module.controller.recordRefundUpdate({
        orderId: "order-6",
        actor: {
          userId: "admin-2",
          role: "admin",
        },
        refundStatus: "REJECTED",
        refundNote: "Provider rejected the late refund attempt",
      }),
    ]);

    expect(firstResult).toEqual({
      status: "fulfilled",
      value: {
        orderId: "order-6",
        status: "CANCELLED_BY_ADMIN",
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
        updatedAt: new Date("2026-04-03T13:10:00.000Z"),
        revision: "502",
      },
    });
    expect(secondResult.status).toBe("rejected");

    if (secondResult.status !== "rejected") {
      throw new Error("Expected stale refund update to be rejected");
    }

    expect(secondResult.reason).toEqual(
      new AppError("CONFLICT", "Refund tracking can only progress from PENDING_MANUAL", 409, {
        orderId: "order-6",
        currentRefundStatus: "DONE",
        expectedRefundStatus: "PENDING_MANUAL",
      }),
    );
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(orderUpdateMany).toHaveBeenCalledTimes(2);
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(eventCreate).toHaveBeenCalledTimes(1);
    expect(storedOrder.refundStatus).toBe("DONE");
    expect(storedOrder.refundNote).toBe("Cash returned offline");
  });
};
