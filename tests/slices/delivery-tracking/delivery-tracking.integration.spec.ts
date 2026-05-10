import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import type { DeliveryTrackingPrismaProvider } from "../../../backend/src/slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository";
import { createDeliveryTrackingModule } from "../../../backend/src/slices/delivery-tracking/presentation/delivery-tracking.module";

type DeliveryTrackingPrismaClient = Omit<DeliveryTrackingPrismaProvider["client"], "$transaction">;
type StatusEventRecord = {
  id: bigint;
  type: string;
  entity: string;
  entityId: string;
  payload: ReturnType<typeof statusEventPayload> & {
    changedByRole?: string;
    changedByName?: string;
  };
  createdAt: Date;
};

const orderSelect = {
  id: true,
  courierId: true,
  status: true,
  updatedAt: true,
  isDeleted: true,
};

const eventSelect = {
  id: true,
  type: true,
  entity: true,
  entityId: true,
  payload: true,
  createdAt: true,
};

const assignedOrder = {
  id: "order-1",
  courierId: "courier-1",
  status: "ASSIGNED",
  updatedAt: new Date("2026-04-03T09:55:00.000Z"),
  isDeleted: false,
};

const createPrismaProvider = (
  client: DeliveryTrackingPrismaClient,
): DeliveryTrackingPrismaProvider => ({
  client: {
    ...client,
    $transaction: async (callback) => callback(client),
  },
});

const statusEventPayload = (previousStatus: string, status: string, updatedAt: string) => ({
  orderId: "order-1",
  previousStatus,
  status,
  changedByUserId: "courier-1",
  updatedAt,
});

const persistedStatusEvent = (
  id: bigint,
  previousStatus: string,
  status: string,
  updatedAt: string,
): StatusEventRecord => ({
  id,
  type: "order.status_changed",
  entity: "order",
  entityId: "order-1",
  payload: statusEventPayload(previousStatus, status, updatedAt),
  createdAt: new Date(updatedAt),
});

const expectedStatusEvent = (
  revision: string,
  previousStatus: string,
  status: string,
  updatedAt: string,
) => ({
  type: "order.status_changed",
  entity: "order",
  entityId: "order-1",
  payload: statusEventPayload(previousStatus, status, updatedAt),
  revision,
  createdAt: updatedAt,
});

const eventFindManyArgs = (cursor: bigint) => ({
  where: {
    id: {
      gt: cursor,
    },
  },
  orderBy: {
    id: "asc",
  },
  select: eventSelect,
});

const expectNoPersistenceSideEffects = (
  orderUpdate: jest.Mock,
  statusHistoryCreate: jest.Mock,
  eventCreate: jest.Mock,
) => {
  expect(orderUpdate).not.toHaveBeenCalled();
  expect(statusHistoryCreate).not.toHaveBeenCalled();
  expect(eventCreate).not.toHaveBeenCalled();
};

