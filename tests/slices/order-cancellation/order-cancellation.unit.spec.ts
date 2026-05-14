import { OrderCancellationService } from "../../../backend/src/slices/order-cancellation/application/order-cancellation.service";
import type {
  AuthorizedOrderCancellationInput,
  AuthorizedOrderRefundUpdateInput,
  OrderCancellationRepository,
  PersistOrderRefundUpdateInput,
} from "../../../backend/src/slices/order-cancellation/domain/order-cancellation.types";
import { AppError } from "../../../backend/src/shared/errors/app-error";

const createRepository = (): OrderCancellationRepository => ({
  findOrderById: async () => ({
    id: "order-1",
    courierId: "courier-1",
    status: "ASSIGNED",
    paymentStatus: "PAID",
    refundStatus: "PENDING_MANUAL",
    refundNote: null,
    cancelledByUserId: null,
    cancellationReasonCode: null,
    cancelledAt: null,
    updatedAt: new Date("2026-04-03T10:00:00.000Z"),
    isDeleted: false,
  }),
  recordCancellation: async () => ({
    order: {
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
    },
    statusHistory: {
      id: 101n,
      orderId: "order-1",
      oldStatus: "ASSIGNED",
      newStatus: "CANCELLED_BY_ADMIN",
      changedByUserId: "admin-1",
      changedAt: new Date("2026-04-03T10:05:00.000Z"),
    },
    audit: {
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
    },
    event: {
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
    },
    revision: "103",
  }),
  recordRefundUpdate: async () => ({
    order: {
      id: "order-1",
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
    },
    audit: {
      id: 104n,
      orderId: "order-1",
      actorUserId: "admin-1",
      actorRole: "ADMIN",
      action: "refund_updated",
      reasonCode: "SHOP_UNAVAILABLE",
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
      fromStatus: "CANCELLED_BY_ADMIN",
      toStatus: "CANCELLED_BY_ADMIN",
      createdAt: new Date("2026-04-03T10:15:00.000Z"),
    },
    event: {
      id: 105n,
      type: "order.refund_updated",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        status: "CANCELLED_BY_ADMIN",
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
        updatedByUserId: "admin-1",
        updatedAt: "2026-04-03T10:15:00.000Z",
      },
      createdAt: new Date("2026-04-03T10:15:00.000Z"),
    },
    revision: "105",
  }),
});

