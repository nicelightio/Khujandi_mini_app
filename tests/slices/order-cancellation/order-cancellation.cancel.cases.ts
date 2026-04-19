import { createOrderCancellationModule } from "../../../backend/src/slices/order-cancellation/presentation/order-cancellation.module";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";
import { createPrismaProvider } from "./order-cancellation.integration.test-helpers";

export const registerOrderCancellationCases = () => {
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
};
