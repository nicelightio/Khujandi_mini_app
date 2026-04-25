import { createReviewsFeedbackModule } from "../../../backend/src/slices/reviews-feedback/presentation/reviews-feedback.module";
import { TelegramBotReviewsFeedbackFlow } from "../../../backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow";
import { TelegramBotReviewsFeedbackHarness } from "../../../backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness";
import type { ReviewsFeedbackPrismaProvider } from "../../../backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";

type ReviewsFeedbackPrismaClient = Omit<ReviewsFeedbackPrismaProvider["client"], "$transaction">;

type ReviewsFeedbackPrismaClientInput = Omit<ReviewsFeedbackPrismaClient, "reviewDraft"> & {
  reviewDraft?: ReviewsFeedbackPrismaClient["reviewDraft"];
};

const createPrismaProvider = (
  client: ReviewsFeedbackPrismaClientInput,
): ReviewsFeedbackPrismaProvider => ({
  client: (() => {
    const drafts = new Map<string, Awaited<ReturnType<ReviewsFeedbackPrismaClient["reviewDraft"]["upsert"]>>>();
    const reviewDraft =
      client.reviewDraft ??
      {
        findUnique: jest.fn(async (args) => {
          const key = [
            args.where.orderId_actorUserId_direction.orderId,
            args.where.orderId_actorUserId_direction.actorUserId,
            args.where.orderId_actorUserId_direction.direction,
          ].join(":");

          return drafts.get(key) ?? null;
        }),
        upsert: jest.fn(async (args) => {
          const key = [
            args.where.orderId_actorUserId_direction.orderId,
            args.where.orderId_actorUserId_direction.actorUserId,
            args.where.orderId_actorUserId_direction.direction,
          ].join(":");
          const existing = drafts.get(key);
          const nextDraft = {
            orderId: args.where.orderId_actorUserId_direction.orderId,
            actorUserId: args.where.orderId_actorUserId_direction.actorUserId,
            direction: args.where.orderId_actorUserId_direction.direction,
            ...(existing ?? {}),
            ...(existing === undefined ? args.create : args.update),
            updatedAt: new Date("2026-04-06T10:00:00.000Z"),
          };

          drafts.set(key, nextDraft);

          return nextDraft;
        }),
      };
    const prismaClient = {
      ...client,
      reviewDraft,
    } as ReviewsFeedbackPrismaClient;

    return {
      ...prismaClient,
      $transaction: async (callback) => callback(prismaClient),
    };
  })(),
});

