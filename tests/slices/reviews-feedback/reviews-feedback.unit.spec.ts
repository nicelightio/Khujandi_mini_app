import {
  buildReviewStepperCallbackData,
  parseReviewStepperCallbackData,
  TelegramBotNegativeReviewAlertHarness,
  TelegramBotReviewsFeedbackHarness,
} from "../../../backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness";
import { TelegramBotReviewsFeedbackFlow } from "../../../backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow";
import type { ReviewsFeedbackController } from "../../../backend/src/slices/reviews-feedback/presentation/reviews-feedback.controller";
import { ReviewsFeedbackService } from "../../../backend/src/slices/reviews-feedback/application/reviews-feedback.service";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import type {
  ReviewsFeedbackRepository,
  ReviewsFeedbackReviewDraftRecord,
  UpsertReviewDraftInput,
} from "../../../backend/src/slices/reviews-feedback/domain/reviews-feedback.types";

const createRepository = (): ReviewsFeedbackRepository => ({
  findOrderById: async () => null,
  findUserById: async () => null,
  listActiveAdminUsers: async () => [],
  listReviewsByOrderId: async () => [],
  findActiveReviewDraft: async () => null,
  upsertReviewDraft: async (input) => ({
    orderId: input.orderId,
    actorUserId: input.actorUserId,
    direction: input.direction,
    actorTelegramId: input.actorTelegramId,
    targetUserId: input.targetUserId,
    targetRole: input.targetRole,
    expectedStage: input.expectedStage,
    expectedRevision: input.expectedRevision,
    rating: input.rating,
    reasonCode: input.reasonCode,
    submittedReviewId: input.submittedReviewId,
    submittedRevision: input.submittedRevision,
    submittedComment: input.submittedComment,
    submittedCreatedAt: input.submittedCreatedAt,
    expiresAt: input.expiresAt,
    updatedAt: new Date("2026-04-06T10:00:00.000Z"),
  }),
  findReviewByUniquePair: async () => null,
  persistReview: async () => ({
    review: {
      id: 11n,
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      source: "telegram_bot",
      createdAt: new Date("2026-04-05T09:00:00.000Z"),
    },
    events: [
      {
        id: 12n,
        type: "review.created",
        entity: "review",
        entityId: "11",
        payload: {
          reviewId: "11",
          orderId: "order-1",
          authorId: "client-1",
          targetUserId: "courier-1",
          targetRole: "courier",
          rating: 5,
          reasonCode: "ON_TIME",
          comment: null,
          source: "telegram_bot",
          createdAt: "2026-04-05T09:00:00.000Z",
        },
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      },
    ],
    revision: "12",
  }),
});

const createFlowController = (input: {
  getOrderById: jest.Mock;
  getUserById: jest.Mock;
  submitReview: jest.Mock;
}): ReviewsFeedbackController => {
  const drafts = new Map<string, ReviewsFeedbackReviewDraftRecord>();
  const submittedReviews = new Map<string, Awaited<ReturnType<typeof input.submitReview>>>();
  const buildKey = (orderId: string, actorUserId: string, direction: string): string =>
    `${orderId}:${actorUserId}:${direction}`;
  const getReviewsByOrderId = jest.fn(async (orderId: string) => {
    return [...submittedReviews.values()]
      .filter((review) => review.orderId === orderId)
      .map((review) => ({
        id: BigInt(review.reviewId),
        orderId: review.orderId,
        authorId: review.authorId,
        targetUserId: review.targetUserId,
        targetRole: review.targetRole,
        rating: review.rating,
        reasonCode: review.reasonCode,
        comment: review.comment,
        source: "telegram_bot" as const,
        createdAt: review.createdAt,
      }));
  });
  const submitReview = jest.fn(async (payload) => {
    const result = await input.submitReview(payload);

    submittedReviews.set(result.reviewId, result);

    return result;
  });

  return {
    getOrderById: input.getOrderById,
    getUserById: input.getUserById,
    getReviewsByOrderId,
    getActiveReviewDraft: jest.fn(async (orderId, actorUserId, direction, now) => {
      const draft = drafts.get(buildKey(orderId, actorUserId, direction)) ?? null;

      if (draft === null || draft.expiresAt.getTime() <= now.getTime()) {
        return null;
      }

      return draft;
    }),
    upsertReviewDraft: jest.fn(async (draft: UpsertReviewDraftInput) => {
      const nextDraft: ReviewsFeedbackReviewDraftRecord = {
        ...draft,
        updatedAt: new Date("2026-04-06T10:00:00.000Z"),
      };

      drafts.set(buildKey(draft.orderId, draft.actorUserId, draft.direction), nextDraft);

      return nextDraft;
    }),
    submitReview,
  } as unknown as ReviewsFeedbackController;
};

