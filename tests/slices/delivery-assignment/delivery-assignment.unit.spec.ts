import { TelegramBotDeliveryAssignmentNotifier } from "../../../backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier";
import { DeliveryAssignmentService } from "../../../backend/src/slices/delivery-assignment/application/delivery-assignment.service";
import type {
  DeliveryAssignmentNotifier,
  DeliveryAssignmentRepository,
} from "../../../backend/src/slices/delivery-assignment/domain/delivery-assignment.types";
import { AppError } from "../../../backend/src/shared/errors/app-error";

const createRepository = (): DeliveryAssignmentRepository => ({
  findOrderById: async () => null,
  findCourierById: async () => null,
  assignCourier: async () => ({
    order: {
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    },
    statusHistory: {
      id: 1n,
      orderId: "order-1",
      oldStatus: "CREATED",
      newStatus: "ASSIGNED",
      changedByUserId: "admin-1",
      changedAt: new Date("2026-04-03T10:00:00.000Z"),
    },
    audit: {
      id: 2n,
      orderId: "order-1",
      adminUserId: "admin-1",
      courierUserId: "courier-1",
      action: "assigned",
      createdAt: new Date("2026-04-03T10:00:00.000Z"),
    },
    event: {
      id: 3n,
      type: "order.assigned",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        courierId: "courier-1",
        assignedByUserId: "admin-1",
        status: "ASSIGNED",
        updatedAt: "2026-04-03T10:00:00.000Z",
      },
      createdAt: new Date("2026-04-03T10:00:00.000Z"),
    },
    revision: "3",
  }),
});

describe("delivery-assignment service", () => {
  it("dispatches assignment notification only to the assigned courier target", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const notifier = new TelegramBotDeliveryAssignmentNotifier({
      sendMessage,
    });

    await expect(
      notifier.notifyCourierAssigned({
        orderId: "order-1",
        courierId: "courier-1",
        courierTelegramId: "10001",
        courierName: "Courier One",
        assignedByUserId: "admin-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        revision: "3",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "10001",
      text: "Order order-1 has been assigned to you. Status: ASSIGNED. Courier: Courier One.",
      dedupeKey: "order.assigned:order-1:3",
    });
  });

  it("keeps order and courier lookup behind the owning slice repository", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
    });

    await expect(service.findOrderById("order-1")).resolves.toEqual({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    await expect(service.findCourierById("courier-1")).resolves.toEqual({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    expect(findOrderById).toHaveBeenCalledWith("order-1");
    expect(findCourierById).toHaveBeenCalledWith("courier-1");
  });

  it("assigns a courier for an authenticated admin and returns polling-friendly state", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    const assignCourier = jest.fn().mockResolvedValue({
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      },
      statusHistory: {
        id: 1n,
        orderId: "order-1",
        oldStatus: "CREATED",
        newStatus: "ASSIGNED",
        changedByUserId: "admin-1",
        changedAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      audit: {
        id: 2n,
        orderId: "order-1",
        adminUserId: "admin-1",
        courierUserId: "courier-1",
        action: "assigned",
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      event: {
        id: 3n,
        type: "order.assigned",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          courierId: "courier-1",
          assignedByUserId: "admin-1",
          status: "ASSIGNED",
          updatedAt: "2026-04-03T10:00:00.000Z",
        },
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      revision: "3",
    });
    const notifyCourierAssigned = jest.fn().mockResolvedValue(undefined);
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
      assignCourier,
    }, {
      notifyCourierAssigned,
    });

    await expect(
      service.assignCourier({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "3",
    });
    expect(assignCourier).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        courierId: "courier-1",
        adminUserId: "admin-1",
      }),
    );
    expect(notifyCourierAssigned).toHaveBeenCalledWith({
      orderId: "order-1",
      courierId: "courier-1",
      courierTelegramId: "10001",
      courierName: "Courier One",
      assignedByUserId: "admin-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "3",
    });
  });

  it("keeps committed assignment success even when notification transport fails", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    const assignCourier = jest.fn().mockResolvedValue({
      order: {
        id: "order-1",
        courierId: "courier-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      },
      statusHistory: {
        id: 1n,
        orderId: "order-1",
        oldStatus: "CREATED",
        newStatus: "ASSIGNED",
        changedByUserId: "admin-1",
        changedAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      audit: {
        id: 2n,
        orderId: "order-1",
        adminUserId: "admin-1",
        courierUserId: "courier-1",
        action: "assigned",
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      event: {
        id: 3n,
        type: "order.assigned",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          courierId: "courier-1",
          assignedByUserId: "admin-1",
          status: "ASSIGNED",
          updatedAt: "2026-04-03T10:00:00.000Z",
        },
        createdAt: new Date("2026-04-03T10:00:00.000Z"),
      },
      revision: "3",
    });
    const notifier: DeliveryAssignmentNotifier = {
      notifyCourierAssigned: jest.fn().mockRejectedValue(new Error("telegram unavailable")),
    };
    const service = new DeliveryAssignmentService(
      {
        ...createRepository(),
        findOrderById,
        findCourierById,
        assignCourier,
      },
      notifier,
    );

    await expect(
      service.assignCourier({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      revision: "3",
    });

    expect(assignCourier).toHaveBeenCalledTimes(1);
    expect(notifier.notifyCourierAssigned).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthenticated assignment without side effects", async () => {
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      assignCourier,
    });

    await expect(
      service.assignCourier({
        orderId: "order-1",
        courierId: "courier-1",
        actor: null,
      }),
    ).rejects.toEqual(
      new AppError("AUTH_REQUIRED", "Assignment requires an authenticated admin", 401),
    );
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("rejects non-admin roles before persistence", async () => {
    const findOrderById = jest.fn();
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      assignCourier,
    });

    await expect(
      service.assignCourier({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "manager-1",
          role: "manager",
        },
      }),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "User role cannot assign couriers", 403, {
        role: "manager",
      }),
    );
    expect(findOrderById).not.toHaveBeenCalled();
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("rejects invalid order state without persistence side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn();
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
      assignCourier,
    });

    await expect(
      service.assignCourier({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        expectedStatus: "CREATED",
      }),
    );
    expect(findCourierById).not.toHaveBeenCalled();
    expect(assignCourier).not.toHaveBeenCalled();
  });

  it("rejects invalid courier targets without persistence side effects", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const findCourierById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: false,
      name: "Courier One",
    });
    const assignCourier = jest.fn();
    const service = new DeliveryAssignmentService({
      ...createRepository(),
      findOrderById,
      findCourierById,
      assignCourier,
    });

    await expect(
      service.assignCourier({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
      }),
    ).rejects.toEqual(
      new AppError("COURIER_INVALID", "Courier is not eligible for assignment", 400, {
        courierId: "courier-1",
      }),
    );
    expect(assignCourier).not.toHaveBeenCalled();
  });
});
