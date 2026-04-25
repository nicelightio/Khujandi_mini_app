import { TelegramBotReviewsFeedbackFlow } from "../../../backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow";
import {
  buildReviewStepperCallbackData,
  TelegramBotReviewsFeedbackHarness,
} from "../../../backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness";
import {
  createFlowService,
  reviewReasons,
} from "./reviews-feedback.unit.test-helpers";

export const registerReviewsFeedbackFlowCases = () => {
  it("drives the client review flow from rating to optional comment submission", async () => {
    const sendMessage = jest.fn().mockResolvedValue(undefined);
    const resolveReviewFlowContext = jest.fn().mockResolvedValue({
      actorTelegramId: "70001",
      direction: "client_to_courier",
      targetUserId: "courier-1",
      targetRole: "courier",
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
    const service = createFlowService({
      resolveReviewFlowContext,
      submitReview,
    });
    const flow = new TelegramBotReviewsFeedbackFlow(
      service,
      new TelegramBotReviewsFeedbackHarness({ sendMessage }),
      reviewReasons,
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
    const resolveReviewFlowContext = jest.fn().mockResolvedValue({
      actorTelegramId: "70002",
      direction: "courier_to_client",
      targetUserId: "client-1",
      targetRole: "client",
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
    const service = createFlowService({
      resolveReviewFlowContext,
      submitReview,
    });
    const flow = new TelegramBotReviewsFeedbackFlow(
      service,
      new TelegramBotReviewsFeedbackHarness({ sendMessage }),
      reviewReasons,
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
    const resolveReviewFlowContext = jest.fn().mockResolvedValue({
      actorTelegramId: "70001",
      direction: "client_to_courier",
      targetUserId: "courier-1",
      targetRole: "courier",
    });
    const submitReview = jest.fn();
    const service = createFlowService({
      resolveReviewFlowContext,
      submitReview,
    });
    const flow = new TelegramBotReviewsFeedbackFlow(
      service,
      new TelegramBotReviewsFeedbackHarness({ sendMessage }),
      reviewReasons,
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
};
