import { createDeliveryAssignmentModule } from "../../../backend/src/slices/delivery-assignment/presentation/delivery-assignment.module";
import type { DeliveryAssignmentPrismaProvider } from "../../../backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";
import { AppError } from "../../../backend/src/shared/errors/app-error";

type DeliveryAssignmentPrismaClient = Omit<DeliveryAssignmentPrismaProvider["client"], "$transaction">;

const createPrismaProvider = (
  client: DeliveryAssignmentPrismaClient,
): DeliveryAssignmentPrismaProvider => ({
  client: {
    ...client,
    $transaction: async (callback) => callback(client),
  },
});

describe("delivery-assignment module integration", () => {
  it("wires successful assignment through the owning slice boundary", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "COURIER",
      isActive: true,
      name: "Courier One",
    });
    const orderUpdate = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      isDeleted: false,
    });
    const statusHistoryCreate = jest.fn().mockResolvedValue({
      id: 101n,
      orderId: "order-1",
      oldStatus: "CREATED",
      newStatus: "ASSIGNED",
      changedByUserId: "admin-1",
      changedAt: new Date("2026-04-03T10:00:05.000Z"),
    });
    const auditCreate = jest.fn().mockResolvedValue({
      id: 102n,
      orderId: "order-1",
      adminUserId: "admin-1",
      courierUserId: "courier-1",
      action: "assigned",
      createdAt: new Date("2026-04-03T10:00:05.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 103n,
      type: "order.assigned",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        courierId: "courier-1",
        assignedByUserId: "admin-1",
        status: "ASSIGNED",
        updatedAt: "2026-04-03T10:00:05.000Z",
      },
      createdAt: new Date("2026-04-03T10:00:05.000Z"),
    });
    const notifyCourierAssigned = jest.fn().mockResolvedValue(undefined);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
      },
      user: {
        findUnique: userFindUnique,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      deliveryAssignmentAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const context = createTestContext(prisma.client);
    const module = createDeliveryAssignmentModule(prisma, {
      notifyCourierAssigned,
    });

    expect(context.prisma).toBe(prisma.client);
    await expect(
      module.controller.assignCourier({
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
      updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      revision: "103",
    });
    expect(orderFindUnique).toHaveBeenCalledWith({
      where: {
        id: "order-1",
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        updatedAt: true,
        isDeleted: true,
      },
    });
    expect(userFindUnique).toHaveBeenCalledWith({
      where: {
        id: "courier-1",
      },
      select: {
        id: true,
        telegramId: true,
        role: true,
        isActive: true,
        name: true,
      },
    });
    expect(orderUpdate).toHaveBeenCalledWith({
      where: {
        id: "order-1",
      },
      data: {
        courierId: "courier-1",
        status: "ASSIGNED",
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        updatedAt: true,
        isDeleted: true,
      },
    });
    expect(statusHistoryCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        oldStatus: "CREATED",
        newStatus: "ASSIGNED",
        changedByUserId: "admin-1",
      }),
    });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: "order-1",
        adminUserId: "admin-1",
        courierUserId: "courier-1",
        action: "assigned",
      }),
    });
    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        type: "order.assigned",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          courierId: "courier-1",
          assignedByUserId: "admin-1",
          status: "ASSIGNED",
          updatedAt: "2026-04-03T10:00:05.000Z",
        },
      },
    });
    expect(notifyCourierAssigned).toHaveBeenCalledWith({
      orderId: "order-1",
      courierId: "courier-1",
      courierTelegramId: "10001",
      courierName: "Courier One",
      assignedByUserId: "admin-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      revision: "103",
    });

    expect(orderUpdate.mock.invocationCallOrder[0]).toBeLessThan(statusHistoryCreate.mock.invocationCallOrder[0]);
    expect(statusHistoryCreate.mock.invocationCallOrder[0]).toBeLessThan(eventCreate.mock.invocationCallOrder[0]);
    expect(eventCreate.mock.invocationCallOrder[0]).toBeLessThan(notifyCourierAssigned.mock.invocationCallOrder[0]);
  });

  it("keeps assignment success when targeted notification delivery is retried separately", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: null,
      status: "CREATED",
      updatedAt: new Date("2026-04-03T10:00:00.000Z"),
      isDeleted: false,
    });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "COURIER",
      isActive: true,
      name: "Courier One",
    });
    const orderUpdate = jest.fn().mockResolvedValue({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      isDeleted: false,
    });
    const statusHistoryCreate = jest.fn().mockResolvedValue({
      id: 101n,
      orderId: "order-1",
      oldStatus: "CREATED",
      newStatus: "ASSIGNED",
      changedByUserId: "admin-1",
      changedAt: new Date("2026-04-03T10:00:05.000Z"),
    });
    const auditCreate = jest.fn().mockResolvedValue({
      id: 102n,
      orderId: "order-1",
      adminUserId: "admin-1",
      courierUserId: "courier-1",
      action: "assigned",
      createdAt: new Date("2026-04-03T10:00:05.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 103n,
      type: "order.assigned",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        courierId: "courier-1",
        assignedByUserId: "admin-1",
        status: "ASSIGNED",
        updatedAt: "2026-04-03T10:00:05.000Z",
      },
      createdAt: new Date("2026-04-03T10:00:05.000Z"),
    });
    const notifyCourierAssigned = jest.fn().mockRejectedValue(new Error("telegram unavailable"));
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
      },
      user: {
        findUnique: userFindUnique,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      deliveryAssignmentAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createDeliveryAssignmentModule(prisma, {
      notifyCourierAssigned,
    });

    await expect(
      module.controller.assignCourier({
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
      updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      revision: "103",
    });

    expect(orderUpdate).toHaveBeenCalledTimes(1);
    expect(statusHistoryCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(eventCreate).toHaveBeenCalledTimes(1);
    expect(notifyCourierAssigned).toHaveBeenCalledTimes(1);
  });

  it("returns controlled errors without persistence side effects for invalid requests", async () => {
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          courierId: null,
          status: "IN_PROGRESS",
          updatedAt: new Date("2026-04-03T10:00:00.000Z"),
          isDeleted: false,
        }),
        update: orderUpdate,
      },
      user: {
        findUnique: jest.fn(),
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      deliveryAssignmentAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createDeliveryAssignmentModule(prisma);

    const error = await module.controller
      .assignCourier({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
      })
      .catch((caught: AppError) => caught);

    expect(error).toEqual(
      new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId: "order-1",
        currentStatus: "IN_PROGRESS",
        expectedStatus: "CREATED",
      }),
    );

    if (!(error instanceof AppError)) {
      throw new Error("Expected AppError");
    }

    expect(error.toPayload("trace-assignment-1")).toEqual({
      error: {
        code: "CONFLICT",
        message: "Order cannot be assigned from the current state",
        details: {
          orderId: "order-1",
          currentStatus: "IN_PROGRESS",
          expectedStatus: "CREATED",
        },
      },
      trace_id: "trace-assignment-1",
    });

    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid roles before lookup and persistence", async () => {
    const orderFindUnique = jest.fn();
    const userFindUnique = jest.fn();
    const orderUpdate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
      },
      user: {
        findUnique: userFindUnique,
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      deliveryAssignmentAudit: {
        create: jest.fn(),
      },
      event: {
        create: jest.fn(),
      },
    });
    const module = createDeliveryAssignmentModule(prisma);

    await expect(
      module.controller.assignCourier({
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

    expect(orderFindUnique).not.toHaveBeenCalled();
    expect(userFindUnique).not.toHaveBeenCalled();
    expect(orderUpdate).not.toHaveBeenCalled();
  });

  it("rejects invalid courier targets without persistence side effects", async () => {
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          courierId: null,
          status: "CREATED",
          updatedAt: new Date("2026-04-03T10:00:00.000Z"),
          isDeleted: false,
        }),
        update: orderUpdate,
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "courier-1",
          telegramId: "10001",
          role: "COURIER",
          isActive: false,
          name: "Courier One",
        }),
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      deliveryAssignmentAudit: {
        create: auditCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createDeliveryAssignmentModule(prisma);

    await expect(
      module.controller.assignCourier({
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

    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });
});
