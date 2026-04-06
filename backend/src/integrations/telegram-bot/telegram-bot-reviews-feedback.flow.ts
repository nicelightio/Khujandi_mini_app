import { AppError } from "../../shared/errors/app-error";
import { ReviewsFeedbackController } from "../../slices/reviews-feedback/presentation/reviews-feedback.controller";
import type {
  ReviewsFeedbackActor,
  ReviewsFeedbackCommandResult,
  ReviewsFeedbackDirection,
  ReviewsFeedbackOrderId,
  ReviewsFeedbackTargetRole,
  ReviewsFeedbackUserId,
  ReviewsFeedbackUserRecord,
} from "../../slices/reviews-feedback/domain/reviews-feedback.types";
import { TelegramBotReviewsFeedbackHarness } from "./telegram-bot-reviews-feedback.harness";

type ReviewFlowStage = "rating" | "reason_code" | "comment";

export type TelegramBotReviewReasonCodes = Record<ReviewsFeedbackDirection, string[]>;

export type StartTelegramBotReviewFlowInput = {
  orderId: ReviewsFeedbackOrderId;
  actor: ReviewsFeedbackActor;
  revision: string;
};

export type HandleTelegramBotReviewCallbackInput = {
  actor: ReviewsFeedbackActor;
  callbackData: string;
};

export type HandleTelegramBotReviewCommentInput = {
  actor: ReviewsFeedbackActor;
  orderId: ReviewsFeedbackOrderId;
  direction: ReviewsFeedbackDirection;
  comment?: string;
};

export type TelegramBotReviewFlowResult =
  | {
      type: "prompt";
      stage: ReviewFlowStage;
      orderId: ReviewsFeedbackOrderId;
      direction: ReviewsFeedbackDirection;
    }
  | {
      type: "submitted";
      result: ReviewsFeedbackCommandResult;
    }
  | {
      type: "ignored";
      reason:
        | "invalid_callback"
        | "direction_mismatch"
        | "invalid_rating"
        | "missing_draft"
        | "invalid_reason_code";
    };

type PendingReviewDraft = {
  orderId: ReviewsFeedbackOrderId;
  actor: ReviewsFeedbackActor;
  actorTelegramId: string;
  direction: ReviewsFeedbackDirection;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  rating: number | null;
  reasonCode: string | null;
  submittedResult: ReviewsFeedbackCommandResult | null;
};

const COMPLETED_ORDER_STATUS = "COMPLETED";

const buildDraftKey = (
  actorUserId: ReviewsFeedbackUserId,
  orderId: ReviewsFeedbackOrderId,
  direction: ReviewsFeedbackDirection,
): string => `${actorUserId}:${orderId}:${direction}`;

const resolveDirectionForActor = (actor: ReviewsFeedbackActor): ReviewsFeedbackDirection =>
  actor.role === "client" ? "client_to_courier" : "courier_to_client";

const buildReasonPromptRevision = (rating: number): string => `rating:${rating}`;

const buildCommentPromptRevision = (rating: number, reasonCode: string): string =>
  `rating:${rating}:reason:${reasonCode}`;

export class TelegramBotReviewsFeedbackFlow {
  private readonly drafts = new Map<string, PendingReviewDraft>();

  constructor(
    private readonly controller: ReviewsFeedbackController,
    private readonly harness: TelegramBotReviewsFeedbackHarness,
    private readonly reasonCodes: TelegramBotReviewReasonCodes,
  ) {}

  async startFlow(input: StartTelegramBotReviewFlowInput): Promise<TelegramBotReviewFlowResult> {
    const context = await this.resolveContext(input.orderId, input.actor);

    this.drafts.set(context.draftKey, {
      orderId: input.orderId,
      actor: input.actor,
      actorTelegramId: context.actorUser.telegramId,
      direction: context.direction,
      targetUserId: context.targetUserId,
      targetRole: context.targetRole,
      rating: null,
      reasonCode: null,
      submittedResult: null,
    });

    await this.harness.notifyRatingStep({
      chatId: context.actorUser.telegramId,
      orderId: input.orderId,
      direction: context.direction,
      revision: input.revision,
    });

    return {
      type: "prompt",
      stage: "rating",
      orderId: input.orderId,
      direction: context.direction,
    };
  }

  async handleCallback(
    input: HandleTelegramBotReviewCallbackInput,
  ): Promise<TelegramBotReviewFlowResult> {
    const payload = this.harness.parseReviewStep(input.callbackData);

    if (payload === null) {
      return {
        type: "ignored",
        reason: "invalid_callback",
      };
    }

    const expectedDirection = resolveDirectionForActor(input.actor);

    if (payload.direction !== expectedDirection) {
      return {
        type: "ignored",
        reason: "direction_mismatch",
      };
    }

    const context = await this.resolveContext(payload.orderId, input.actor);
    const draftKey = context.draftKey;

    if (payload.stage === "rating") {
      const rating = Number.parseInt(payload.value, 10);

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return {
          type: "ignored",
          reason: "invalid_rating",
        };
      }

      const nextDraft: PendingReviewDraft = {
        orderId: payload.orderId,
        actor: input.actor,
        actorTelegramId: context.actorUser.telegramId,
        direction: payload.direction,
        targetUserId: context.targetUserId,
        targetRole: context.targetRole,
        rating,
        reasonCode: null,
        submittedResult: null,
      };

      this.drafts.set(draftKey, nextDraft);

      await this.harness.notifyReasonCodeStep({
        chatId: context.actorUser.telegramId,
        orderId: payload.orderId,
        direction: payload.direction,
        rating,
        reasonCodes: this.reasonCodes[payload.direction],
        revision: buildReasonPromptRevision(rating),
      });

      return {
        type: "prompt",
        stage: "reason_code",
        orderId: payload.orderId,
        direction: payload.direction,
      };
    }