describe("order-cancellation service", () => {
  it("cancels an order for admin actors in allowed states", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
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
    const recordCancellation = jest.fn().mockResolvedValue(await createRepository().recordCancellation({
      orderId: "order-1",
      actor: {
        userId: "admin-1",
        role: "admin",
      },
      oldStatus: "ASSIGNED",
      newStatus: "CANCELLED_BY_ADMIN",
      reasonCode: "SHOP_UNAVAILABLE",
      refundStatus: "PENDING_MANUAL",
      refundNote: null,
      cancelledAt: new Date("2026-04-03T10:05:00.000Z"),
    }));
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordCancellation,
    });
    const input: AuthorizedOrderCancellationInput = {
      orderId: "order-1",
      actor: {
        userId: "admin-1",
        role: "admin",
      },
      reasonCode: "SHOP_UNAVAILABLE",
    };

    await expect(service.cancelOrder(input)).resolves.toEqual({
      orderId: "order-1",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "PENDING_MANUAL",
      updatedAt: new Date("2026-04-03T10:05:00.000Z"),
      revision: "103",
    });
    expect(recordCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        oldStatus: "ASSIGNED",
        newStatus: "CANCELLED_BY_ADMIN",
        reasonCode: "SHOP_UNAVAILABLE",
        refundStatus: "PENDING_MANUAL",
        refundNote: null,
      }),
    );
  });

  it("treats boss as admin-equivalent for cancellation", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "IN_PROGRESS",
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      cancelledByUserId: null,
      cancellationReasonCode: null,
      cancelledAt: null,
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const recordCancellation = jest.fn().mockResolvedValue(await createRepository().recordCancellation({
      orderId: "order-1",
      actor: {
        userId: "boss-1",
        role: "boss",
      },
      oldStatus: "IN_PROGRESS",
      newStatus: "CANCELLED_BY_ADMIN",
      reasonCode: "OPS_DELAY",
      refundStatus: "PENDING_MANUAL",
      refundNote: null,
      cancelledAt: new Date("2026-04-03T10:05:00.000Z"),
    }));
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordCancellation,
    });

    await expect(
      service.cancelOrder({
        orderId: "order-1",
        actor: {
          userId: "boss-1",
          role: "boss",
        },
        reasonCode: "OPS_DELAY",
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "PENDING_MANUAL",
      updatedAt: new Date("2026-04-03T10:05:00.000Z"),
      revision: "103",
    });
    expect(recordCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: {
          userId: "boss-1",
          role: "boss",
        },
        newStatus: "CANCELLED_BY_ADMIN",
      }),
    );
  });

  it("cancels an order for the assigned courier only in the unavailable-case", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "IN_PROGRESS",
      paymentStatus: "FAILED",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      cancelledByUserId: null,
      cancellationReasonCode: null,
      cancelledAt: null,
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const recordCancellation = jest.fn().mockResolvedValue({
      ...(await createRepository().recordCancellation({
        orderId: "order-1",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        oldStatus: "IN_PROGRESS",
        newStatus: "CANCELLED_BY_COURIER_UNAVAILABLE",
        reasonCode: "COURIER_UNAVAILABLE",
        refundStatus: "NOT_REQUIRED",
        refundNote: null,
        cancelledAt: new Date("2026-04-03T10:05:00.000Z"),
      })),
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "CANCELLED_BY_COURIER_UNAVAILABLE",
        paymentStatus: "FAILED",
        refundStatus: "NOT_REQUIRED",
        refundNote: null,
        cancelledByUserId: "courier-1",
        cancellationReasonCode: "COURIER_UNAVAILABLE",
        cancelledAt: new Date("2026-04-03T10:05:00.000Z"),
        updatedAt: new Date("2026-04-03T10:05:00.000Z"),
        isDeleted: false,
      },
      revision: "203",
    });
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordCancellation,
    });

    await expect(
      service.cancelOrder({
        orderId: "order-1",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        reasonCode: "COURIER_UNAVAILABLE",
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      status: "CANCELLED_BY_COURIER_UNAVAILABLE",
      refundStatus: "NOT_REQUIRED",
      updatedAt: new Date("2026-04-03T10:05:00.000Z"),
      revision: "203",
    });
    expect(recordCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        newStatus: "CANCELLED_BY_COURIER_UNAVAILABLE",
        refundStatus: "NOT_REQUIRED",
        reasonCode: "COURIER_UNAVAILABLE",
      }),
    );
  });

  it("rejects forbidden roles before lookup and persistence", async () => {
    const findOrderById = jest.fn();
    const recordCancellation = jest.fn();
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordCancellation,
    });

    await expect(
      service.cancelOrder({
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
    expect(findOrderById).not.toHaveBeenCalled();
    expect(recordCancellation).not.toHaveBeenCalled();
  });

  it("rejects invalid order states without persistence side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
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
    });
    const recordCancellation = jest.fn();
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordCancellation,
    });

    await expect(
      service.cancelOrder({
        orderId: "order-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        reasonCode: "SHOP_UNAVAILABLE",
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Order cannot be cancelled from the current state", 409, {
        orderId: "order-1",
        currentStatus: "DELIVERED",
        allowedStatuses: "CREATED,ASSIGNED,IN_PROGRESS",
      }),
    );
    expect(recordCancellation).not.toHaveBeenCalled();
  });

  it("returns manual refund update baseline without reopening the cancelled order status", async () => {
    const recordRefundUpdate = jest.fn().mockResolvedValue(
      await createRepository().recordRefundUpdate({
        orderId: "order-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        refundStatus: "DONE",
        refundNote: "Cash returned offline",
        updatedAt: new Date("2026-04-03T10:15:00.000Z"),
      }),
    );
    const service = new OrderCancellationService({
      ...createRepository(),
      recordRefundUpdate,
    });
    const input: PersistOrderRefundUpdateInput = {
      orderId: "order-1",
      actor: {
        userId: "admin-1",
        role: "admin",
      },
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
      updatedAt: new Date("2026-04-03T10:15:00.000Z"),
    };

    await expect(service.recordRefundUpdateBaseline(input)).resolves.toEqual({
      orderId: "order-1",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
      updatedAt: new Date("2026-04-03T10:15:00.000Z"),
      revision: "105",
    });
    expect(recordRefundUpdate).toHaveBeenCalledWith(input);
  });

  it("persists a manual refund outcome with a required operator note", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
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
    const recordRefundUpdate = jest.fn().mockResolvedValue(
      await createRepository().recordRefundUpdate({
        orderId: "order-1",
        actor: {
          userId: "operator-1",
          role: "operator",
        },
        refundStatus: "DONE",
        refundNote: "  Cash returned offline at pickup desk.  ",
        updatedAt: new Date("2026-04-03T10:15:00.000Z"),
      }),
    );
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordRefundUpdate,
    });
    const input: AuthorizedOrderRefundUpdateInput = {
      orderId: "order-1",
      actor: {
        userId: "operator-1",
        role: "operator",
      },
      refundStatus: "DONE",
      refundNote: "  Cash returned offline at pickup desk.  ",
    };

    await expect(service.recordRefundUpdate(input)).resolves.toEqual({
      orderId: "order-1",
      status: "CANCELLED_BY_ADMIN",
      refundStatus: "DONE",
      refundNote: "Cash returned offline",
      updatedAt: new Date("2026-04-03T10:15:00.000Z"),
      revision: "105",
    });
    expect(recordRefundUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        actor: {
          userId: "operator-1",
          role: "operator",
        },
        refundStatus: "DONE",
        refundNote: "Cash returned offline at pickup desk.",
      }),
    );
  });

  it("rejects refund updates for unpaid cancelled orders without persistence side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
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
    const recordRefundUpdate = jest.fn();
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordRefundUpdate,
    });

    await expect(
      service.recordRefundUpdate({
        orderId: "order-2",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        refundStatus: "REJECTED",
        refundNote: "Provider rejected the refund request.",
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Manual refund tracking is not required for unpaid cancellations", 409, {
        orderId: "order-2",
        paymentStatus: "FAILED",
        refundStatus: "NOT_REQUIRED",
      }),
    );
    expect(recordRefundUpdate).not.toHaveBeenCalled();
  });

  it("rejects refund updates without a non-empty operator note", async () => {
    const findOrderById = jest.fn();
    const recordRefundUpdate = jest.fn();
    const service = new OrderCancellationService({
      ...createRepository(),
      findOrderById,
      recordRefundUpdate,
    });

    await expect(
      service.recordRefundUpdate({
        orderId: "order-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        refundStatus: "DONE",
        refundNote: "   ",
      }),
    ).rejects.toEqual(new AppError("VALIDATION_ERROR", "Refund note is required", 400, {
      field: "refundNote",
    }));
    expect(findOrderById).not.toHaveBeenCalled();
    expect(recordRefundUpdate).not.toHaveBeenCalled();
  });
});
