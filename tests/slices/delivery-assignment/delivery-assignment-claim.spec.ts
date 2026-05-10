import {
  buildCourierClaimCallbackData,
  executeCourierClaimIntent,
  parseCourierClaimCallbackData,
  TelegramBotDeliveryAssignmentClaimHarness,
} from "../../../backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment-claim.harness";
import { createDeliveryAssignmentModule } from "../../../backend/src/slices/delivery-assignment/presentation/delivery-assignment.module";
import type { DeliveryAssignmentPrismaProvider } from "../../../backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository";
import { AppError } from "../../../backend/src/shared/errors/app-error";

type ClaimTestOrder = {
  id: string;
  courierId: string | null;
  status: string;
  updatedAt: Date;
  isDeleted: boolean;
};

type ClaimTestCourier = {
  id: string;
  telegramId: string;
  role: string;
  isActive: boolean;
  acceptingOrdersUntil: Date | null;
  autoOfferEnabled: boolean;
  ratingScore: number;
  name: string;
};

type ClaimTestOffer = {
  id: string;
  orderId: string;
  targetCourierId: string | null;
  kind: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

const createClaimPrismaProvider = (input: {
  orders: ClaimTestOrder[];
  couriers: ClaimTestCourier[];
  offers: ClaimTestOffer[];
}) => {
  const statusHistory: unknown[] = [];
  const audits: unknown[] = [];
  const events: Array<{
    id: bigint;
    type: string;
    entity: string;
    entityId: string;
    payload: Record<string, unknown>;
    createdAt: Date;
  }> = [];
  let nextHistoryId = 1n;
  let nextAuditId = 1n;
  let nextEventId = 1n;

  const cloneOrder = (order: ClaimTestOrder) => ({
    ...order,
    updatedAt: new Date(order.updatedAt),
  });

  const cloneOffer = (offer: ClaimTestOffer) => ({
    ...offer,
    createdAt: new Date(offer.createdAt),
    updatedAt: new Date(offer.updatedAt),
  });

  const client: any = {
    order: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const order = input.orders.find((candidate) => candidate.id === where.id);
        return order === undefined ? null : cloneOrder(order);
      }),
      findFirst: jest.fn(async ({ where }: { where: { courierId: string; isDeleted: false; status: { in: string[] } } }) => {
        const order = input.orders.find(
          (candidate) =>
            candidate.courierId === where.courierId &&
            candidate.isDeleted === where.isDeleted &&
            where.status.in.includes(candidate.status),
        );
        return order === undefined ? null : { id: order.id };
      }),
      update: jest.fn(),
      updateMany: jest.fn(async ({ where, data }: { where: { id: string; courierId: null; isDeleted: false; status: { in: string[] } }; data: { courierId: string; status: "ASSIGNED" } }) => {
        const order = input.orders.find((candidate) => candidate.id === where.id);

        if (
          order === undefined ||
          order.courierId !== where.courierId ||
          order.isDeleted !== where.isDeleted ||
          !where.status.in.includes(order.status)
        ) {
          return { count: 0 };
        }

        order.courierId = data.courierId;
        order.status = data.status;
        order.updatedAt = new Date("2026-05-09T12:00:05.000Z");
        return { count: 1 };
      }),
    },
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const courier = input.couriers.find((candidate) => candidate.id === where.id);
        return courier === undefined ? null : { ...courier };
      }),
    },
    assignmentOffer: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const offer = input.offers.find((candidate) => candidate.id === where.id);
        return offer === undefined ? null : cloneOffer(offer);
      }),
      findMany: jest.fn(async ({ where }: { where: { orderId?: string; id?: string } }) =>
        input.offers
          .filter((offer) => {
            if (where.id !== undefined && offer.id !== where.id) {
              return false;
            }

            if (where.orderId !== undefined && offer.orderId !== where.orderId) {
              return false;
            }

            return true;
          })
          .map(cloneOffer),
      ),
      create: jest.fn(),
      updateMany: jest.fn(async ({ where, data }: { where: { id?: string | { not: string }; orderId?: string; status?: string }; data: { status: string } }) => {
        let count = 0;

        for (const offer of input.offers) {
          if (where.orderId !== undefined && offer.orderId !== where.orderId) {
            continue;
          }

          if (where.status !== undefined && offer.status !== where.status) {
            continue;
          }

          if (typeof where.id === "string" && offer.id !== where.id) {
            continue;
          }

          if (typeof where.id === "object" && offer.id === where.id.not) {
            continue;
          }

          offer.status = data.status;
          offer.updatedAt = new Date("2026-05-09T12:00:05.000Z");
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
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const record = { id: nextAuditId++, ...data };
        audits.push(record);
        return record;
      }),
    },
    event: {
      create: jest.fn(async ({ data }: { data: { type: string; entity: string; entityId: string; payload: Record<string, unknown> } }) => {
        const record = {
          id: nextEventId++,
          ...data,
          createdAt: new Date("2026-05-09T12:00:05.000Z"),
        };
        events.push(record);
        return record;
      }),
    },
  };
  client.$transaction = async (callback: (transactionClient: typeof client) => Promise<unknown>) => callback(client);

  return {
    provider: { client } as DeliveryAssignmentPrismaProvider,
    client,
    events,
    statusHistory,
    audits,
  };
};

