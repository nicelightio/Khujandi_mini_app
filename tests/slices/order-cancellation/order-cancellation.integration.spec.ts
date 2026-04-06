import { createOrderCancellationModule } from "../../../backend/src/slices/order-cancellation/presentation/order-cancellation.module";
import type { OrderCancellationPrismaProvider } from "../../../backend/src/slices/order-cancellation/infrastructure/prisma-order-cancellation.repository";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";

type OrderCancellationPrismaClient = {
  order: {
    findUnique: OrderCancellationPrismaProvider["client"]["order"]["findUnique"];
    update: OrderCancellationPrismaProvider["client"]["order"]["update"];
    updateMany?: OrderCancellationPrismaProvider["client"]["order"]["updateMany"];
  };
  orderStatusHistory: OrderCancellationPrismaProvider["client"]["orderStatusHistory"];
  orderCancellationAudit: OrderCancellationPrismaProvider["client"]["orderCancellationAudit"];
  event: OrderCancellationPrismaProvider["client"]["event"];
};

const createPrismaProvider = (
  client: OrderCancellationPrismaClient,
): OrderCancellationPrismaProvider => {
  const normalizedClient: OrderCancellationPrismaProvider["client"] = {
    ...client,
    order: {
      ...client.order,
      updateMany: client.order.updateMany ?? jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: async (callback) => callback(normalizedClient),
  };

  return {
    client: normalizedClient,
  };
};

describe("order-cancellation module integration", () => {
  it("persists admin cancellation with history, audit, and canonical event writes", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      cancelledByUserId: null,
      cancellationReasonCode: null,
      cancelledAt: null,
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const orderUpdate = jest.fn().mockResolvedValue({
      id: "order-1",
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
    });
    const statusHistoryCreate = jest.fn().mockResolvedValue({
      id: 101n,
      orderId: "order-1",
      oldStatus: "ASSIGNED",
      newStatus: "CANCELLED_BY_ADMIN",
      changedByUserId: "admin-1",
      changedAt: new Date("2026-04-03T10:05:00.000Z"),
    });
    const auditCreate = jest.fn().mockResolvedValue({
      id: 102n,
      orderId: "order-1",
      actorUserId: "admin-1",
      actorRole: "ADMIN",
      action: "cancelled",
      reasonCode: "SHOP_UNAVAILABLE",
      refundStatus: "PENDING_MANUAL",
      refundNote: null,
      fromStatus: "ASSIGNED",
      toStatus: "CANCELLED_BY_ADMIN",
      createdAt: new Date("2026-04-03T10:05:00.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 103n,
      type: "order.cancelled",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        previousStatus: "ASSIGNED",
        status: "CANCELLED_BY_ADMIN",
        cancelledByUserId: "admin-1",
        actorRole: "admin",
        reasonCode: "SHOP_UNAVAILABLE",
        refundStatus: "PENDING_MANUAL",
        updatedAt: "2026-04-03T10:05:00.000Z",
      },
      createdAt: new Date("2026-04-03T10:05:00.000Z"),
    });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
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
    const context = createTestContext(prisma.client);
    const module = createOrderCancellationModule(prisma);

    expect(context.prisma).toBe(prisma.client);
    await expect(
      module.controller.cancelOrder({
        orderId: "order-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        reasonCode: "SHOP_UNAVAILABLE",
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "PENDING_MANUAL",
      updatedAt: new Date("2026-04-03T10:05:00.000Z"),
      revision: "103",
    });
    expect(orderUpdate).toHaveBeenCalledWith({
      where: {
        id: "order-1",
      },
      data: {
        status: "CANCELLED_BY_ADMIN",
        cancelledByUserId: "admin-1",
        cancellationReasonCode: "SHOP_UNAVAILABLE",
        cancelledAt: expect.any(Date),
        refundStatus: "PENDING_MANUAL",
        refundNote: null,
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        paymentStatus: true,
        refundStatus: true,
        refundNote: true,
        cancelledByUserId: true,
        cancellationReasonCode: true,
        cancelledAt: true,
        updatedAt: true,
        isDeleted: true,
      },
    });
    expect(statusHistoryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        oldStatus: "ASSIGNED",
        newStatus: "CANCELLED_BY_ADMIN",
        changedByUserId: "admin-1",
      }),
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        actorUserId: "admin-1",
        actorRole: "ADMIN",
        action: "cancelled",
        reasonCode: "SHOP_UNAVAILABLE",
        refundStatus: "PENDING_MANUAL",
        fromStatus: "ASSIGNED",
        toStatus: "CANCELLED_BY_ADMIN",
      }),
    });
    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        type: "order.cancelled",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "ASSIGNED",
          status: "CANCELLED_BY_ADMIN",
          cancelledByUserId: "admin-1",
          actorRole: "admin",
          reasonCode: "SHOP_UNAVAILABLE",
          refundStatus: "PENDING_MANUAL",
          updatedAt: "2026-04-03T10:05:00.000Z",
        },
      },
    });
  });

  it("persists courier unavailable-case cancellation only for the assigned courier", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-2",
      courierId: "courier-1",
      status: "IN_PROGRESS",
      paymentStatus: "FAILED",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      cancelledByUserId: null,
      cancellationReasonCode: null,
      cancelledAt: null,
      updatedAt: new Date("2026-04-03T11:00:00.000Z"),
      isDeleted: false,
    });
    const orderUpdate = jest.fn().mockResolvedValue({
      id: "order-2",
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
    });
    const statusHistoryCreate = jest.fn().mockResolvedValue({
      id: 201n,
      orderId: "order-2",
      oldStatus: "IN_PROGRESS",
      newStatus: "CANCELLED_BY_COURIER_UNAVAILABLE",
      changedByUserId: "courier-1",
      changedAt: new Date("2026-04-03T11:05:00.000Z"),
    });
    const auditCreate = jest.fn().mockResolvedValue({
      id: 202n,
      orderId: "order-2",
      actorUserId: "courier-1",
      actorRole: "COURIER",
      action: "cancelled",
      reasonCode: "COURIER_UNAVAILABLE",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      fromStatus: "IN_PROGRESS",
      toStatus: "CANCELLED_BY_COURIER_UNAVAILABLE",
      createdAt: new Date("2026-04-03T11:05:00.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 203n,
      type: "order.cancelled",
      entity: "order",
      entityId: "order-2",
      payload: {
        orderId: "order-2",
        previousStatus: "IN_PROGRESS",
        status: "CANCELLED_BY_COURIER_UNAVAILABLE",
        cancelledByUserId: "courier-1",
        actorRole: "courier",
        reasonCode: "COURIER_UNAVAILABLE",
        refundStatus: "NOT_REQUIRED",
        updatedAt: "2026-04-03T11:05:00.000Z",
      },
      createdAt: new Date("2026-04-03T11:05:00.000Z"),
    });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
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
        orderId: "order-2",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        reasonCode: "COURIER_UNAVAILABLE",
      }),
    ).resolves.toEqual({
      orderId: "order-2",
      status: "CANCELLED_BY_COURIER_UNAVAILABLE",
      refundStatus: "NOT_REQUIRED",
      updatedAt: new Date("2026-04-03T11:05:00.000Z"),
      revision: "203",
    });
    expect(orderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CANCELLED_BY_COURIER_UNAVAILABLE",
          cancelledByUserId: "courier-1",
          cancellationReasonCode: "COURIER_UNAVAILABLE",
          refundStatus: "NOT_REQUIRED",
        }),
      }),
    );
    expect(statusHistoryCreate).toHaveBeenCalled();
    expect(auditCreate).toHaveBeenCalled();
    expect(eventCreate).toHaveBeenCalled();
  });

  it("rejects client cancellation attempts before lookup and persistence", async () => {
    const orderFindUnique = jest.fn();
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
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
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        reasonCode: "CUSTOMER_REQUEST",
      }),
    ).rejects.toEqual(new AppError("FORBIDDEN", "User role cannot cancel orders", 403, {
      role: "client",
    }));

    expect(orderFindUnique).not.toHaveBeenCalled();
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid states with the controlled error contract and no side effects", async () => {
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          courierId: "courier-1",
          status: "DELIVERED",
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          cancelledByUserId: null,
          cancellationReasonCode: null,
          cancelledAt: null,
          updatedAt: new Date("2026-04-03T10:00:00.000Z"),
          isDeleted: false,
        }),
        update: orderUpdate,
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

    const error = await module.controller
      .cancelOrder({
        orderId: "order-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        reasonCode: "SHOP_UNAVAILABLE",
      })
      .catch((caught: AppError) => caught);

    expect(error).toEqual(
      new AppError("CONFLICT", "Order cannot be cancelled from the current state", 409, {
        orderId: "order-1",
        currentStatus: "DELIVERED",
        allowedStatuses: "CREATED,ASSIGNED,IN_PROGRESS",
      }),
    );

    if (!(error instanceof AppError)) {
      throw new Error("Expected AppError");
    }

    expect(error.toPayload("trace-cancellation-1")).toEqual({
      error: {
        code: "CONFLICT",
        message: "Order cannot be cancelled from the current state",
        details: {
          orderId: "order-1",
          currentStatus: "DELIVERED",
          allowedStatuses: "CREATED,ASSIGNED,IN_PROGRESS",
        },
      },
      trace_id: "trace-cancellation-1",
    });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("rejects courier cancellation outside the unavailable-case without side effects", async () => {
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-2",
          courierId: "courier-1",
          status: "ASSIGNED",
          paymentStatus: "PAID",
          refundStatus: "NOT_REQUIRED",
          refundNote: null,
          cancelledByUserId: null,
          cancellationReasonCode: null,
          cancelledAt: null,
          updatedAt: new Date("2026-04-03T10:00:00.000Z"),
          isDeleted: false,
        }),
        update: orderUpdate,
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
        orderId: "order-2",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        reasonCode: "SHOP_UNAVAILABLE",
      }),
    ).rejects.toEqual(
      new AppError(
        "FORBIDDEN",
        "Courier cancellation requires the unavailable-case reason",
        403,
        {
          orderId: "order-2",
          reasonCode: "SHOP_UNAVAILABLE",
          expectedReasonCode: "COURIER_UNAVAILABLE",
        },
      ),
    );

    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

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
      if (storedOrder.id !== where.id || storedOrder.refundStatus !== where.refundStatus) {
        return { count: 0 };
      }

      storedOrder = {
        ...storedOrder,
        ...data,
        updatedAt: new Date("2026-04-03T12:10:00.000Z"),
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

    expect(orderFindUnique).toHaveBeenCalledTimes(5);
    expect(orderUpdate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CANCELLED_BY_ADMIN",
          cancelledByUserId: "admin-9",
          cancellationReasonCode: "SHOP_UNAVAILABLE",
          refundStatus: "PENDING_MANUAL",
        }),
      }),
    );
    expect(orderUpdateMany).toHaveBeenCalledWith({
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
});
