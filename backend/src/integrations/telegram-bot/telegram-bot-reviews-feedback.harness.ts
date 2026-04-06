import type { ReviewsFeedbackDirection } from "../../slices/reviews-feedback/domain/reviews-feedback.types";
import type { TelegramBotMessageDispatcher } from "./telegram-bot-delivery-assignment.notifier";

export type TelegramBotReviewButton = {
  label: string;
  callbackData: string;
};

export type TelegramBotReviewMessageInput = {
  chatId: string;
  text: string;
  dedupeKey: string;
  buttons: TelegramBotReviewButton[];
};

export interface TelegramBotReviewMessageDispatcher {
  sendMessage(input: TelegramBotReviewMessageInput): Promise<void>;
}

export type ReviewStepperStage = "rating" | "reason_code" | "skip_comment";

export type ReviewStepperCallbackPayload = {
  orderId: string;
  direction: ReviewsFeedbackDirection;
  stage: ReviewStepperStage;
  revision: string;
  value: string;
};

export type ReviewRatingPromptInput = {
  chatId: string;
  orderId: string;
  direction: ReviewsFeedbackDirection;
  revision: string;
};

export type ReviewReasonCodePromptInput = {
  chatId: string;
  orderId: string;
  direction: ReviewsFeedbackDirection;
  rating: number;
  reasonCodes: string[];
  revision: string;
};

export type ReviewCommentPromptInput = {
  chatId: string;
  orderId: string;
  direction: ReviewsFeedbackDirection;
  reasonCode: string;
  revision: string;
};

export type NegativeReviewAlertInput = {
  adminTelegramIds: string[];
  orderId: string;
  reviewId: string;
  direction: ReviewsFeedbackDirection;
  rating: number;
  reasonCode: string;
};

const REVIEW_CALLBACK_PREFIX = "reviews-feedback";

const formatDirection = (direction: ReviewsFeedbackDirection): string =>
  direction === "client_to_courier" ? "client -> courier" : "courier -> client";

const encodeSegment = (value: string): string => encodeURIComponent(value);

const decodeSegment = (value: string): string => decodeURIComponent(value);

export const buildReviewStepperCallbackData = (payload: ReviewStepperCallbackPayload): string =>
  [
    REVIEW_CALLBACK_PREFIX,
    payload.orderId,
    payload.direction,
    payload.stage,
    encodeSegment(payload.revision),
    encodeSegment(payload.value),
  ].join(":");

export const parseReviewStepperCallbackData = (
  value: string,
): ReviewStepperCallbackPayload | null => {
  const [prefix, orderId, direction, stage, encodedRevision, encodedValue] = value.split(":");

  if (
    prefix !== REVIEW_CALLBACK_PREFIX ||
    typeof orderId !== "string" ||
    orderId.length === 0 ||
    (direction !== "client_to_courier" && direction !== "courier_to_client") ||
    (stage !== "rating" && stage !== "reason_code" && stage !== "skip_comment") ||
    typeof encodedRevision !== "string" ||
    encodedRevision.length === 0 ||
    typeof encodedValue !== "string" ||
    encodedValue.length === 0
  ) {
    return null;
  }

  return {
    orderId,
    direction,
    stage,
    revision: decodeSegment(encodedRevision),
    value: decodeSegment(encodedValue),
  };
};

const buildRatingPromptText = (input: ReviewRatingPromptInput): string =>
  `Order ${input.orderId} review (${formatDirection(input.direction)}): choose a rating from 1 to 5.`;

const buildReasonCodePromptText = (input: ReviewReasonCodePromptInput): string =>
  `Order ${input.orderId} review (${formatDirection(input.direction)}): choose the main reason for rating ${input.rating}.`;

const buildCommentPromptText = (input: ReviewCommentPromptInput): string =>
  `Order ${input.orderId} review (${formatDirection(input.direction)}): send an optional comment for reason ${input.reasonCode}, or skip this step.`;

const buildNegativeAlertText = (input: NegativeReviewAlertInput): string =>
  [
    `Negative review alert for order ${input.orderId}.`,
    `Direction: ${formatDirection(input.direction)}.`,
    `Rating: ${input.rating}.`,
    `Reason: ${input.reasonCode}.`,
  ].join(" ");

const buildNegativeAlertDedupeKey = (reviewId: string, adminTelegramId: string): string =>
  `review.negative:${reviewId}:${adminTelegramId}`;

export class TelegramBotReviewsFeedbackHarness {
  constructor(private readonly dispatcher: TelegramBotReviewMessageDispatcher) {}

  notifyRatingStep(input: ReviewRatingPromptInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.chatId,
      text: buildRatingPromptText(input),
      dedupeKey: `review.stepper:${input.orderId}:${input.direction}:rating:${input.revision}`,
      buttons: [1, 2, 3, 4, 5].map((rating) => ({
        label: String(rating),
        callbackData: buildReviewStepperCallbackData({
          orderId: input.orderId,
          direction: input.direction,
          stage: "rating",
          revision: input.revision,
          value: String(rating),
        }),
      })),
    });
  }

  notifyReasonCodeStep(input: ReviewReasonCodePromptInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.chatId,
      text: buildReasonCodePromptText(input),
      dedupeKey: `review.stepper:${input.orderId}:${input.direction}:reason_code:${input.revision}`,
      buttons: input.reasonCodes.map((reasonCode) => ({
        label: reasonCode,
        callbackData: buildReviewStepperCallbackData({
          orderId: input.orderId,
          direction: input.direction,
          stage: "reason_code",
          revision: input.revision,
          value: reasonCode,
        }),
      })),
    });
  }

  notifyCommentStep(input: ReviewCommentPromptInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.chatId,
      text: buildCommentPromptText(input),
      dedupeKey: `review.stepper:${input.orderId}:${input.direction}:comment:${input.revision}`,
      buttons: [
        {
          label: "Skip comment",
          callbackData: buildReviewStepperCallbackData({
            orderId: input.orderId,
            direction: input.direction,
            stage: "skip_comment",
            revision: input.revision,
            value: "SKIP",
          }),
        },
      ],
    });
  }

  parseReviewStep(callbackData: string): ReviewStepperCallbackPayload | null {
    return parseReviewStepperCallbackData(callbackData);
  }
}

export class TelegramBotNegativeReviewAlertHarness {
  constructor(private readonly dispatcher: TelegramBotMessageDispatcher) {}

  async notifyActiveAdmins(input: NegativeReviewAlertInput): Promise<void> {
    const uniqueTargets = [...new Set(input.adminTelegramIds.filter((telegramId) => telegramId.length > 0))];

    await Promise.all(
      uniqueTargets.map((adminTelegramId) =>
        this.dispatcher.sendMessage({
          chatId: adminTelegramId,
          text: buildNegativeAlertText(input),
          dedupeKey: buildNegativeAlertDedupeKey(input.reviewId, adminTelegramId),
        }),
      ),
    );
  }
}