const baseOrder = (overrides: Partial<ClaimTestOrder> = {}): ClaimTestOrder => ({
  id: "order-claim-1",
  courierId: null,
  status: "CREATED",
  updatedAt: new Date("2026-05-09T12:00:00.000Z"),
  isDeleted: false,
  ...overrides,
});

const baseCourier = (overrides: Partial<ClaimTestCourier> = {}): ClaimTestCourier => ({
  id: "courier-1",
  telegramId: "10001",
  role: "COURIER",
  isActive: true,
  acceptingOrdersUntil: null,
  autoOfferEnabled: false,
  ratingScore: 0,
  name: "Courier One",
  ...overrides,
});

const baseOffer = (overrides: Partial<ClaimTestOffer> = {}): ClaimTestOffer => ({
  id: "offer-claim-1",
  orderId: "order-claim-1",
  targetCourierId: "courier-1",
  kind: "MANUAL",
  status: "PENDING",
  createdAt: new Date("2026-05-09T12:00:00.000Z"),
  updatedAt: new Date("2026-05-09T12:00:00.000Z"),
  ...overrides,
});

describe("delivery-assignment courier claim", () => {
  it("claims a pending offer atomically and publishes order.assigned only after success", async () => {
    const prisma = createClaimPrismaProvider({
      orders: [baseOrder()],
      couriers: [baseCourier()],
      offers: [
        baseOffer(),
        baseOffer({
          id: "offer-sibling",
          targetCourierId: "courier-2",
        }),
      ],
    });
    const notifyCourierAssigned = jest.fn().mockResolvedValue(undefined);
    const module = createDeliveryAssignmentModule(prisma.provider, {
      notifyCourierAssigned,
    });

    expect(prisma.provider.client.order.findUnique).not.toHaveBeenCalled();
    expect(prisma.events).toHaveLength(0);

    await expect(
      module.controller.claimOffer({
        offerId: "offer-claim-1",
        courierId: "courier-1",
      }),
    ).resolves.toEqual({
      orderId: "order-claim-1",
      courierId: "courier-1",
      status: "ASSIGNED",
      updatedAt: new Date("2026-05-09T12:00:05.000Z"),
      revision: "1",
    });

    expect(prisma.provider.client.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: "order-claim-1",
        courierId: null,
        isDeleted: false,
        status: {
          in: ["CREATED", "DELAYED"],
        },
      },
      data: {
        courierId: "courier-1",
        status: "ASSIGNED",
      },
    });
    expect(prisma.events).toHaveLength(1);
    expect(prisma.events[0]).toMatchObject({
      type: "order.assigned",
      entity: "order",
      entityId: "order-claim-1",
      payload: {
        orderId: "order-claim-1",
        courierId: "courier-1",
        assignedByUserId: "courier-1",
        status: "ASSIGNED",
      },
    });
    expect(prisma.statusHistory).toHaveLength(1);
    expect(prisma.audits).toHaveLength(1);
    expect(prisma.client.assignmentOffer.updateMany).toHaveBeenCalledWith({
      where: {
        id: "offer-claim-1",
        status: "PENDING",
      },
      data: {
        status: "CLAIMED",
      },
    });
    expect(prisma.client.assignmentOffer.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: "order-claim-1",
        status: "PENDING",
        id: {
          not: "offer-claim-1",
        },
      },
      data: {
        status: "CANCELLED",
      },
    });
    expect(notifyCourierAssigned).toHaveBeenCalledWith(expect.objectContaining({
      assignedByUserId: "courier-1",
      courierId: "courier-1",
      orderId: "order-claim-1",
      revision: "1",
    }));
  });

  it("allows only the first duplicate/concurrent claim to win", async () => {
    const prisma = createClaimPrismaProvider({
      orders: [baseOrder()],
      couriers: [baseCourier()],
      offers: [baseOffer()],
    });
    const module = createDeliveryAssignmentModule(prisma.provider);

    const results = await Promise.allSettled([
      module.controller.claimOffer({
        offerId: "offer-claim-1",
        courierId: "courier-1",
      }),
      module.controller.claimOffer({
        offerId: "offer-claim-1",
        courierId: "courier-1",
      }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(prisma.events).toHaveLength(1);
    expect(prisma.statusHistory).toHaveLength(1);
    expect(prisma.audits).toHaveLength(1);
  });

  it("rejects wrong claimant without claim side effects", async () => {
    const prisma = createClaimPrismaProvider({
      orders: [baseOrder()],
      couriers: [baseCourier({ id: "courier-2" })],
      offers: [baseOffer()],
    });
    const module = createDeliveryAssignmentModule(prisma.provider);

    await expect(
      module.controller.claimOffer({
        offerId: "offer-claim-1",
        courierId: "courier-2",
      }),
    ).rejects.toEqual(
      new AppError("OFFER_NOT_CLAIMABLE", "Assignment offer does not belong to this courier", 403, {
        offerId: "offer-claim-1",
        courierId: "courier-2",
      }),
    );

    expect(prisma.client.order.updateMany).not.toHaveBeenCalled();
    expect(prisma.events).toHaveLength(0);
  });

  it("rejects invalid order status and keeps ASSIGNED/event absent before claim", async () => {
    const prisma = createClaimPrismaProvider({
      orders: [baseOrder({ status: "IN_PROGRESS", courierId: "courier-1" })],
      couriers: [baseCourier()],
      offers: [baseOffer()],
    });
    const module = createDeliveryAssignmentModule(prisma.provider);

    await expect(
      module.controller.claimOffer({
        offerId: "offer-claim-1",
        courierId: "courier-1",
      }),
    ).rejects.toEqual(
      new AppError("CONFLICT", "Order cannot be claimed from the current state", 409, {
        orderId: "order-claim-1",
        currentStatus: "IN_PROGRESS",
        expectedStatus: ["CREATED", "DELAYED"],
      }),
    );

    expect(prisma.client.order.updateMany).not.toHaveBeenCalled();
    expect(prisma.events).toHaveLength(0);
  });

  it("rejects inactive and busy couriers before claim persistence", async () => {
    const inactivePrisma = createClaimPrismaProvider({
      orders: [baseOrder()],
      couriers: [baseCourier({ isActive: false })],
      offers: [baseOffer()],
    });
    const inactiveModule = createDeliveryAssignmentModule(inactivePrisma.provider);

    await expect(
      inactiveModule.controller.claimOffer({
        offerId: "offer-claim-1",
        courierId: "courier-1",
      }),
    ).rejects.toEqual(
      new AppError("COURIER_UNAVAILABLE", "Courier is not active and free for claim", 409, {
        courierId: "courier-1",
        active: false,
        free: true,
      }),
    );
    expect(inactivePrisma.client.order.updateMany).not.toHaveBeenCalled();
    expect(inactivePrisma.events).toHaveLength(0);

    const busyPrisma = createClaimPrismaProvider({
      orders: [
        baseOrder(),
        baseOrder({
          id: "order-busy",
          courierId: "courier-1",
          status: "ASSIGNED",
        }),
      ],
      couriers: [baseCourier()],
      offers: [baseOffer()],
    });
    const busyModule = createDeliveryAssignmentModule(busyPrisma.provider);

    await expect(
      busyModule.controller.claimOffer({
        offerId: "offer-claim-1",
        courierId: "courier-1",
      }),
    ).rejects.toEqual(
      new AppError("COURIER_UNAVAILABLE", "Courier is not active and free for claim", 409, {
        courierId: "courier-1",
        active: true,
        free: false,
      }),
    );
    expect(busyPrisma.client.order.updateMany).not.toHaveBeenCalled();
    expect(busyPrisma.events).toHaveLength(0);
  });

  it("parses Telegram claim callbacks and delegates duplicate callbacks to the service boundary", async () => {
    const harness = new TelegramBotDeliveryAssignmentClaimHarness();
    const callbackData = buildCourierClaimCallbackData({
      offerId: "offer-claim-1",
      courierId: "courier-1",
    });
    const claimOffer = jest
      .fn()
      .mockResolvedValueOnce({
        orderId: "order-claim-1",
        courierId: "courier-1",
        status: "ASSIGNED",
        updatedAt: new Date("2026-05-09T12:00:05.000Z"),
        revision: "1",
      })
      .mockRejectedValueOnce(
        new AppError("OFFER_ALREADY_TAKEN", "Assignment offer is already taken or expired", 409, {
          offerId: "offer-claim-1",
          orderId: "order-claim-1",
        }),
      );

    expect(harness.buildClaimPrompt({
      offerId: "offer-claim-1",
      courierId: "courier-1",
    })).toEqual({
      text: "пытаемся получить заказ...",
      buttons: [
        {
          label: "Принять заказ",
          callbackData,
        },
      ],
    });
    expect(parseCourierClaimCallbackData(callbackData)).toEqual({
      offerId: "offer-claim-1",
      courierId: "courier-1",
    });
    expect(harness.parseCourierClaimAction("unknown")).toBeNull();

    const intent = harness.parseCourierClaimAction(callbackData);
    expect(intent).not.toBeNull();
    await expect(executeCourierClaimIntent({ claimOffer }, intent!)).resolves.toMatchObject({
      orderId: "order-claim-1",
      status: "ASSIGNED",
    });
    await expect(executeCourierClaimIntent({ claimOffer }, intent!)).rejects.toEqual(
      new AppError("OFFER_ALREADY_TAKEN", "Assignment offer is already taken or expired", 409, {
        offerId: "offer-claim-1",
        orderId: "order-claim-1",
      }),
    );
    expect(claimOffer).toHaveBeenCalledTimes(2);
  });
});
