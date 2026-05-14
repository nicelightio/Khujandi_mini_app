import { createDeliveryAssignmentModule } from "../../../backend/src/slices/delivery-assignment/presentation/delivery-assignment.module";
import {
  PrismaDeliveryAssignmentRepository,
  type DeliveryAssignmentPrismaProvider,
} from "../../../backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository";
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
  it("wires successful assignment override through the owning slice boundary", async () => {
    const orderFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      })
      .mockResolvedValue({
        id: "order-1",
        courierId: "courier-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:05.000Z"),
        isDeleted: false,
      });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "COURIER",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const orderUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
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
      action: "override_assigned",
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
        update: jest.fn(),
        updateMany: orderUpdateMany,
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
      module.controller.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
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
        acceptingOrdersUntil: true,
        autoOfferEnabled: true,
        ratingScore: true,
        name: true,
        staffDeactivatedAt: true,
      },
    });
    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        courierId: null,
        isDeleted: false,
        status: "CREATED",
      },
      data: {
        courierId: "courier-1",
        status: "ASSIGNED",
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
        action: "override_assigned",
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

    expect(orderUpdateMany.mock.invocationCallOrder[0]).toBeLessThan(statusHistoryCreate.mock.invocationCallOrder[0]);
    expect(statusHistoryCreate.mock.invocationCallOrder[0]).toBeLessThan(eventCreate.mock.invocationCallOrder[0]);
    expect(eventCreate.mock.invocationCallOrder[0]).toBeLessThan(notifyCourierAssigned.mock.invocationCallOrder[0]);
  });

  it("represents pending assignment offers without requiring them for direct assignment", async () => {
    const assignmentOfferFindMany = jest.fn().mockResolvedValue([
      {
        id: "offer-1",
        orderId: "order-1",
        targetCourierId: "courier-1",
        kind: "MANUAL",
        status: "PENDING",
        createdAt: new Date("2026-05-09T10:00:00.000Z"),
        updatedAt: new Date("2026-05-09T10:00:00.000Z"),
      },
      {
        id: "offer-2",
        orderId: "order-1",
        targetCourierId: null,
        kind: "BROADCAST",
        status: "PENDING",
        createdAt: new Date("2026-05-09T10:01:00.000Z"),
        updatedAt: new Date("2026-05-09T10:01:00.000Z"),
      },
    ]);
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      assignmentOffer: {
        findMany: assignmentOfferFindMany,
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
    const repository = new PrismaDeliveryAssignmentRepository(prisma);

    await expect(repository.findOffersForOrder("order-1")).resolves.toEqual([
      {
        id: "offer-1",
        orderId: "order-1",
        targetCourierId: "courier-1",
        kind: "manual",
        status: "pending",
        createdAt: new Date("2026-05-09T10:00:00.000Z"),
        updatedAt: new Date("2026-05-09T10:00:00.000Z"),
      },
      {
        id: "offer-2",
        orderId: "order-1",
        targetCourierId: null,
        kind: "broadcast",
        status: "pending",
        createdAt: new Date("2026-05-09T10:01:00.000Z"),
        updatedAt: new Date("2026-05-09T10:01:00.000Z"),
      },
    ]);
    expect(assignmentOfferFindMany).toHaveBeenCalledWith({
      where: {
        orderId: "order-1",
      },
      select: {
        id: true,
        orderId: true,
        targetCourierId: true,
        kind: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("persists manual targeted offer and event without changing order assignment", async () => {
    const orderFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
        isDeleted: false,
      })
      .mockResolvedValueOnce({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
        isDeleted: false,
      });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "COURIER",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const orderFindFirst = jest.fn().mockResolvedValue(null);
    const assignmentOfferCreate = jest.fn().mockResolvedValue({
      id: "offer-1",
      orderId: "order-1",
      targetCourierId: "courier-1",
      kind: "MANUAL",
      status: "PENDING",
      createdAt: new Date("2026-05-09T12:00:00.000Z"),
      updatedAt: new Date("2026-05-09T12:00:00.000Z"),
    });
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn().mockResolvedValue({
      id: 104n,
      type: "order.offer_created",
      entity: "order",
      entityId: "order-1",
      payload: {
        orderId: "order-1",
        offerId: "offer-1",
        targetCourierId: "courier-1",
        createdByUserId: "operator-1",
        kind: "manual",
        status: "pending",
        orderStatus: "CREATED",
        updatedAt: "2026-05-09T12:00:00.000Z",
      },
      createdAt: new Date("2026-05-09T12:00:00.000Z"),
    });
    const notifyCourierOfferCreated = jest.fn().mockResolvedValue(undefined);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        findFirst: orderFindFirst,
        update: orderUpdate,
      },
      user: {
        findUnique: userFindUnique,
      },
      assignmentOffer: {
        findMany: jest.fn(),
        create: assignmentOfferCreate,
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
      notifyCourierAssigned: jest.fn(),
      notifyCourierOfferCreated,
    });

    await expect(
      module.controller.createManualOffer({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "operator-1",
          role: "operator",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      offerId: "offer-1",
      targetCourierId: "courier-1",
      kind: "manual",
      status: "pending",
      orderStatus: "CREATED",
      updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      revision: "104",
    });

    expect(orderFindFirst).toHaveBeenCalledWith({
      where: {
        courierId: "courier-1",
        isDeleted: false,
        status: {
          in: ["ASSIGNED", "PICKED_UP", "IN_PROGRESS", "DELIVERED"],
        },
      },
      select: {
        id: true,
      },
    });
    expect(assignmentOfferCreate).toHaveBeenCalledWith({
      data: {
        orderId: "order-1",
        targetCourierId: "courier-1",
        kind: "MANUAL",
        status: "PENDING",
        createdAt: expect.any(Date),
      },
      select: {
        id: true,
        orderId: true,
        targetCourierId: true,
        kind: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(eventCreate).toHaveBeenCalledWith({
      data: {
        type: "order.offer_created",
        entity: "order",
        entityId: "order-1",
        payload: {
          orderId: "order-1",
          offerId: "offer-1",
          targetCourierId: "courier-1",
          createdByUserId: "operator-1",
          kind: "manual",
          status: "pending",
          orderStatus: "CREATED",
          updatedAt: "2026-05-09T12:00:00.000Z",
        },
      },
    });
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(notifyCourierOfferCreated).toHaveBeenCalledWith(expect.objectContaining({
      orderId: "order-1",
      offerId: "offer-1",
      targetCourierId: "courier-1",
      kind: "manual",
      orderStatus: "CREATED",
      revision: "104",
    }));
  });

  it("persists broadcast offers and events before notifying eligible couriers", async () => {
    const orderFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
        isDeleted: false,
      })
      .mockResolvedValue({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
        isDeleted: false,
      });
    const userFindMany = jest.fn().mockResolvedValue([
      {
        id: "courier-1",
        telegramId: "10001",
        role: "COURIER",
        isActive: true,
        acceptingOrdersUntil: null,
        autoOfferEnabled: true,
        ratingScore: 0,
        name: "Courier One",
      },
      {
        id: "courier-2",
        telegramId: "10002",
        role: "COURIER",
        isActive: true,
        acceptingOrdersUntil: null,
        autoOfferEnabled: true,
        ratingScore: 0,
        name: "Courier Two",
      },
    ]);
    const orderFindFirst = jest.fn().mockResolvedValue(null);
    const assignmentOfferCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: "offer-broadcast-1",
        orderId: "order-1",
        targetCourierId: "courier-1",
        kind: "BROADCAST",
        status: "PENDING",
        createdAt: new Date("2026-05-09T12:00:00.000Z"),
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: "offer-broadcast-2",
        orderId: "order-1",
        targetCourierId: "courier-2",
        kind: "BROADCAST",
        status: "PENDING",
        createdAt: new Date("2026-05-09T12:00:00.000Z"),
        updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      });
    const eventCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 201n,
        type: "order.offer_created",
        entity: "order",
        entityId: "order-1",
        payload: {},
        createdAt: new Date("2026-05-09T12:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: 202n,
        type: "order.offer_created",
        entity: "order",
        entityId: "order-1",
        payload: {},
        createdAt: new Date("2026-05-09T12:00:00.000Z"),
      });
    const orderUpdate = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const notifyCourierOfferCreated = jest.fn().mockResolvedValue(undefined);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        findFirst: orderFindFirst,
        update: orderUpdate,
      },
      user: {
        findUnique: jest.fn(),
        findMany: userFindMany,
      },
      assignmentOffer: {
        findMany: jest.fn(),
        create: assignmentOfferCreate,
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
      notifyCourierAssigned: jest.fn(),
      notifyCourierOfferCreated,
    });

    await expect(
      module.controller.createBroadcastOffers({
        orderId: "order-1",
        actor: {
          userId: "operator-1",
          role: "operator",
        },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      kind: "broadcast",
      status: "pending",
      orderStatus: "CREATED",
      eligibleCourierCount: 2,
      offers: [
        expect.objectContaining({
          offerId: "offer-broadcast-1",
          targetCourierId: "courier-1",
          kind: "broadcast",
          revision: "201",
        }),
        expect.objectContaining({
          offerId: "offer-broadcast-2",
          targetCourierId: "courier-2",
          kind: "broadcast",
          revision: "202",
        }),
      ],
      updatedAt: new Date("2026-05-09T12:00:00.000Z"),
      revision: "202",
    });

    expect(userFindMany).toHaveBeenCalledWith({
      where: {
        role: "COURIER",
        isActive: true,
        autoOfferEnabled: true,
        OR: [
          {
            acceptingOrdersUntil: null,
          },
          {
            acceptingOrdersUntil: {
              gt: expect.any(Date),
            },
          },
        ],
      },
      select: expect.objectContaining({
        autoOfferEnabled: true,
        acceptingOrdersUntil: true,
      }),
    });
    expect(assignmentOfferCreate).toHaveBeenCalledTimes(2);
    expect(eventCreate).toHaveBeenCalledTimes(2);
    expect(orderUpdate).not.toHaveBeenCalled();
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate.mock.invocationCallOrder[1]).toBeLessThan(
      notifyCourierOfferCreated.mock.invocationCallOrder[0],
    );
    expect(notifyCourierOfferCreated).toHaveBeenCalledTimes(2);
    expect(notifyCourierOfferCreated).toHaveBeenCalledWith(expect.objectContaining({
      offerId: "offer-broadcast-1",
      targetCourierId: "courier-1",
      kind: "broadcast",
      revision: "201",
    }));
  });

  it("persists courier availability writes without touching rating score", async () => {
    const userUpdate = jest
      .fn()
      .mockResolvedValueOnce({
        id: "courier-1",
        telegramId: "10001",
        role: "COURIER",
        isActive: true,
        acceptingOrdersUntil: null,
        autoOfferEnabled: false,
        ratingScore: 11,
        name: "Courier One",
      })
      .mockResolvedValueOnce({
        id: "courier-1",
        telegramId: "10001",
        role: "COURIER",
        isActive: true,
        acceptingOrdersUntil: new Date("2026-05-09T12:05:00.000Z"),
        autoOfferEnabled: false,
        ratingScore: 11,
        name: "Courier One",
      })
      .mockResolvedValueOnce({
        id: "courier-1",
        telegramId: "10001",
        role: "COURIER",
        isActive: true,
        acceptingOrdersUntil: new Date("2026-05-09T12:05:00.000Z"),
        autoOfferEnabled: true,
        ratingScore: 11,
        name: "Courier One",
      });
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: userUpdate,
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
    const repository = new PrismaDeliveryAssignmentRepository(prisma);

    await expect(repository.startCourierWork("courier-1")).resolves.toEqual({
      id: "courier-1",
      telegramId: "10001",
      role: "courier",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 11,
      name: "Courier One",
    });
    await expect(
      repository.stopCourierWorkAfter(
        "courier-1",
        new Date("2026-05-09T12:05:00.000Z"),
      ),
    ).resolves.toMatchObject({
      id: "courier-1",
      role: "courier",
      acceptingOrdersUntil: new Date("2026-05-09T12:05:00.000Z"),
      ratingScore: 11,
    });
    await expect(
      repository.setCourierAutoOfferParticipation("courier-1", true),
    ).resolves.toMatchObject({
      id: "courier-1",
      role: "courier",
      autoOfferEnabled: true,
      ratingScore: 11,
    });

    expect(userUpdate).toHaveBeenNthCalledWith(1, {
      where: {
        id: "courier-1",
      },
      data: {
        isActive: true,
        acceptingOrdersUntil: null,
      },
      select: expect.objectContaining({
        ratingScore: true,
        autoOfferEnabled: true,
        acceptingOrdersUntil: true,
      }),
    });
    expect(userUpdate).toHaveBeenNthCalledWith(2, {
      where: {
        id: "courier-1",
      },
      data: {
        isActive: true,
        acceptingOrdersUntil: new Date("2026-05-09T12:05:00.000Z"),
      },
      select: expect.objectContaining({
        ratingScore: true,
      }),
    });
    expect(userUpdate).toHaveBeenNthCalledWith(3, {
      where: {
        id: "courier-1",
      },
      data: {
        autoOfferEnabled: true,
      },
      select: expect.objectContaining({
        ratingScore: true,
      }),
    });
  });

  it("calculates busy courier orders from the exact active delivery statuses only", async () => {
    const orderFindFirst = jest
      .fn()
      .mockResolvedValueOnce({ id: "assigned-order" })
      .mockResolvedValueOnce(null);
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: orderFindFirst,
      },
      user: {
        findUnique: jest.fn(),
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
    const repository = new PrismaDeliveryAssignmentRepository(prisma);

    await expect(repository.hasBusyCourierOrder("courier-1")).resolves.toBe(true);
    await expect(repository.hasBusyCourierOrder("courier-1")).resolves.toBe(false);

    expect(orderFindFirst).toHaveBeenCalledWith({
      where: {
        courierId: "courier-1",
        isDeleted: false,
        status: {
          in: ["ASSIGNED", "PICKED_UP", "IN_PROGRESS", "DELIVERED"],
        },
      },
      select: {
        id: true,
      },
    });
    const statusFilter = orderFindFirst.mock.calls[0][0].where.status.in;
    expect(statusFilter).not.toContain("CREATED");
    expect(statusFilter).not.toContain("DELAYED");
    expect(statusFilter).not.toContain("COMPLETED");
    expect(statusFilter).not.toContain("CANCELLED_BY_ADMIN");
    expect(statusFilter).not.toContain("CANCELLED_BY_COURIER_UNAVAILABLE");
  });

  it("keeps assignment success when targeted notification delivery is retried separately", async () => {
    const orderFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      })
      .mockResolvedValue({
        id: "order-1",
        courierId: "courier-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:05.000Z"),
        isDeleted: false,
      });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "COURIER",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const orderUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
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
      action: "override_assigned",
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
        update: jest.fn(),
        updateMany: orderUpdateMany,
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
      module.controller.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
      }),
    ).resolves.toEqual({
      orderId: "order-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-04-03T10:00:05.000Z"),
      revision: "103",
    });

    expect(orderUpdateMany).toHaveBeenCalledTimes(1);
    expect(statusHistoryCreate).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledTimes(1);
    expect(eventCreate).toHaveBeenCalledTimes(1);
    expect(notifyCourierAssigned).toHaveBeenCalledTimes(1);
  });

  it("rejects stale assignment override without audit, event or history side effects", async () => {
    const orderFindUnique = jest
      .fn()
      .mockResolvedValueOnce({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: new Date("2026-04-03T10:00:00.000Z"),
        isDeleted: false,
      })
      .mockResolvedValue({
        id: "order-1",
        courierId: "courier-2",
        status: "ASSIGNED",
        updatedAt: new Date("2026-04-03T10:00:02.000Z"),
        isDeleted: false,
      });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "10001",
      role: "COURIER",
      isActive: true,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      name: "Courier One",
    });
    const orderUpdateMany = jest.fn().mockResolvedValue({ count: 0 });
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const notifyCourierAssigned = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
        update: jest.fn(),
        updateMany: orderUpdateMany,
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
      module.controller.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId: "order-1",
        currentStatus: "ASSIGNED",
        expectedStatus: "CREATED",
      }),
    );

    expect(orderUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "order-1",
        courierId: null,
        isDeleted: false,
        status: "CREATED",
      },
      data: {
        courierId: "courier-1",
        status: "ASSIGNED",
      },
    });
    expect(statusHistoryCreate).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
    expect(notifyCourierAssigned).not.toHaveBeenCalled();
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
      .assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
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

  it("rejects already assigned override before persistence side effects", async () => {
    const orderUpdateMany = jest.fn();
    const statusHistoryCreate = jest.fn();
    const auditCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: "order-1",
          courierId: "courier-existing",
          status: "CREATED",
          updatedAt: new Date("2026-04-03T10:00:00.000Z"),
          isDeleted: false,
        }),
        update: jest.fn(),
        updateMany: orderUpdateMany,
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

    await expect(
      module.controller.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Order cannot be assigned from the current state", 409, {
        orderId: "order-1",
        currentStatus: "CREATED",
        expectedStatus: "CREATED",
      }),
    );

    expect(orderUpdateMany).not.toHaveBeenCalled();
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
      module.controller.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "seller-1",
          role: "seller",
        },
      }),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "User role cannot directly assign couriers", 403, {
        role: "seller",
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
          acceptingOrdersUntil: null,
          autoOfferEnabled: false,
          ratingScore: 0,
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
      module.controller.assignCourierOverride({
        orderId: "order-1",
        courierId: "courier-1",
        actor: {
          userId: "admin-1",
          role: "admin",
        },
        override: { confirmed: true },
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