describe("delivery-tracking module integration", () => {
  describe("courier status commands", () => {
    it("drives the valid courier transition chain and writes history plus events with polling metadata", async () => {
      const updateMoments = [
        new Date("2026-04-03T10:00:05.000Z"),
        new Date("2026-04-03T10:10:05.000Z"),
        new Date("2026-04-03T10:20:05.000Z"),
      ];
      const eventIds = [202n, 203n, 204n];
      let orderState = { ...assignedOrder };
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
      const persistedEvents: StatusEventRecord[] = [];
      const eventCreate = jest.fn().mockImplementation(async (args) => {
        const createdEvent = {
          id: eventIds[eventCreate.mock.calls.length - 1],
          ...args.data,
          createdAt: orderState.updatedAt,
        };

        persistedEvents.push(createdEvent);

        return createdEvent;
      });
      const eventFindMany = jest.fn().mockImplementation(async (args) => {
        const cursor = args.where.id.gt;

        return persistedEvents.filter((event) => event.id > cursor);
      });
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
        user: {
          findUnique: jest.fn().mockResolvedValue({
            telegramId: "10001",
          }),
        },
      });
      const context = createTestContext(prisma.client);
      const module = createDeliveryTrackingModule(prisma);

      expect(context.prisma).toBe(prisma.client);
      await expect(module.controller.getOrderById("order-1")).resolves.toEqual(assignedOrder);

      await expect(
        module.controller.recordStatusTransition({
          orderId: "order-1",
          nextStatus: "PICKED_UP",
          actor: {
            userId: "courier-1",
            role: "courier",
          },
        }),
      ).resolves.toEqual({
        orderId: "order-1",
        status: "PICKED_UP",
        updatedAt: new Date("2026-04-03T10:00:05.000Z"),
        revision: "202",
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
        updatedAt: new Date("2026-04-03T10:10:05.000Z"),
        revision: "203",
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
        updatedAt: new Date("2026-04-03T10:20:05.000Z"),
        revision: "204",
      });

      expect(orderFindUnique).toHaveBeenCalledWith({
        where: {
          id: "order-1",
        },
        select: orderSelect,
      });
      expect(orderUpdate).toHaveBeenNthCalledWith(1, {
        where: {
          id: "order-1",
        },
        data: {
          status: "PICKED_UP",
        },
        select: orderSelect,
      });
      expect(orderUpdate).toHaveBeenNthCalledWith(2, {
        where: {
          id: "order-1",
        },
        data: {
          status: "IN_PROGRESS",
        },
        select: orderSelect,
      });
      expect(orderUpdate).toHaveBeenNthCalledWith(3, {
        where: {
          id: "order-1",
        },
        data: {
          status: "DELIVERED",
        },
        select: orderSelect,
      });
      expect(statusHistoryCreate).toHaveBeenNthCalledWith(1, {
        data: {
          orderId: "order-1",
          oldStatus: "ASSIGNED",
          newStatus: "PICKED_UP",
          changedByUserId: "courier-1",
          changedAt: expect.any(Date),
        },
      });
      expect(statusHistoryCreate).toHaveBeenNthCalledWith(2, {
        data: {
          orderId: "order-1",
          oldStatus: "PICKED_UP",
          newStatus: "IN_PROGRESS",
          changedByUserId: "courier-1",
          changedAt: expect.any(Date),
        },
      });
      expect(statusHistoryCreate).toHaveBeenNthCalledWith(3, {
        data: {
          orderId: "order-1",
          oldStatus: "IN_PROGRESS",
          newStatus: "DELIVERED",
          changedByUserId: "courier-1",
          changedAt: expect.any(Date),
        },
      });
      expect(eventCreate).toHaveBeenNthCalledWith(1, {
        data: {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: statusEventPayload("ASSIGNED", "PICKED_UP", "2026-04-03T10:00:05.000Z"),
        },
      });
      expect(eventCreate).toHaveBeenNthCalledWith(2, {
        data: {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: statusEventPayload("PICKED_UP", "IN_PROGRESS", "2026-04-03T10:10:05.000Z"),
        },
      });
      expect(eventCreate).toHaveBeenNthCalledWith(3, {
        data: {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: statusEventPayload("IN_PROGRESS", "DELIVERED", "2026-04-03T10:20:05.000Z"),
        },
      });

      expect(orderUpdate).toHaveBeenCalledTimes(3);
      expect(statusHistoryCreate).toHaveBeenCalledTimes(3);
      expect(eventCreate).toHaveBeenCalledTimes(3);
      expect(orderUpdate.mock.invocationCallOrder[0]).toBeLessThan(statusHistoryCreate.mock.invocationCallOrder[0]);
      expect(statusHistoryCreate.mock.invocationCallOrder[0]).toBeLessThan(eventCreate.mock.invocationCallOrder[0]);

      await expect(module.controller.getEventsSince("201")).resolves.toEqual({
        events: [
          expectedStatusEvent("202", "ASSIGNED", "PICKED_UP", "2026-04-03T10:00:05.000Z"),
          expectedStatusEvent("203", "PICKED_UP", "IN_PROGRESS", "2026-04-03T10:10:05.000Z"),
          expectedStatusEvent("204", "IN_PROGRESS", "DELIVERED", "2026-04-03T10:20:05.000Z"),
        ],
        nextCursor: "204",
      });
      await expect(module.controller.getEventsSince("204")).resolves.toEqual({
        events: [],
        nextCursor: "204",
      });
      expect(eventFindMany).toHaveBeenNthCalledWith(1, eventFindManyArgs(201n));
      expect(eventFindMany).toHaveBeenNthCalledWith(2, eventFindManyArgs(204n));
    });

    it("dispatches status-change notifications after commit and swallows notifier outages", async () => {
      const orderFindUnique = jest
        .fn()
        .mockResolvedValueOnce(assignedOrder)
        .mockResolvedValueOnce(assignedOrder)
        .mockResolvedValueOnce(assignedOrder)
        .mockResolvedValueOnce(assignedOrder);
      const orderUpdate = jest.fn().mockResolvedValue({
        ...assignedOrder,
        status: "PICKED_UP",
        updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      });
      const statusHistoryCreate = jest.fn().mockResolvedValue({
        id: 201n,
        orderId: "order-1",
        oldStatus: "ASSIGNED",
        newStatus: "PICKED_UP",
        changedByUserId: "courier-1",
        changedAt: new Date("2026-04-03T10:00:05.000Z"),
      });
      const eventCreate = jest
        .fn()
        .mockResolvedValue(persistedStatusEvent(202n, "ASSIGNED", "PICKED_UP", "2026-04-03T10:00:05.000Z"));
      const userFindUnique = jest.fn().mockResolvedValue({
        telegramId: "10001",
      });
      const notifier = {
        notifyStatusChanged: jest.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("transport outage")),
      };
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
          findMany: jest.fn().mockResolvedValue([]),
        },
        user: {
          findUnique: userFindUnique,
        },
      });
      const module = createDeliveryTrackingModule(prisma, notifier);

      await expect(
        module.controller.recordStatusTransition({
          orderId: "order-1",
          nextStatus: "PICKED_UP",
          actor: {
            userId: "courier-1",
            role: "courier",
          },
        }),
      ).resolves.toEqual({
        orderId: "order-1",
        status: "PICKED_UP",
        updatedAt: new Date("2026-04-03T10:00:05.000Z"),
        revision: "202",
      });

      await expect(
        module.controller.recordStatusTransition({
          orderId: "order-1",
          nextStatus: "PICKED_UP",
          actor: {
            userId: "courier-1",
            role: "courier",
          },
        }),
      ).resolves.toEqual({
        orderId: "order-1",
        status: "PICKED_UP",
        updatedAt: new Date("2026-04-03T10:00:05.000Z"),
        revision: "202",
      });

      expect(userFindUnique).toHaveBeenCalledWith({
        where: {
          id: "courier-1",
        },
        select: {
          telegramId: true,
        },
      });
      expect(notifier.notifyStatusChanged).toHaveBeenNthCalledWith(1, {
        orderId: "order-1",
        courierTelegramId: "10001",
        status: "PICKED_UP",
        revision: "202",
        availableActions: ["IN_PROGRESS"],
      });
      expect(notifier.notifyStatusChanged).toHaveBeenCalledTimes(2);
      expect(orderUpdate).toHaveBeenCalledTimes(2);
      expect(statusHistoryCreate).toHaveBeenCalledTimes(2);
      expect(eventCreate).toHaveBeenCalledTimes(2);
    });

    it("returns 409 for invalid transition attempts without persistence side effects", async () => {
      const orderUpdate = jest.fn();
      const statusHistoryCreate = jest.fn();
      const eventCreate = jest.fn();
      const prisma = createPrismaProvider({
        order: {
          findUnique: jest.fn().mockResolvedValue({
            ...assignedOrder,
            updatedAt: new Date("2026-04-03T10:00:00.000Z"),
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
        user: {
          findUnique: jest.fn().mockResolvedValue({
            telegramId: "10001",
          }),
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
          expectedStatus: "PICKED_UP",
        }),
      );
      expectNoPersistenceSideEffects(orderUpdate, statusHistoryCreate, eventCreate);
    });

    it("returns 409 for courier completion without persistence side effects", async () => {
      const orderUpdate = jest.fn();
      const statusHistoryCreate = jest.fn();
      const eventCreate = jest.fn();
      const prisma = createPrismaProvider({
        order: {
          findUnique: jest.fn().mockResolvedValue({
            ...assignedOrder,
            status: "DELIVERED",
            updatedAt: new Date("2026-04-03T10:20:00.000Z"),
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
        user: {
          findUnique: jest.fn().mockResolvedValue({
            telegramId: "10001",
          }),
        },
      });
      const module = createDeliveryTrackingModule(prisma);

      await expect(
        module.controller.recordStatusTransition({
          orderId: "order-1",
          nextStatus: "COMPLETED",
          actor: {
            userId: "courier-1",
            role: "courier",
          },
        }),
      ).rejects.toEqual(
        new AppError("CONFLICT", "Order cannot transition to the requested status", 409, {
          orderId: "order-1",
          currentStatus: "DELIVERED",
          nextStatus: "COMPLETED",
          expectedStatus: null,
        }),
      );
      expectNoPersistenceSideEffects(orderUpdate, statusHistoryCreate, eventCreate);
    });

    it("allows operator/admin DELIVERED to COMPLETED closure with actor metadata", async () => {
      const deliveredOrder = {
        ...assignedOrder,
        status: "DELIVERED",
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      };
      const orderFindUnique = jest.fn().mockResolvedValue(deliveredOrder);
      const orderUpdate = jest.fn().mockResolvedValue({
        ...deliveredOrder,
        status: "COMPLETED",
        updatedAt: new Date("2026-05-09T12:05:00.000Z"),
      });
      const statusHistoryCreate = jest.fn().mockImplementation(async (args) => ({
        id: 205n,
        ...args.data,
      }));
      const eventCreate = jest.fn().mockImplementation(async (args) => ({
        id: 206n,
        ...args.data,
        createdAt: new Date("2026-05-09T12:05:00.000Z"),
      }));
      const module = createDeliveryTrackingModule(
        createPrismaProvider({
          order: {
            findUnique: orderFindUnique,
            update: orderUpdate,
          },
          orderStatusHistory: {
            create: statusHistoryCreate,
          },
          event: {
            create: eventCreate,
            findMany: jest.fn().mockResolvedValue([]),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        }),
      );

      await expect(
        module.controller.recordOperatorStatusTransition({
          orderId: "order-1",
          nextStatus: "COMPLETED",
          actor: {
            userId: "admin-account-1",
            role: "admin",
            name: "Admin One",
          },
        }),
      ).resolves.toEqual({
        orderId: "order-1",
        status: "COMPLETED",
        updatedAt: new Date("2026-05-09T12:05:00.000Z"),
        revision: "206",
      });

      expect(orderUpdate).toHaveBeenCalledWith({
        where: {
          id: "order-1",
        },
        data: {
          status: "COMPLETED",
        },
        select: orderSelect,
      });
      expect(statusHistoryCreate).toHaveBeenCalledWith({
        data: {
          orderId: "order-1",
          oldStatus: "DELIVERED",
          newStatus: "COMPLETED",
          changedByUserId: "admin-account-1",
          changedByRole: "admin",
          changedByName: "Admin One",
          changedAt: expect.any(Date),
        },
      });
      expect(eventCreate).toHaveBeenCalledWith({
        data: {
          type: "order.status_changed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            previousStatus: "DELIVERED",
            status: "COMPLETED",
            changedByUserId: "admin-account-1",
            changedByRole: "admin",
            changedByName: "Admin One",
            updatedAt: "2026-05-09T12:05:00.000Z",
          },
        },
      });
    });

    it("keeps legacy status history rows readable when actor metadata is null", async () => {
      const legacyHistory = {
        id: 207n,
        orderId: "order-1",
        oldStatus: "ASSIGNED" as const,
        newStatus: "PICKED_UP" as const,
        changedByUserId: "courier-1",
        changedByRole: null,
        changedByName: null,
        changedAt: new Date("2026-05-09T12:05:00.000Z"),
      };

      expect({
        ...legacyHistory,
        changedByRole: legacyHistory.changedByRole ?? undefined,
        changedByName: legacyHistory.changedByName ?? undefined,
      }).toEqual({
        id: 207n,
        orderId: "order-1",
        oldStatus: "ASSIGNED",
        newStatus: "PICKED_UP",
        changedByUserId: "courier-1",
        changedByRole: undefined,
        changedByName: undefined,
        changedAt: new Date("2026-05-09T12:05:00.000Z"),
      });
    });

    it("rejects courier actors that do not own the order without persistence side effects", async () => {
      const orderUpdate = jest.fn();
      const statusHistoryCreate = jest.fn();
      const eventCreate = jest.fn();
      const prisma = createPrismaProvider({
        order: {
          findUnique: jest.fn().mockResolvedValue({
            ...assignedOrder,
            courierId: "courier-2",
            updatedAt: new Date("2026-04-03T10:00:00.000Z"),
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
        user: {
          findUnique: jest.fn().mockResolvedValue({
            telegramId: "10001",
          }),
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

      expectNoPersistenceSideEffects(orderUpdate, statusHistoryCreate, eventCreate);
    });
  });

  describe("event polling", () => {
    it("returns ordered events with a stable string cursor baseline", async () => {
      const orderUpdate = jest.fn();
      const statusHistoryCreate = jest.fn();
      const eventCreate = jest.fn();
      const eventFindMany = jest
        .fn()
        .mockResolvedValueOnce([
          persistedStatusEvent(104n, "ASSIGNED", "IN_PROGRESS", "2026-04-03T10:00:05.000Z"),
          persistedStatusEvent(105n, "IN_PROGRESS", "DELIVERED", "2026-04-03T10:10:05.000Z"),
        ])
        .mockResolvedValueOnce([]);
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
        user: {
          findUnique: jest.fn().mockResolvedValue({
            telegramId: "10001",
          }),
        },
      });
      const module = createDeliveryTrackingModule(prisma);

      await expect(module.controller.getEventsSince("103")).resolves.toEqual({
        events: [
          expectedStatusEvent("104", "ASSIGNED", "IN_PROGRESS", "2026-04-03T10:00:05.000Z"),
          expectedStatusEvent("105", "IN_PROGRESS", "DELIVERED", "2026-04-03T10:10:05.000Z"),
        ],
        nextCursor: "105",
      });
      expect(eventFindMany).toHaveBeenCalledWith(eventFindManyArgs(103n));

      await expect(module.controller.getEventsSince("105")).resolves.toEqual({
        events: [],
        nextCursor: "105",
      });
      expect(eventFindMany).toHaveBeenNthCalledWith(2, eventFindManyArgs(105n));

      expectNoPersistenceSideEffects(orderUpdate, statusHistoryCreate, eventCreate);
    });

    it("returns stable results for duplicate polling requests with the same cursor", async () => {
      const orderUpdate = jest.fn();
      const statusHistoryCreate = jest.fn();
      const eventCreate = jest.fn();
      const duplicatedResult = [
        persistedStatusEvent(104n, "ASSIGNED", "IN_PROGRESS", "2026-04-03T10:00:05.000Z"),
        persistedStatusEvent(105n, "IN_PROGRESS", "DELIVERED", "2026-04-03T10:10:05.000Z"),
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
        user: {
          findUnique: jest.fn().mockResolvedValue({
            telegramId: "10001",
          }),
        },
      });
      const module = createDeliveryTrackingModule(prisma);

      const firstResult = await module.controller.getEventsSince("103");
      const secondResult = await module.controller.getEventsSince("103");

      expect(firstResult).toEqual({
        events: [
          expectedStatusEvent("104", "ASSIGNED", "IN_PROGRESS", "2026-04-03T10:00:05.000Z"),
          expectedStatusEvent("105", "IN_PROGRESS", "DELIVERED", "2026-04-03T10:10:05.000Z"),
        ],
        nextCursor: "105",
      });
      expect(secondResult).toEqual(firstResult);
      expect(eventFindMany).toHaveBeenNthCalledWith(1, eventFindManyArgs(103n));
      expect(eventFindMany).toHaveBeenNthCalledWith(2, eventFindManyArgs(103n));
      expectNoPersistenceSideEffects(orderUpdate, statusHistoryCreate, eventCreate);
    });

    it("does not emit malformed status events when the payload has no status", async () => {
      const orderUpdate = jest.fn();
      const statusHistoryCreate = jest.fn();
      const eventCreate = jest.fn();
      const eventFindMany = jest.fn().mockResolvedValue([
        {
          id: 106n,
          type: "order.delayed",
          entity: "order",
          entityId: "order-1",
          payload: {
            orderId: "order-1",
            oldStatus: "CREATED",
            updatedAt: "2026-05-09T12:06:10.000Z",
          },
          createdAt: new Date("2026-05-09T12:06:10.000Z"),
        },
      ]);
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
        user: {
          findUnique: jest.fn().mockResolvedValue({
            telegramId: "10001",
          }),
        },
      });
      const module = createDeliveryTrackingModule(prisma);

      await expect(module.controller.getEventsSince("105")).resolves.toEqual({
        events: [],
        nextCursor: "105",
      });
      expect(eventFindMany).toHaveBeenCalledWith(eventFindManyArgs(105n));
      expectNoPersistenceSideEffects(orderUpdate, statusHistoryCreate, eventCreate);
    });
  });
});