describe("reviews-feedback module integration", () => {
  it("maps completed-order and persisted review reads through the owning slice module", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "70001",
      role: "COURIER",
      isActive: true,
      name: "Courier One",
    });
    const reviewFindMany = jest.fn().mockResolvedValue([
      {
        id: 11n,
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "COURIER",
        rating: 5,
        reasonCode: "ON_TIME",
        comment: null,
        source: "TELEGRAM_BOT",
        createdAt: new Date("2026-04-05T09:01:00.000Z"),
      },
    ]);
    const reviewFindUnique = jest.fn().mockResolvedValue(null);
    const userFindMany = jest.fn().mockResolvedValue([]);
    const reviewCreate = jest.fn();
    const eventCreate = jest.fn();
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
      },
      user: {
        findUnique: userFindUnique,
        findMany: userFindMany,
      },
      review: {
        findMany: reviewFindMany,
        findUnique: reviewFindUnique,
        create: reviewCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const context = createTestContext(prisma.client);
    const module = createReviewsFeedbackModule(prisma);

    expect(context.prisma).toBe(prisma.client);
    await expect(module.controller.getOrderById("order-1")).resolves.toEqual({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    await expect(module.controller.getUserById("courier-1")).resolves.toEqual({
      id: "courier-1",
      telegramId: "70001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    await expect(module.controller.getReviewsByOrderId("order-1")).resolves.toEqual([
      {
        id: 11n,
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: "ON_TIME",
        comment: null,
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:01:00.000Z"),
      },
    ]);

    expect(orderFindUnique).toHaveBeenCalledWith({
      where: {
        id: "order-1",
      },
      select: {
        id: true,
        clientId: true,
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
    expect(reviewFindMany).toHaveBeenCalledWith({
      where: {
        orderId: "order-1",
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        orderId: true,
        authorId: true,
        targetUserId: true,
        targetRole: true,
        rating: true,
        reasonCode: true,
        comment: true,
        source: true,
        createdAt: true,
      },
    });
    expect(reviewCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("persists structured review artifacts for the completed-order command path", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const reviewFindMany = jest.fn().mockResolvedValue([]);
    const reviewFindUnique = jest.fn().mockResolvedValue(null);
    const userFindMany = jest.fn().mockResolvedValue([]);
    const reviewCreate = jest.fn().mockResolvedValue({
      id: 11n,
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "COURIER",
      rating: 4,
      reasonCode: "ON_TIME",
      comment: "Great handoff",
      source: "TELEGRAM_BOT",
      createdAt: new Date("2026-04-05T09:01:00.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 12n,
      type: "review.created",
      entity: "review",
      entityId: "11",
      payload: {},
      createdAt: new Date("2026-04-05T09:01:01.000Z"),
    });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
      },
      user: {
        findUnique: jest.fn(),
        findMany: userFindMany,
      },
      review: {
        findMany: reviewFindMany,
        findUnique: reviewFindUnique,
        create: reviewCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createReviewsFeedbackModule(prisma);

    await expect(
      module.controller.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 4,
        reasonCode: "ON_TIME",
        comment: "Great handoff",
        source: "telegram_bot",
      }),
    ).resolves.toEqual({
      reviewId: "11",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 4,
      reasonCode: "ON_TIME",
      comment: "Great handoff",
      revision: "12",
      createdAt: new Date("2026-04-05T09:01:00.000Z"),
    });

    expect(reviewFindUnique).toHaveBeenNthCalledWith(1, {
      where: {
        orderId_authorId_targetUserId: {
          orderId: "order-1",
          authorId: "client-1",
          targetUserId: "courier-1",
        },
      },
      select: {
        id: true,
        orderId: true,
        authorId: true,
        targetUserId: true,
        targetRole: true,
        rating: true,
        reasonCode: true,
        comment: true,
        source: true,
        createdAt: true,
      },
    });
    expect(reviewCreate).toHaveBeenCalledTimes(1);
    expect(eventCreate).toHaveBeenCalledTimes(1);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("keeps duplicate review submissions side-effect free", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const reviewFindMany = jest.fn().mockResolvedValue([]);
    const reviewFindUnique = jest.fn().mockResolvedValue({
      id: 11n,
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "COURIER",
      rating: 4,
      reasonCode: "ON_TIME",
      comment: null,
      source: "TELEGRAM_BOT",
      createdAt: new Date("2026-04-05T09:01:00.000Z"),
    });
    const reviewCreate = jest.fn();
    const eventCreate = jest.fn();
    const userFindMany = jest.fn().mockResolvedValue([]);
    const notifyNegativeReview = jest.fn().mockResolvedValue(undefined);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
      },
      user: {
        findUnique: jest.fn(),
        findMany: userFindMany,
      },
      review: {
        findMany: reviewFindMany,
        findUnique: reviewFindUnique,
        create: reviewCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createReviewsFeedbackModule(prisma, {
      notifyNegativeReview,
    });

    await expect(
      module.controller.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 4,
        reasonCode: "ON_TIME",
        source: "telegram_bot",
      }),
    ).resolves.toEqual({
      reviewId: "11",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 4,
      reasonCode: "ON_TIME",
      comment: null,
      revision: "11",
      createdAt: new Date("2026-04-05T09:01:00.000Z"),
    });

    expect(reviewCreate).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
    expect(userFindMany).not.toHaveBeenCalled();
    expect(notifyNegativeReview).not.toHaveBeenCalled();
  });

  it("runs the bot-guided client review flow through the owning submit path", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "client-1",
      telegramId: "70001",
      role: "CLIENT",
      isActive: true,
      name: "Client One",
    });
    const reviewFindMany = jest.fn().mockResolvedValue([]);
    const reviewFindUnique = jest.fn().mockResolvedValue(null);
    const userFindMany = jest.fn().mockResolvedValue([]);
    const reviewCreate = jest.fn().mockResolvedValue({
      id: 31n,
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "COURIER",
      rating: 4,
      reasonCode: "ON_TIME",
      comment: "Thanks",
      source: "TELEGRAM_BOT",
      createdAt: new Date("2026-04-05T09:05:00.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 32n,
      type: "review.created",
      entity: "review",
      entityId: "31",
      payload: {},
      createdAt: new Date("2026-04-05T09:05:01.000Z"),
    });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
      },
      user: {
        findUnique: userFindUnique,
        findMany: userFindMany,
      },
      review: {
        findMany: reviewFindMany,
        findUnique: reviewFindUnique,
        create: reviewCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createReviewsFeedbackModule(prisma);
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const flow = new TelegramBotReviewsFeedbackFlow(
      module.service,
      new TelegramBotReviewsFeedbackHarness({ sendMessage }),
      {
        client_to_courier: ["ON_TIME", "RUDE"],
        courier_to_client: ["RESPONSIVE", "LATE_RESPONSE"],
      },
    );

    await expect(
      flow.startFlow({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        revision: "41",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "rating",
      orderId: "order-1",
      direction: "client_to_courier",
    });
    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: "reviews-feedback:order-1:client_to_courier:rating:41:4",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "reason_code",
      orderId: "order-1",
      direction: "client_to_courier",
    });
    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: "reviews-feedback:order-1:client_to_courier:reason_code:rating%3A4:ON_TIME",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "comment",
      orderId: "order-1",
      direction: "client_to_courier",
    });
    await expect(
      flow.handleComment({
        actor: {
          userId: "client-1",
          role: "client",
        },
        orderId: "order-1",
        direction: "client_to_courier",
        comment: "Thanks",
      }),
    ).resolves.toEqual({
      type: "submitted",
      result: {
        reviewId: "31",
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 4,
        reasonCode: "ON_TIME",
        comment: "Thanks",
        revision: "32",
        createdAt: new Date("2026-04-05T09:05:00.000Z"),
      },
    });

    expect(sendMessage).toHaveBeenCalledTimes(3);
    expect(reviewCreate).toHaveBeenCalledTimes(1);
    expect(eventCreate).toHaveBeenCalledTimes(1);
    expect(userFindMany).not.toHaveBeenCalled();
  });

  it("publishes review.negative and fans out to active admins only once", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const reviewFindMany = jest.fn().mockResolvedValue([]);
    const reviewFindUnique = jest.fn().mockResolvedValue(null);
    const reviewCreate = jest.fn().mockResolvedValue({
      id: 21n,
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "COURIER",
      rating: 2,
      reasonCode: "RUDE",
      comment: null,
      source: "TELEGRAM_BOT",
      createdAt: new Date("2026-04-05T09:01:00.000Z"),
    });
    const eventCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 22n,
        type: "review.created",
        entity: "review",
        entityId: "21",
        payload: {},
        createdAt: new Date("2026-04-05T09:01:01.000Z"),
      })
      .mockResolvedValueOnce({
        id: 23n,
        type: "review.negative",
        entity: "review",
        entityId: "21",
        payload: {},
        createdAt: new Date("2026-04-05T09:01:02.000Z"),
      });
    const userFindMany = jest.fn().mockResolvedValue([
      {
        id: "boss-1",
        telegramId: "90001",
        role: "BOSS",
        isActive: true,
        name: "Boss One",
      },
      {
        id: "admin-1",
        telegramId: "90002",
        role: "ADMIN",
        isActive: true,
        name: "Admin One",
      },
    ]);
    const notifyNegativeReview = jest.fn().mockResolvedValue(undefined);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
      },
      user: {
        findUnique: jest.fn(),
        findMany: userFindMany,
      },
      review: {
        findMany: reviewFindMany,
        findUnique: reviewFindUnique,
        create: reviewCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createReviewsFeedbackModule(prisma, {
      notifyNegativeReview,
    });

    await expect(
      module.controller.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 2,
        reasonCode: "RUDE",
        source: "telegram_bot",
      }),
    ).resolves.toEqual({
      reviewId: "21",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 2,
      reasonCode: "RUDE",
      comment: null,
      revision: "23",
      createdAt: new Date("2026-04-05T09:01:00.000Z"),
    });

    expect(eventCreate).toHaveBeenCalledTimes(2);
    expect(eventCreate).toHaveBeenNthCalledWith(2, {
      data: {
        type: "review.negative",
        entity: "review",
        entityId: "21",
        payload: {
          reviewId: "21",
          orderId: "order-1",
          authorId: "client-1",
          targetUserId: "courier-1",
          targetRole: "courier",
          rating: 2,
          reasonCode: "RUDE",
          comment: null,
          source: "telegram_bot",
          createdAt: "2026-04-05T09:01:00.000Z",
        },
      },
    });
    expect(userFindMany).toHaveBeenCalledWith({
      where: {
        role: {
          in: ["BOSS", "MANAGER", "ADMIN"],
        },
        isActive: true,
      },
      select: {
        id: true,
        telegramId: true,
        role: true,
        isActive: true,
        name: true,
      },
    });
    expect(notifyNegativeReview).toHaveBeenCalledWith({
      adminTelegramIds: ["90001", "90002"],
      orderId: "order-1",
      reviewId: "21",
      direction: "client_to_courier",
      rating: 2,
      reasonCode: "RUDE",
    });
    expect(eventCreate.mock.invocationCallOrder[1]).toBeLessThan(notifyNegativeReview.mock.invocationCallOrder[0]);
  });

  it("drives the courier low-rating bot flow and keeps duplicate final callbacks side-effect free", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "70002",
      role: "COURIER",
      isActive: true,
      name: "Courier One",
    });
    const reviewFindMany = jest.fn().mockResolvedValue([]);
    const reviewFindUnique = jest.fn().mockResolvedValue(null);
    const reviewCreate = jest.fn().mockResolvedValue({
      id: 41n,
      orderId: "order-1",
      authorId: "courier-1",
      targetUserId: "client-1",
      targetRole: "CLIENT",
      rating: 2,
      reasonCode: "LATE_RESPONSE",
      comment: null,
      source: "TELEGRAM_BOT",
      createdAt: new Date("2026-04-05T09:06:00.000Z"),
    });
    const eventCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 42n,
        type: "review.created",
        entity: "review",
        entityId: "41",
        payload: {},
        createdAt: new Date("2026-04-05T09:06:01.000Z"),
      })
      .mockResolvedValueOnce({
        id: 43n,
        type: "review.negative",
        entity: "review",
        entityId: "41",
        payload: {},
        createdAt: new Date("2026-04-05T09:06:02.000Z"),
      });
    const userFindMany = jest.fn().mockResolvedValue([
      {
        id: "manager-1",
        telegramId: "90003",
        role: "MANAGER",
        isActive: true,
        name: "Manager One",
      },
      {
        id: "admin-1",
        telegramId: "90004",
        role: "ADMIN",
        isActive: true,
        name: "Admin One",
      },
    ]);
    const notifyNegativeReview = jest.fn().mockResolvedValue(undefined);
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
      },
      user: {
        findUnique: userFindUnique,
        findMany: userFindMany,
      },
      review: {
        findMany: reviewFindMany,
        findUnique: reviewFindUnique,
        create: reviewCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createReviewsFeedbackModule(prisma, {
      notifyNegativeReview,
    });
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const flow = new TelegramBotReviewsFeedbackFlow(
      module.service,
      new TelegramBotReviewsFeedbackHarness({ sendMessage }),
      {
        client_to_courier: ["ON_TIME", "RUDE"],
        courier_to_client: ["RESPONSIVE", "LATE_RESPONSE"],
      },
    );
    const skipCommentCallback =
      "reviews-feedback:order-1:courier_to_client:skip_comment:rating%3A2%3Areason%3ALATE_RESPONSE:SKIP";

    await expect(
      flow.startFlow({
        orderId: "order-1",
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        revision: "51",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "rating",
      orderId: "order-1",
      direction: "courier_to_client",
    });
    await expect(
      flow.handleCallback({
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        callbackData: "reviews-feedback:order-1:courier_to_client:rating:51:2",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "reason_code",
      orderId: "order-1",
      direction: "courier_to_client",
    });
    await expect(
      flow.handleCallback({
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        callbackData: "reviews-feedback:order-1:courier_to_client:reason_code:rating%3A2:LATE_RESPONSE",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "comment",
      orderId: "order-1",
      direction: "courier_to_client",
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        callbackData: skipCommentCallback,
      }),
    ).resolves.toEqual({
      type: "submitted",
      result: {
        reviewId: "41",
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 2,
        reasonCode: "LATE_RESPONSE",
        comment: null,
        revision: "43",
        createdAt: new Date("2026-04-05T09:06:00.000Z"),
      },
    });
    await expect(
      flow.handleCallback({
        actor: {
          userId: "courier-1",
          role: "courier",
        },
        callbackData: skipCommentCallback,
      }),
    ).resolves.toEqual({
      type: "submitted",
      result: {
        reviewId: "41",
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 2,
        reasonCode: "LATE_RESPONSE",
        comment: null,
        revision: "43",
        createdAt: new Date("2026-04-05T09:06:00.000Z"),
      },
    });

    expect(sendMessage).toHaveBeenCalledTimes(3);
    expect(reviewCreate).toHaveBeenCalledTimes(1);
    expect(eventCreate).toHaveBeenCalledTimes(2);
    expect(notifyNegativeReview).toHaveBeenCalledTimes(1);
    expect(notifyNegativeReview).toHaveBeenCalledWith({
      adminTelegramIds: ["90003", "90004"],
      orderId: "order-1",
      reviewId: "41",
      direction: "courier_to_client",
      rating: 2,
      reasonCode: "LATE_RESPONSE",
    });
    expect(eventCreate.mock.invocationCallOrder[1]).toBeLessThan(notifyNegativeReview.mock.invocationCallOrder[0]);
  });

  it("rejects stale review step callbacks without mutating the active draft", async () => {
    const orderFindUnique = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const userFindUnique = jest.fn().mockResolvedValue({
      id: "client-1",
      telegramId: "70001",
      role: "CLIENT",
      isActive: true,
      name: "Client One",
    });
    const reviewFindMany = jest.fn().mockResolvedValue([]);
    const reviewFindUnique = jest.fn().mockResolvedValue(null);
    const reviewCreate = jest.fn().mockResolvedValue({
      id: 51n,
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "COURIER",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      source: "TELEGRAM_BOT",
      createdAt: new Date("2026-04-05T09:07:00.000Z"),
    });
    const eventCreate = jest.fn().mockResolvedValue({
      id: 52n,
      type: "review.created",
      entity: "review",
      entityId: "51",
      payload: {},
      createdAt: new Date("2026-04-05T09:07:01.000Z"),
    });
    const prisma = createPrismaProvider({
      order: {
        findUnique: orderFindUnique,
      },
      user: {
        findUnique: userFindUnique,
        findMany: jest.fn().mockResolvedValue([]),
      },
      review: {
        findMany: reviewFindMany,
        findUnique: reviewFindUnique,
        create: reviewCreate,
      },
      event: {
        create: eventCreate,
      },
    });
    const module = createReviewsFeedbackModule(prisma);
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const flow = new TelegramBotReviewsFeedbackFlow(
      module.service,
      new TelegramBotReviewsFeedbackHarness({ sendMessage }),
      {
        client_to_courier: ["ON_TIME", "RUDE"],
        courier_to_client: ["RESPONSIVE", "LATE_RESPONSE"],
      },
    );

    await flow.startFlow({
      orderId: "order-1",
      actor: {
        userId: "client-1",
        role: "client",
      },
      revision: "61",
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: "reviews-feedback:order-1:client_to_courier:rating:61:5",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "reason_code",
      orderId: "order-1",
      direction: "client_to_courier",
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: "reviews-feedback:order-1:client_to_courier:rating:61:1",
      }),
    ).resolves.toEqual({
      type: "ignored",
      reason: "stale_callback",
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: "reviews-feedback:order-1:client_to_courier:reason_code:rating%3A5:ON_TIME",
      }),
    ).resolves.toEqual({
      type: "prompt",
      stage: "comment",
      orderId: "order-1",
      direction: "client_to_courier",
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: "reviews-feedback:order-1:client_to_courier:reason_code:rating%3A5:RUDE",
      }),
    ).resolves.toEqual({
      type: "ignored",
      reason: "stale_callback",
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData:
          "reviews-feedback:order-1:client_to_courier:skip_comment:rating%3A5%3Areason%3AON_TIME:SKIP",
      }),
    ).resolves.toEqual({
      type: "submitted",
      result: {
        reviewId: "51",
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: "ON_TIME",
        comment: null,
        revision: "52",
        createdAt: new Date("2026-04-05T09:07:00.000Z"),
      },
    });

    expect(reviewCreate).toHaveBeenCalledTimes(1);
    expect(reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "order-1",
          authorId: "client-1",
          targetUserId: "courier-1",
          targetRole: "COURIER",
          rating: 5,
          reasonCode: "ON_TIME",
          comment: null,
          source: "TELEGRAM_BOT",
          createdAt: expect.any(Date),
        }),
        select: {
          id: true,
          orderId: true,
          authorId: true,
          targetUserId: true,
          targetRole: true,
          rating: true,
          reasonCode: true,
          comment: true,
          source: true,
          createdAt: true,
        },
      }),
    );
  });
});