describe("reviews-feedback service", () => {
  it("builds a transport-only Telegram review rating prompt", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const harness = new TelegramBotReviewsFeedbackHarness({ sendMessage });

    await expect(
      harness.notifyRatingStep({
        chatId: "70001",
        orderId: "order-1",
        direction: "client_to_courier",
        revision: "22",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: "70001",
      text: "Order order-1 review (client -> courier): choose a rating from 1 to 5.",
      dedupeKey: "review.stepper:order-1:client_to_courier:rating:22",
      buttons: [
        { label: "1", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:1" },
        { label: "2", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:2" },
        { label: "3", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:3" },
        { label: "4", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:4" },
        { label: "5", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:5" },
      ],
    });
  });

  it("parses review callback payloads as transport-only step intents", () => {
    const callbackData = buildReviewStepperCallbackData({
      orderId: "order-1",
      direction: "courier_to_client",
      stage: "reason_code",
      revision: "rating:2",
      value: "LATE_RESPONSE",
    });

    expect(callbackData).toBe(
      "reviews-feedback:order-1:courier_to_client:reason_code:rating%3A2:LATE_RESPONSE",
    );
    expect(parseReviewStepperCallbackData(callbackData)).toEqual({
      orderId: "order-1",
      direction: "courier_to_client",
      stage: "reason_code",
      revision: "rating:2",
      value: "LATE_RESPONSE",
    });
    expect(
      parseReviewStepperCallbackData("reviews-feedback:order-1:courier_to_client:comment:test"),
    ).toBeNull();
  });

  it("fans out negative review alerts to unique admin chat targets", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const harness = new TelegramBotNegativeReviewAlertHarness({ sendMessage });

    await expect(
      harness.notifyActiveAdmins({
        adminTelegramIds: ["80001", "80002", "80001", ""],
        orderId: "order-1",
        reviewId: "11",
        direction: "client_to_courier",
        rating: 2,
        reasonCode: "RUDE",
      }),
    ).resolves.toBeUndefined();

    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      chatId: "80001",
      text:
        "Negative review alert for order order-1. Direction: client -> courier. Rating: 2. Reason: RUDE.",
      dedupeKey: "review.negative:11:80001",
    });
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      chatId: "80002",
      text:
        "Negative review alert for order order-1. Direction: client -> courier. Rating: 2. Reason: RUDE.",
      dedupeKey: "review.negative:11:80002",
    });
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it("drives the client review flow from rating to optional comment submission", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const getOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const getUserById = jest.fn().mockResolvedValue({
      id: "client-1",
      telegramId: "70001",
      role: "client",
      isActive: true,
      name: "Client One",
    });
    const submitReview = jest.fn().mockResolvedValue({
      reviewId: "11",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: "Great handoff",
      revision: "12",
      createdAt: new Date("2026-04-05T09:01:00.000Z"),
    });
    const controller = createFlowController({
      getOrderById,
      getUserById,
      submitReview,
    });
    const flow = new TelegramBotReviewsFeedbackFlow(
      controller,
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
        revision: "22",
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
        callbackData: buildReviewStepperCallbackData({
          orderId: "order-1",
          direction: "client_to_courier",
          stage: "rating",
          revision: "22",
          value: "5",
        }),
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
        callbackData: buildReviewStepperCallbackData({
          orderId: "order-1",
          direction: "client_to_courier",
          stage: "reason_code",
          revision: "rating:5",
          value: "ON_TIME",
        }),
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
        comment: "Great handoff",
      }),
    ).resolves.toEqual({
      type: "submitted",
      result: {
        reviewId: "11",
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: "ON_TIME",
        comment: "Great handoff",
        revision: "12",
        createdAt: new Date("2026-04-05T09:01:00.000Z"),
      },
    });

    expect(sendMessage).toHaveBeenNthCalledWith(1, {
      chatId: "70001",
      text: "Order order-1 review (client -> courier): choose a rating from 1 to 5.",
      dedupeKey: "review.stepper:order-1:client_to_courier:rating:22",
      buttons: [
        { label: "1", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:1" },
        { label: "2", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:2" },
        { label: "3", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:3" },
        { label: "4", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:4" },
        { label: "5", callbackData: "reviews-feedback:order-1:client_to_courier:rating:22:5" },
      ],
    });
    expect(sendMessage).toHaveBeenNthCalledWith(2, {
      chatId: "70001",
      text: "Order order-1 review (client -> courier): choose the main reason for rating 5.",
      dedupeKey: "review.stepper:order-1:client_to_courier:reason_code:rating:5",
      buttons: [
        {
          label: "ON_TIME",
          callbackData: "reviews-feedback:order-1:client_to_courier:reason_code:rating%3A5:ON_TIME",
        },
        {
          label: "RUDE",
          callbackData: "reviews-feedback:order-1:client_to_courier:reason_code:rating%3A5:RUDE",
        },
      ],
    });
    expect(sendMessage).toHaveBeenNthCalledWith(3, {
      chatId: "70001",
      text: "Order order-1 review (client -> courier): send an optional comment for reason ON_TIME, or skip this step.",
      dedupeKey: "review.stepper:order-1:client_to_courier:comment:rating:5:reason:ON_TIME",
      buttons: [
        {
          label: "Skip comment",
          callbackData:
            "reviews-feedback:order-1:client_to_courier:skip_comment:rating%3A5%3Areason%3AON_TIME:SKIP",
        },
      ],
    });
    expect(sendMessage).toHaveBeenCalledTimes(3);
    expect(submitReview).toHaveBeenCalledWith({
      orderId: "order-1",
      actor: {
        userId: "client-1",
        role: "client",
      },
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: "Great handoff",
      source: "telegram_bot",
    });
  });

  it("drives the courier review flow and short-circuits duplicate final callbacks", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const getOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const getUserById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "70002",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    const submitReview = jest.fn().mockResolvedValue({
      reviewId: "21",
      orderId: "order-1",
      authorId: "courier-1",
      targetUserId: "client-1",
      targetRole: "client",
      rating: 2,
      reasonCode: "LATE_RESPONSE",
      comment: null,
      revision: "22",
      createdAt: new Date("2026-04-05T09:02:00.000Z"),
    });
    const controller = createFlowController({
      getOrderById,
      getUserById,
      submitReview,
    });
    const flow = new TelegramBotReviewsFeedbackFlow(
      controller,
      new TelegramBotReviewsFeedbackHarness({ sendMessage }),
      {
        client_to_courier: ["ON_TIME", "RUDE"],
        courier_to_client: ["RESPONSIVE", "LATE_RESPONSE"],
      },
    );
    const skipCommentCallback = buildReviewStepperCallbackData({
      orderId: "order-1",
      direction: "courier_to_client",
      stage: "skip_comment",
      revision: "rating:2:reason:LATE_RESPONSE",
      value: "SKIP",
    });

    await flow.startFlow({
      orderId: "order-1",
      actor: {
        userId: "courier-1",
        role: "courier",
      },
      revision: "31",
    });
    await flow.handleCallback({
      actor: {
        userId: "courier-1",
        role: "courier",
      },
        callbackData: buildReviewStepperCallbackData({
          orderId: "order-1",
          direction: "courier_to_client",
          stage: "rating",
          revision: "31",
          value: "2",
        }),
    });
    await flow.handleCallback({
      actor: {
        userId: "courier-1",
        role: "courier",
      },
        callbackData: buildReviewStepperCallbackData({
          orderId: "order-1",
          direction: "courier_to_client",
          stage: "reason_code",
          revision: "rating:2",
          value: "LATE_RESPONSE",
        }),
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
        reviewId: "21",
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 2,
        reasonCode: "LATE_RESPONSE",
        comment: null,
        revision: "22",
        createdAt: new Date("2026-04-05T09:02:00.000Z"),
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
        reviewId: "21",
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 2,
        reasonCode: "LATE_RESPONSE",
        comment: null,
        revision: "22",
        createdAt: new Date("2026-04-05T09:02:00.000Z"),
      },
    });

    expect(submitReview).toHaveBeenCalledTimes(1);
    expect(submitReview).toHaveBeenCalledWith({
      orderId: "order-1",
      actor: {
        userId: "courier-1",
        role: "courier",
      },
      targetUserId: "client-1",
      targetRole: "client",
      rating: 2,
      reasonCode: "LATE_RESPONSE",
      source: "telegram_bot",
    });
  });

  it("ignores stale rating and reason-code callbacks after newer prompts are active", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const getOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const getUserById = jest.fn().mockResolvedValue({
      id: "client-1",
      telegramId: "70001",
      role: "client",
      isActive: true,
      name: "Client One",
    });
    const submitReview = jest.fn();
    const controller = createFlowController({
      getOrderById,
      getUserById,
      submitReview,
    });
    const flow = new TelegramBotReviewsFeedbackFlow(
      controller,
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
      revision: "22",
    });
    await flow.handleCallback({
      actor: {
        userId: "client-1",
        role: "client",
      },
      callbackData: buildReviewStepperCallbackData({
        orderId: "order-1",
        direction: "client_to_courier",
        stage: "rating",
        revision: "22",
        value: "5",
      }),
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: buildReviewStepperCallbackData({
          orderId: "order-1",
          direction: "client_to_courier",
          stage: "rating",
          revision: "22",
          value: "1",
        }),
      }),
    ).resolves.toEqual({
      type: "ignored",
      reason: "stale_callback",
    });

    await flow.handleCallback({
      actor: {
        userId: "client-1",
        role: "client",
      },
      callbackData: buildReviewStepperCallbackData({
        orderId: "order-1",
        direction: "client_to_courier",
        stage: "reason_code",
        revision: "rating:5",
        value: "ON_TIME",
      }),
    });

    await expect(
      flow.handleCallback({
        actor: {
          userId: "client-1",
          role: "client",
        },
        callbackData: buildReviewStepperCallbackData({
          orderId: "order-1",
          direction: "client_to_courier",
          stage: "reason_code",
          revision: "rating:5",
          value: "RUDE",
        }),
      }),
    ).resolves.toEqual({
      type: "ignored",
      reason: "stale_callback",
    });

    expect(submitReview).not.toHaveBeenCalled();
  });

  it("keeps order and user lookups behind the owning slice repository", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const findUserById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "70001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      findOrderById,
      findUserById,
    });

    await expect(service.findOrderById("order-1")).resolves.toEqual({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    await expect(service.findUserById("courier-1")).resolves.toEqual({
      id: "courier-1",
      telegramId: "70001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    expect(findOrderById).toHaveBeenCalledWith("order-1");
    expect(findUserById).toHaveBeenCalledWith("courier-1");
  });

  it("returns persisted reviews ordered by creation time via the owning slice repository", async () => {
    const listReviewsByOrderId = jest.fn().mockResolvedValue([
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
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      },
      {
        id: 12n,
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 4,
        reasonCode: "RESPONSIVE",
        comment: "Quick handoff",
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:03:00.000Z"),
      },
    ]);
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      listReviewsByOrderId,
    });

    await expect(service.listReviewsByOrderId("order-1")).resolves.toEqual([
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
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      },
      {
        id: 12n,
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 4,
        reasonCode: "RESPONSIVE",
        comment: "Quick handoff",
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:03:00.000Z"),
      },
    ]);
    expect(listReviewsByOrderId).toHaveBeenCalledWith("order-1");
  });

  it.todo("rejects review submission before the order reaches COMPLETED");
  it("rejects review submission before the order reaches COMPLETED", async () => {
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      findOrderById: jest.fn().mockResolvedValue({
        id: "order-1",
        clientId: "client-1",
        courierId: "courier-1",
        status: "DELIVERED",
        updatedAt: new Date("2026-04-05T09:00:00.000Z"),
        isDeleted: false,
      }),
    });

    await expect(
      service.submitReview({
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
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      service.submitReview({
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
    ).rejects.toMatchObject({
      code: "CONFLICT",
      statusCode: 409,
    });
  });

  it("persists a structured review only once for a unique order and actor-target pair", async () => {
    const findReviewByUniquePair = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 11n,
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: "ON_TIME",
        comment: null,
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      });
    const persistReview = jest.fn().mockResolvedValue({
      review: {
        id: 11n,
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: "ON_TIME",
        comment: null,
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      },
      events: [],
      revision: "12",
    });
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      findOrderById: jest.fn().mockResolvedValue({
        id: "order-1",
        clientId: "client-1",
        courierId: "courier-1",
        status: "COMPLETED",
        updatedAt: new Date("2026-04-05T09:00:00.000Z"),
        isDeleted: false,
      }),
      findReviewByUniquePair,
      persistReview,
    });

    await expect(
      service.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: " ON_TIME ",
        comment: "   ",
        source: "telegram_bot",
      }),
    ).resolves.toEqual({
      reviewId: "11",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      revision: "12",
      createdAt: new Date("2026-04-05T09:00:00.000Z"),
    });

    await expect(
      service.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: "ON_TIME",
        source: "telegram_bot",
      }),
    ).resolves.toEqual({
      reviewId: "11",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      revision: "11",
      createdAt: new Date("2026-04-05T09:00:00.000Z"),
    });

    expect(persistReview).toHaveBeenCalledTimes(1);
    expect(persistReview).toHaveBeenCalledWith({
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      source: "telegram_bot",
      createdAt: expect.any(Date),
      publishNegativeEvent: false,
    });
  });

  it("publishes a single review.negative notification for low-rating reviews", async () => {
    const notifyNegativeReview = jest.fn().mockResolvedValue(undefined);
    const persistReview = jest.fn().mockResolvedValue({
      review: {
        id: 21n,
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 2,
        reasonCode: "RUDE",
        comment: null,
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      },
      events: [
        {
          id: 22n,
          type: "review.created",
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
            createdAt: "2026-04-05T09:00:00.000Z",
          },
          createdAt: new Date("2026-04-05T09:00:01.000Z"),
        },
        {
          id: 23n,
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
            createdAt: "2026-04-05T09:00:00.000Z",
          },
          createdAt: new Date("2026-04-05T09:00:02.000Z"),
        },
      ],
      revision: "23",
    });
    const listActiveAdminUsers = jest.fn().mockResolvedValue([
      {
        id: "admin-1",
        telegramId: "80001",
        role: "admin",
        isActive: true,
        name: "Admin One",
      },
      {
        id: "boss-1",
        telegramId: "80002",
        role: "boss",
        isActive: true,
        name: "Boss One",
      },
    ]);
    const service = new ReviewsFeedbackService(
      {
        ...createRepository(),
        findOrderById: jest.fn().mockResolvedValue({
          id: "order-1",
          clientId: "client-1",
          courierId: "courier-1",
          status: "COMPLETED",
          updatedAt: new Date("2026-04-05T09:00:00.000Z"),
          isDeleted: false,
        }),
        persistReview,
        listActiveAdminUsers,
      },
      {
        notifyNegativeReview,
      },
    );

    await expect(
      service.submitReview({
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
    ).resolves.toMatchObject({
      reviewId: "21",
      revision: "23",
      rating: 2,
      reasonCode: "RUDE",
    });

    expect(persistReview).toHaveBeenCalledWith({
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 2,
      reasonCode: "RUDE",
      comment: null,
      source: "telegram_bot",
      createdAt: expect.any(Date),
      publishNegativeEvent: true,
    });
    expect(listActiveAdminUsers).toHaveBeenCalledTimes(1);
    expect(notifyNegativeReview).toHaveBeenCalledWith({
      adminTelegramIds: ["80001", "80002"],
      orderId: "order-1",
      reviewId: "21",
      direction: "client_to_courier",
      rating: 2,
      reasonCode: "RUDE",
    });
  });
});