    const draft = this.drafts.get(draftKey);

    if (draft === undefined || draft.rating === null) {
      return {
        type: "ignored",
        reason: "missing_draft",
      };
    }

    if (payload.stage === "reason_code") {
      if (!this.reasonCodes[payload.direction].includes(payload.value)) {
        return {
          type: "ignored",
          reason: "invalid_reason_code",
        };
      }

      draft.reasonCode = payload.value;
      draft.submittedResult = null;

      await this.harness.notifyCommentStep({
        chatId: draft.actorTelegramId,
        orderId: draft.orderId,
        direction: draft.direction,
        reasonCode: payload.value,
        revision: buildCommentPromptRevision(draft.rating, payload.value),
      });

      return {
        type: "prompt",
        stage: "comment",
        orderId: draft.orderId,
        direction: draft.direction,
      };
    }

    if (draft.reasonCode === null) {
      return {
        type: "ignored",
        reason: "missing_draft",
      };
    }

    if (draft.submittedResult !== null) {
      return {
        type: "submitted",
        result: draft.submittedResult,
      };
    }

    const result = await this.controller.submitReview({
      orderId: draft.orderId,
      actor: draft.actor,
      targetUserId: draft.targetUserId,
      targetRole: draft.targetRole,
      rating: draft.rating,
      reasonCode: draft.reasonCode,
      source: "telegram_bot",
    });

    draft.submittedResult = result;

    return {
      type: "submitted",
      result,
    };
  }

  async handleComment(
    input: HandleTelegramBotReviewCommentInput,
  ): Promise<TelegramBotReviewFlowResult> {
    const expectedDirection = resolveDirectionForActor(input.actor);

    if (input.direction !== expectedDirection) {
      return {
        type: "ignored",
        reason: "direction_mismatch",
      };
    }

    await this.resolveContext(input.orderId, input.actor);

    const draft = this.drafts.get(buildDraftKey(input.actor.userId, input.orderId, input.direction));

    if (draft === undefined || draft.rating === null || draft.reasonCode === null) {
      return {
        type: "ignored",
        reason: "missing_draft",
      };
    }

    if (draft.submittedResult !== null) {
      return {
        type: "submitted",
        result: draft.submittedResult,
      };
    }

    const result = await this.controller.submitReview({
      orderId: draft.orderId,
      actor: draft.actor,
      targetUserId: draft.targetUserId,
      targetRole: draft.targetRole,
      rating: draft.rating,
      reasonCode: draft.reasonCode,
      comment: input.comment,
      source: "telegram_bot",
    });

    draft.submittedResult = result;

    return {
      type: "submitted",
      result,
    };
  }

  private async resolveContext(orderId: ReviewsFeedbackOrderId, actor: ReviewsFeedbackActor) {
    const order = await this.controller.getOrderById(orderId);

    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (order.status !== COMPLETED_ORDER_STATUS) {
      throw new AppError("CONFLICT", "Review flow is available only for completed orders", 409, {
        orderId,
        currentStatus: order.status,
        expectedStatus: COMPLETED_ORDER_STATUS,
      });
    }

    const actorUser = await this.controller.getUserById(actor.userId);

    this.assertReviewActor(actorUser, actor.userId);

    if (actor.role === "client") {
      if (order.clientId !== actor.userId) {
        throw new AppError("FORBIDDEN", "Client cannot open a review flow for another customer's order", 403, {
          orderId,
          actorUserId: actor.userId,
          clientId: order.clientId,
        });
      }

      if (order.courierId === null) {
        throw new AppError("FORBIDDEN", "Client review flow requires an assigned courier target", 403, {
          orderId,
        });
      }

      const direction = "client_to_courier" as const;

      return {
        actorUser,
        direction,
        targetUserId: order.courierId,
        targetRole: "courier" as const,
        draftKey: buildDraftKey(actor.userId, orderId, direction),
      };
    }

    if (order.courierId !== actor.userId) {
      throw new AppError("FORBIDDEN", "Courier cannot open a review flow for another courier's order", 403, {
        orderId,
        actorUserId: actor.userId,
        courierId: order.courierId,
      });
    }

    const direction = "courier_to_client" as const;

    return {
      actorUser,
      direction,
      targetUserId: order.clientId,
      targetRole: "client" as const,
      draftKey: buildDraftKey(actor.userId, orderId, direction),
    };
  }

  private assertReviewActor(
    actorUser: ReviewsFeedbackUserRecord | null,
    actorUserId: ReviewsFeedbackUserId,
  ): asserts actorUser is ReviewsFeedbackUserRecord {
    if (actorUser === null || !actorUser.isActive || actorUser.telegramId.length === 0) {
      throw new AppError("FORBIDDEN", "Review flow actor is unavailable for Telegram delivery", 403, {
        actorUserId,
      });
    }
  }
}
