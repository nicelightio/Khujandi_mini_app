import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { createDeliveryAssignmentModule } from "../../../backend/src/slices/delivery-assignment/presentation/delivery-assignment.module";
import type { DeliveryAssignmentPrismaProvider } from "../../../backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository";

const adminOrigin = "https://admin.example";

type TimeoutOrder = {
  id: string;
  courierId: string | null;
  status: string;
  updatedAt: Date;
  isDeleted: boolean;
};

type TimeoutUser = {
  id: string;
  telegramId: string;
  role: string;
  isActive: boolean;
  acceptingOrdersUntil: Date | null;
  autoOfferEnabled: boolean;
  ratingScore: number;
  name: string;
};

type TimeoutOffer = {
  id: string;
  orderId: string;
  targetCourierId: string | null;
  kind: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

const cloneDate = (value: Date) => new Date(value);

const createTimeoutPrismaProvider = (input: {
  orders: TimeoutOrder[];
  users: TimeoutUser[];
  offers: TimeoutOffer[];
  now?: Date;
}) => {
  const statusHistory: unknown[] = [];
  const events: Array<{
    id: bigint;
    type: string;
    entity: string;
    entityId: string;
    payload: Record<string, unknown>;
    createdAt: Date;
  }> = [];
  let nextHistoryId = 1n;
  let nextEventId = 1n;
  const now = input.now ?? new Date("2026-05-09T12:06:10.000Z");

  const client: any = {
    order: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const order = input.orders.find((candidate) => candidate.id === where.id);
        return order === undefined ? null : { ...order, updatedAt: cloneDate(order.updatedAt) };
      }),
      findFirst: jest.fn(async () => null),
      update: jest.fn(),
      updateMany: jest.fn(async ({ where, data }: { where: { id: string; courierId?: null; isDeleted: false; status: { in: string[] } }; data: { courierId?: string; status: string } }) => {
        const order = input.orders.find((candidate) => candidate.id === where.id);

        if (
          order === undefined ||
          ("courierId" in where && order.courierId !== where.courierId) ||
          order.isDeleted !== where.isDeleted ||
          !where.status.in.includes(order.status)
        ) {
          return { count: 0 };
        }

        if (data.courierId !== undefined) {
          order.courierId = data.courierId;
        }
        order.status = data.status;
        order.updatedAt = cloneDate(now);
        return { count: 1 };
      }),
    },
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const user = input.users.find((candidate) => candidate.id === where.id);
        return user === undefined ? null : { ...user };
      }),
      findMany: jest.fn(async ({ where }: { where: { role: { in: string[] }; isActive: true } }) =>
        input.users.filter(
          (user) => where.role.in.includes(user.role) && user.isActive === where.isActive,
        ),
      ),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: { ratingScore?: { decrement: number } } }) => {
        const user = input.users.find((candidate) => candidate.id === where.id);

        if (user === undefined) {
          throw new Error(`Unknown user ${where.id}`);
        }

        if (data.ratingScore !== undefined) {
          user.ratingScore -= data.ratingScore.decrement;
        }

        return { ...user };
      }),
    },
    assignmentOffer: {
      findMany: jest.fn(async ({ where }: { where: { orderId?: string; status?: string; createdAt?: { lte: Date } } }) =>
        input.offers
          .filter((offer) => {
            if (where.orderId !== undefined && offer.orderId !== where.orderId) {
              return false;
            }

            if (where.status !== undefined && offer.status !== where.status) {
              return false;
            }

            if (where.createdAt !== undefined && offer.createdAt.getTime() > where.createdAt.lte.getTime()) {
              return false;
            }

            return true;
          })
          .map((offer) => ({ ...offer, createdAt: cloneDate(offer.createdAt), updatedAt: cloneDate(offer.updatedAt) })),
      ),
      create: jest.fn(),
      updateMany: jest.fn(async ({ where, data }: { where: { id?: string; status?: string }; data: { status: string } }) => {
        let count = 0;

        for (const offer of input.offers) {
          if (where.id !== undefined && offer.id !== where.id) {
            continue;
          }

          if (where.status !== undefined && offer.status !== where.status) {
            continue;
          }

          offer.status = data.status;
          offer.updatedAt = cloneDate(now);
          count += 1;
        }

        return { count };
      }),
    },
    orderStatusHistory: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = { id: nextHistoryId++, ...data };
        statusHistory.push(record);
        return record;
      }),
    },
    deliveryAssignmentAudit: {
      create: jest.fn(),
    },
    event: {
      create: jest.fn(async ({ data }: { data: { type: string; entity: string; entityId: string; payload: Record<string, unknown> } }) => {
        const record = {
          id: nextEventId++,
          ...data,
          createdAt: cloneDate(now),
        };
        events.push(record);
        return record;
      }),
      findMany: jest.fn(async ({ where }: { where: { entity: string; entityId?: string; type?: { in: string[] } } }) =>
        events.filter((event) => {
          if (event.entity !== where.entity) {
            return false;
          }

          if (where.entityId !== undefined && event.entityId !== where.entityId) {
            return false;
          }

          if (where.type !== undefined && !where.type.in.includes(event.type)) {
            return false;
          }

          return true;
        }),
      ),
    },
  };
  client.$transaction = async (callback: (transactionClient: typeof client) => Promise<unknown>) => callback(client);

  return {
    provider: { client } as DeliveryAssignmentPrismaProvider,
    client,
    events,
    statusHistory,
  };
};

