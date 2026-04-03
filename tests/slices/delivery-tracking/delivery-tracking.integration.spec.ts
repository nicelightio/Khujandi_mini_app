import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import type { DeliveryTrackingPrismaProvider } from "../../../backend/src/slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository";
import { createDeliveryTrackingModule } from "../../../backend/src/slices/delivery-tracking/presentation/delivery-tracking.module";

type DeliveryTrackingPrismaClient = Omit<DeliveryTrackingPrismaProvider["client"], "$transaction">;

const createPrismaProvider = (
  client: DeliveryTrackingPrismaClient,
): DeliveryTrackingPrismaProvider => ({
  client: {
    ...client,
    $transaction: async (callback) => callback(client),
  },
});

describe("delivery-tracking module integration", () => {
  it("drives the valid courier transition chain and writes history plus events with polling metadata", async () => {
    const updateMoments = [
      new Date("2026-04-03T10:00:05.000Z"),
      new Date("2026-04-03T10:10:05.000Z"),
      new Date("2026-04-03T10:20:05.000Z"),
    ];
    const eventIds = [202n, 203n, 204n];
    let orderState = {
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    };
    const orderFindUnique = jest.fn().mockImplementation(async () => ({ ...orderState }));
    const orderUpdate = jest.fn().mockImplementation(async (args) => {
      const nextUpdatedAt = updateMoments[orderUpdate.mock.calls.length - 1];
      orderState = {
        ...orderState,
        status: args.data.status,
        updatedAt: nextUpdatedAt,
      };

      return {
        ...orderState,
      };
    });
    const statusHistoryCreate = jest.fn().mockImplementation(async (args) => ({
      id: BigInt(201 + statusHistoryCreate.mock.calls.length),
      ...args.data,
    }));
    const eventCreate = jest.fn().mockImplementation(async (args) => ({
      id: eventIds[eventCreate.mock.calls.length - 1],
      ...args.data,
      createdAt: orderState.updatedAt,
    }));
    const eventFindMany = jest.fn().mockResolvedValue([]);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      event: {
        create: eventCreate,
        findMany: eventFindMany,
      },
    });
    const context = createTestContext(prisma.client);
    const module = createDeliveryTrackingModule(prisma);

    expect(context.prisma).toBe(prisma.client);
    await expect(module.controller.getOrderById("order-1")).resolves.toEqual({
      id: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T09:55:00.000Z"),
      isDeleted: false,
    });

    await expect(
      module.controller.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "IN_PROGRESS",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      status: "IN_PROGRESS",
      updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      revision: "202",
    });
    await expect(
      module.controller.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "DELIVERED",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      status: "DELIVERED",
      updatedAt: new Date("2026-04-03T10:10:05.000Z"),
      revision: "203",
    });
    await expect(
      module.controller.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "COMPLETED",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-03T10:20:05.000Z"),
      revision: "204",
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
    expect(orderUpdate).toHaveBeenNthCalledWith(1, {
      where: {
        id: "order-1",
      },
      data: {
        status: "IN_PROGRESS",
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        updatedAt: true,
        isDeleted: true,
      },
    });
    expect(orderUpdate).toHaveBeenNthCalledWith(2, {
      where: {
        id: "order-1",
      },
      data: {
        status: "DELIVERED",
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        updatedAt: true,
        isDeleted: true,
      },
    });
    expect(orderUpdate).toHaveBeenNthCalledWith(3, {
      where: {
        id: "order-1",
      },
      data: {
        status: "COMPLETED",
      },
      select: {
        id: true,
        courierId: true,
        status: true,
        updatedAt: true,
        isDeleted: true,
      },
    });
    expect(statusHistoryCreate).toHaveBeenNthCalledWith(1, {
      data: {
        orderId: "order-1",
        oldStatus: "ASSIGNED",
        newStatus: "IN_PROGRESS",
        changedByUserId: "courier-1",
        changedAt: expect.any(Date),
      },
    });
    expect(statusHistoryCreate).toHaveBeenNthCalledWith(2, {
      data: {
        orderId: "order-1",
        oldStatus: "IN_PROGRESS",
        newStatus: "DELIVERED",
        changedByUserId: "courier-1",
        changedAt: expect.any(Date),
      },
    });
    expect(statusHistoryCreate).toHaveBeenNthCalledWith(3, {
      data: {
        orderId: "order-1",
        oldStatus: "DELIVERED",
        newStatus: "COMPLETED",
        changedByUserId: "courier-1",
        changedAt: expect.any(Date),
      },
    });
    expect(eventCreate).toHaveBeenNthCalledWith(1, {
      data: {
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "ASSIGNED",
          status: "IN_PROGRESS",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:00:05.000Z",
        },
      },
    });
    expect(eventCreate).toHaveBeenNthCalledWith(2, {
      data: {
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "IN_PROGRESS",
          status: "DELIVERED",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:10:05.000Z",
        },
      },
    });
    expect(eventCreate).toHaveBeenNthCalledWith(3, {
      data: {
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "DELIVERED",
          status: "COMPLETED",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:20:05.000Z",
        },
      },
    });

    expect(orderUpdate).toHaveBeenCalledTimes(3);
    expect(statusHistoryCreate).toHaveBeenCalledTimes(3);
    expect(eventCreate).toHaveBeenCalledTimes(3);
    expect(orderUpdate.mock.invocationCallOrder[0]).toBeLessThan(statusHistoryCreate.mock.invocationCallOrder[0]);
    expect(statusHistoryCreate.mock.invocationCallOrder[0]).toBeLessThan(eventCreate.mock.invocationCallOrder[0]);
  });

  it("returns 409 for invalid transition attempts without persistence side effects", async () => {
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          courierId: "courier-1",
          status: "ASSIGNED",
          updatedAt: new Date("2026-04-03T10:00:00.000Z"),
          isDeleted: false,
        }),
        update: orderUpdate,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      event: {
        create: eventCreate,
        findMany: jest.fn().mockResolvedValue([]),
      },
    });
    const module = createDeliveryTrackingModule(prisma);

    const error = await module.controller
      .recordStatusTransition({
        orderId: "order-1",
        nextStatus: "DELIVERED",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      })
      .catch((caught) => caught);

    expect(error).toEqual(
      new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        nextStatus: "DELIVERED",
        expectedStatus: "IN_PROGRESS",
      }),
    );
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("rejects courier actors that do not own the order without persistence side effects", async () => {
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          courierId: "courier-2",
          status: "ASSIGNED",
          updatedAt: new Date("2026-04-03T10:00:00.000Z"),
          isDeleted: false,
        }),
        update: orderUpdate,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      event: {
        create: eventCreate,
        findMany: jest.fn().mockResolvedValue([]),
      },
    });
    const module = createDeliveryTrackingModule(prisma);

    await expect(
      module.controller.recordStatusTransition({
        orderId: "order-1",
        nextStatus: "IN_PROGRESS",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
      }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
      details: {
        orderId: "order-1",
        courierId: "courier-1",
        assignedCourierId: "courier-2",
      },
    });

    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("returns ordered events with a stable string cursor baseline", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue(null);
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const eventCreate = jest.fn();
    const eventFindMany = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 104n,
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:00:05.000Z",
          },
          createdAt: new Date("2026-04-03T10:00:05.000Z"),
        },
        {
          id: 105n,
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "IN_PROGRESS",
            status: "DELIVERED",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:10:05.000Z",
          },
          createdAt: new Date("2026-04-03T10:10:05.000Z"),
        },
      ])
      .mockResolvedValueOnce([]);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: orderUpdate,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      event: {
        create: eventCreate,
        findMany: eventFindMany,
      },
    });
    const module = createDeliveryTrackingModule(prisma);

    await expect(module.controller.getEventsSince("103")).resolves.toEqual({
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:00:05.000Z",
          },
          revision: "104",
          createdAt: "2026-04-03T10:00:05.000Z",
        },
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "IN_PROGRESS",
            status: "DELIVERED",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:10:05.000Z",
          },
          revision: "105",
          createdAt: "2026-04-03T10:10:05.000Z",
        },
      ],
      nextCursor: "105",
    });
    expect(eventFindMany).toHaveBeenCalledWith({
      where: {
        id: {
          gt: 103n,
        },
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        type: true,
        entity: true,
        entityId: true,
        payload: true,
        createdAt: true,
      },
    });

    await expect(module.controller.getEventsSince("105")).resolves.toEqual({
      events: [],
      nextCursor: "105",
    });
    expect(eventFindMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: {
          gt: 105n,
        },
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        type: true,
        entity: true,
        entityId: true,
        payload: true,
        createdAt: true,
      },
    });

    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("returns stable results for duplicate polling requests with the same cursor", async () => {
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const eventCreate = jest.fn();
    const duplicatedResult = [
      {
        id: 104n,
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "ASSIGNED",
          status: "IN_PROGRESS",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:00:05.000Z",
        },
        createdAt: new Date("2026-04-03T10:00:05.000Z"),
      },
      {
        id: 105n,
        type: "order.status_changed",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          previousStatus: "IN_PROGRESS",
          status: "DELIVERED",
          changedByUserId: "courier-1",
          updatedAt: "2026-04-03T10:10:05.000Z",
        },
        createdAt: new Date("2026-04-03T10:10:05.000Z"),
      },
    ];
    const eventFindMany = jest.fn().mockResolvedValue(duplicatedResult);
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: orderUpdate,
      },
      orderStatusHistory: {
        create: statusHistoryCreate,
      },
      event: {
        create: eventCreate,
        findMany: eventFindMany,
      },
    });
    const module = createDeliveryTrackingModule(prisma);

    const firstResult = await module.controller.getEventsSince("103");
    const secondResult = await module.controller.getEventsSince("103");

    expect(firstResult).toEqual({
      events: [
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "ASSIGNED",
            status: "IN_PROGRESS",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:00:05.000Z",
          },
          revision: "104",
          createdAt: "2026-04-03T10:00:05.000Z",
        },
        {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "IN_PROGRESS",
            status: "DELIVERED",
            changedByUserId: "courier-1",
            updatedAt: "2026-04-03T10:10:05.000Z",
          },
          revision: "105",
          createdAt: "2026-04-03T10:10:05.000Z",
        },
      ],
      nextCursor: "105",
    });
    expect(secondResult).toEqual(firstResult);
    expect(eventFindMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: {
          gt: 103n,
        },
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        type: true,
        entity: true,
        entityId: true,
        payload: true,
        createdAt: true,
      },
    });
    expect(eventFindMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: {
          gt: 103n,
        },
      },
      orderBy: {
        id: "asc",
      },
      select: {
        id: true,
        type: true,
        entity: true,
        entityId: true,
        payload: true,
        createdAt: true,
      },
    });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });
});