const baseOrder = (overrides: Partial<TimeoutOrder> = {}): TimeoutOrder => ({
  id: "order-timeout-1",
  courierId: null,
  status: "CREATED",
  updatedAt: new Date("2026-05-09T12:00:00.000Z"),
  isDeleted: false,
  ...overrides,
});

const baseCourier = (overrides: Partial<TimeoutUser> = {}): TimeoutUser => ({
  id: "courier-1",
  telegramId: "10001",
  role: "COURIER",
  isActive: true,
  acceptingOrdersUntil: null,
  autoOfferEnabled: false,
  ratingScore: 5,
  name: "Courier One",
  ...overrides,
});

const operatorUser = (overrides: Partial<TimeoutUser> = {}): TimeoutUser => ({
  id: "operator-1",
  telegramId: "90001",
  role: "OPERATOR",
  isActive: true,
  acceptingOrdersUntil: null,
  autoOfferEnabled: false,
  ratingScore: 0,
  name: "Operator One",
  ...overrides,
});

const baseOffer = (overrides: Partial<TimeoutOffer> = {}): TimeoutOffer => ({
  id: "offer-timeout-1",
  orderId: "order-timeout-1",
  targetCourierId: "courier-1",
  kind: "MANUAL",
  status: "PENDING",
  createdAt: new Date("2026-05-09T12:00:00.000Z"),
  updatedAt: new Date("2026-05-09T12:00:00.000Z"),
  ...overrides,
});

const loginAdmin = async (now: () => Date) => {
  const runtime = await startDevApiServer({
    host: "127.0.0.1",
    port: 0,
    allowedOrigins: [adminOrigin],
    now,
  });
  runtime.prisma.state.account.login = "admin@example.com";
  runtime.prisma.state.account.role = "ADMIN";
  const client = runtime.createClient();

  const response = await client.request({
    path: "/api/v1/admin/auth/login",
    origin: adminOrigin,
    body: {
      login: "admin@example.com",
      password: "super-secret-01",
    },
  });
  expect(response.status).toBe(200);

  return { runtime, client };
};

describe("delivery-assignment offer timeout evaluator", () => {
  it("repeats a still-pending offer once after three minutes", async () => {
    const prisma = createTimeoutPrismaProvider({
      orders: [baseOrder()],
      users: [baseCourier(), operatorUser()],
      offers: [baseOffer()],
      now: new Date("2026-05-09T12:03:10.000Z"),
    });
    const notifyCourierOfferRepeated = jest.fn().mockResolvedValue(undefined);
    const module = createDeliveryAssignmentModule(prisma.provider, {
      notifyCourierAssigned: jest.fn(),
      notifyCourierOfferRepeated,
    });

    await expect(
      module.controller.evaluateOfferTimeouts(new Date("2026-05-09T12:03:10.000Z")),
    ).resolves.toEqual({
      evaluatedAt: new Date("2026-05-09T12:03:10.000Z"),
      repeatedOfferCount: 1,
      expiredOfferCount: 0,
      delayedOrderCount: 0,
      penalizedCourierCount: 0,
      operatorNotificationCount: 0,
      revision: "1",
    });
    await expect(
      module.controller.evaluateOfferTimeouts(new Date("2026-05-09T12:03:20.000Z")),
    ).resolves.toMatchObject({
      repeatedOfferCount: 0,
      expiredOfferCount: 0,
    });

    expect(prisma.events).toHaveLength(1);
    expect(prisma.events[0]).toMatchObject({
      type: "order.offer_repeated",
      entityId: "order-timeout-1",
      payload: expect.objectContaining({
        offerId: "offer-timeout-1",
        status: "pending",
      }),
    });
    expect(prisma.provider.client.assignmentOffer?.updateMany).not.toHaveBeenCalled();
    expect(notifyCourierOfferRepeated).toHaveBeenCalledTimes(1);
    expect(notifyCourierOfferRepeated).toHaveBeenCalledWith(expect.objectContaining({
      orderId: "order-timeout-1",
      offerId: "offer-timeout-1",
      targetCourierId: "courier-1",
      revision: "1",
    }));
  });

  it("expires a personal offer after six minutes, sets DELAYED once, alerts operators once and penalizes once", async () => {
    const courier = baseCourier();
    const prisma = createTimeoutPrismaProvider({
      orders: [baseOrder()],
      users: [courier, operatorUser()],
      offers: [baseOffer()],
      now: new Date("2026-05-09T12:06:10.000Z"),
    });
    const notifyOperatorsAssignmentDelayed = jest.fn().mockResolvedValue(undefined);
    const module = createDeliveryAssignmentModule(prisma.provider, {
      notifyCourierAssigned: jest.fn(),
      notifyOperatorsAssignmentDelayed,
    });

    await expect(
      module.controller.evaluateOfferTimeouts(new Date("2026-05-09T12:06:10.000Z")),
    ).resolves.toEqual({
      evaluatedAt: new Date("2026-05-09T12:06:10.000Z"),
      repeatedOfferCount: 0,
      expiredOfferCount: 1,
      delayedOrderCount: 1,
      penalizedCourierCount: 1,
      operatorNotificationCount: 1,
      revision: "2",
    });
    await expect(
      module.controller.evaluateOfferTimeouts(new Date("2026-05-09T12:06:20.000Z")),
    ).resolves.toMatchObject({
      expiredOfferCount: 0,
      delayedOrderCount: 0,
      penalizedCourierCount: 0,
      operatorNotificationCount: 0,
    });

    expect(prisma.provider.client.assignmentOffer?.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.provider.client.order.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.statusHistory).toEqual([
      expect.objectContaining({
        orderId: "order-timeout-1",
        oldStatus: "CREATED",
        newStatus: "DELAYED",
        changedByUserId: "system",
      }),
    ]);
    expect(prisma.events.map((event) => event.type)).toEqual([
      "order.assignment_timeout",
      "order.delayed",
    ]);
    expect(courier.ratingScore).toBe(4);
    expect(notifyOperatorsAssignmentDelayed).toHaveBeenCalledTimes(1);
    expect(notifyOperatorsAssignmentDelayed).toHaveBeenCalledWith({
      orderId: "order-timeout-1",
      operatorTelegramIds: ["90001"],
      expiredOfferCount: 1,
      updatedAt: new Date("2026-05-09T12:06:10.000Z"),
      revision: "2",
    });
  });

  it("expires broadcast offers without courier penalty or duplicate operator notifications", async () => {
    const courierOne = baseCourier({ id: "courier-1", ratingScore: 5 });
    const courierTwo = baseCourier({ id: "courier-2", telegramId: "10002", ratingScore: 6 });
    const prisma = createTimeoutPrismaProvider({
      orders: [baseOrder()],
      users: [courierOne, courierTwo, operatorUser()],
      offers: [
        baseOffer({ id: "offer-broadcast-1", targetCourierId: "courier-1", kind: "BROADCAST" }),
        baseOffer({ id: "offer-broadcast-2", targetCourierId: "courier-2", kind: "BROADCAST" }),
      ],
      now: new Date("2026-05-09T12:06:10.000Z"),
    });
    const notifyOperatorsAssignmentDelayed = jest.fn().mockResolvedValue(undefined);
    const module = createDeliveryAssignmentModule(prisma.provider, {
      notifyCourierAssigned: jest.fn(),
      notifyOperatorsAssignmentDelayed,
    });

    await expect(
      module.controller.evaluateOfferTimeouts(new Date("2026-05-09T12:06:10.000Z")),
    ).resolves.toMatchObject({
      expiredOfferCount: 2,
      delayedOrderCount: 1,
      penalizedCourierCount: 0,
      operatorNotificationCount: 1,
    });

    expect(courierOne.ratingScore).toBe(5);
    expect(courierTwo.ratingScore).toBe(6);
    expect(notifyOperatorsAssignmentDelayed).toHaveBeenCalledTimes(1);
    expect(notifyOperatorsAssignmentDelayed).toHaveBeenCalledWith(expect.objectContaining({
      expiredOfferCount: 2,
    }));
  });

  it("skips claimed offers and assigned orders without timeout side effects", async () => {
    const prisma = createTimeoutPrismaProvider({
      orders: [
        baseOrder({
          courierId: "courier-1",
          status: "ASSIGNED",
        }),
      ],
      users: [baseCourier(), operatorUser()],
      offers: [
        baseOffer({
          status: "CLAIMED",
        }),
      ],
      now: new Date("2026-05-09T12:06:10.000Z"),
    });
    const notifyOperatorsAssignmentDelayed = jest.fn();
    const notifyCourierOfferRepeated = jest.fn();
    const module = createDeliveryAssignmentModule(prisma.provider, {
      notifyCourierAssigned: jest.fn(),
      notifyCourierOfferRepeated,
      notifyOperatorsAssignmentDelayed,
    });

    await expect(
      module.controller.evaluateOfferTimeouts(new Date("2026-05-09T12:06:10.000Z")),
    ).resolves.toMatchObject({
      repeatedOfferCount: 0,
      expiredOfferCount: 0,
      delayedOrderCount: 0,
      penalizedCourierCount: 0,
      operatorNotificationCount: 0,
    });
    expect(prisma.events).toHaveLength(0);
    expect(prisma.statusHistory).toHaveLength(0);
    expect(notifyCourierOfferRepeated).not.toHaveBeenCalled();
    expect(notifyOperatorsAssignmentDelayed).not.toHaveBeenCalled();
  });

  it("exposes a protected manual timeout tick route in dev runtime", async () => {
    let now = new Date("2026-05-09T12:00:00.000Z");
    const { runtime, client } = await loginAdmin(() => now);

    try {
      await runtime.operationalModules.deliveryAssignmentModule.service.createManualOffer(
        {
          orderId: "order-created-1001",
          courierId: "courier-8",
          actor: {
            userId: "admin-account-1",
            role: "admin",
          },
        },
        new Date("2026-05-09T12:00:00.000Z"),
      );

      now = new Date("2026-05-09T12:06:10.000Z");
      const tickResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/offer-timeouts/tick",
        origin: adminOrigin,
      });

      expect(tickResponse.status).toBe(200);
      expect(tickResponse.body).toMatchObject({
        repeatedOfferCount: 0,
        expiredOfferCount: 1,
        delayedOrderCount: 1,
        penalizedCourierCount: 1,
        revision: expect.any(String),
      });

      const ordersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(ordersResponse.status).toBe(200);
      expect(ordersResponse.body.orders).toContainEqual(
        expect.objectContaining({
          orderId: "order-created-1001",
          status: "DELAYED",
          courier: expect.objectContaining({
            marker: "absent",
          }),
        }),
      );
    } finally {
      await runtime.stop();
    }
  });
});
