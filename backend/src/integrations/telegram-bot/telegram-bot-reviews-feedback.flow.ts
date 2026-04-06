import { AppError } from "../../shared/errors/app-error";
import { ReviewsFeedbackController } from "../../slices/reviews-feedback/presentation/reviews-feedback.controller";
import type {
  ReviewsFeedbackActor,
  ReviewsFeedbackCommandResult,
  ReviewsFeedbackDraftStage,
  ReviewsFeedbackDirection,
  ReviewsFeedbackOrderId,
  ReviewsFeedbackTargetRole,
  ReviewsFeedbackUserId,
  ReviewsFeedbackUserRecord,
} from "../../slices/reviews-feedback/domain/reviews-feedback.types";
import {
  TelegramBotReviewsFeedbackHarness,
  type ReviewStepperStage,
} from "./telegram-bot-reviews-feedback.harness";

type ReviewFlowStage = ReviewsFeedbackDraftStage;

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
        | "stale_callback"
        | "invalid_rating"
        | "missing_draft"
        | "invalid_reason_code";
    };

type PendingReviewDraft = {
  orderId: ReviewsFeedbackOrderId;
  actorUserId: ReviewsFeedbackUserId;
  actorRole: ReviewsFeedbackActor["role"];
  actorTelegramId: string;
  direction: ReviewsFeedbackDirection;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  expectedStage: ReviewFlowStage;
  expectedRevision: string;
  rating: number | null;
  reasonCode: string | null;
  submittedReviewId: string | null;
  submittedRevision: string | null;
  submittedComment: string | null;
  submittedCreatedAt: Date | null;
  expiresAt: Date;
};

const COMPLETED_ORDER_STATUS = "COMPLETED";
const REVIEW_DRAFT_TTL_MS = 60 * 60 * 1000;

const resolveDirectionForActor = (actor: ReviewsFeedbackActor): ReviewsFeedbackDirection =>
  actor.role === "client" ? "client_to_courier" : "courier_to_client";

const buildReasonPromptRevision = (rating: number): string => `rating:${rating}`;

const buildCommentPromptRevision = (rating: number, reasonCode: string): string =>
  `rating:${rating}:reason:${reasonCode}`;

export class TelegramBotReviewsFeedbackFlow {
  constructor(
    private readonly controller: ReviewsFeedbackController,
    private readonly harness: TelegramBotReviewsFeedbackHarness,
    private readonly reasonCodes: TelegramBotReviewReasonCodes,
  ) {}

  async startFlow(input: StartTelegramBotReviewFlowInput): Promise<TelegramBotReviewFlowResult> {
    const context = await this.resolveContext(input.orderId, input.actor);

    await this.persistDraft({
      orderId: input.orderId,
      actorUserId: input.actor.userId,
      actorRole: input.actor.role,
      actorTelegramId: context.actorUser.telegramId,
      direction: context.direction,
      targetUserId: context.targetUserId,
      targetRole: context.targetRole,
      expectedStage: "rating",
      expectedRevision: input.revision,
      rating: null,
      reasonCode: null,
      submittedReviewId: null,
      submittedRevision: null,
      submittedComment: null,
      submittedCreatedAt: null,
      expiresAt: this.buildDraftExpiry(),
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

    if (payload.stage === "rating") {
      const draft = await this.getDraft(payload.orderId, input.actor.userId, payload.direction);

      if (draft === undefined) {
        return {
          type: "ignored",
          reason: "missing_draft",
        };
      }

      if (!this.matchesExpectedStep(draft, payload.stage, payload.revision)) {
        return {
          type: "ignored",
          reason: "stale_callback",
        };
      }

      const rating = Number.parseInt(payload.value, 10);

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return {
          type: "ignored",
          reason: "invalid_rating",
        };
      }

      await this.persistDraft({
        orderId: payload.orderId,
        actorUserId: input.actor.userId,
        actorRole: input.actor.role,
        actorTelegramId: context.actorUser.telegramId,
        direction: payload.direction,
        targetUserId: context.targetUserId,
        targetRole: context.targetRole,
        expectedStage: "reason_code",
        expectedRevision: buildReasonPromptRevision(rating),
        rating,
        reasonCode: null,
        submittedReviewId: null,
        submittedRevision: null,
        submittedComment: null,
        submittedCreatedAt: null,
        expiresAt: this.buildDraftExpiry(),
      });

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

    const draft = await this.getDraft(payload.orderId, input.actor.userId, payload.direction);

    if (draft === undefined || draft.rating === null) {
      return {
        type: "ignored",
        reason: "missing_draft",
      };
    }

    if (!this.matchesExpectedStep(draft, payload.stage, payload.revision)) {
      return {
        type: "ignored",
        reason: "stale_callback",
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
      draft.expectedStage = "comment";
      draft.expectedRevision = buildCommentPromptRevision(draft.rating, payload.value);
      draft.submittedReviewId = null;
      draft.submittedRevision = null;
      draft.submittedComment = null;
      draft.submittedCreatedAt = null;
      draft.expiresAt = this.buildDraftExpiry();

      await this.persistDraft(draft);

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

    const existingSubmittedResult = await this.getSubmittedResult(draft);

    if (existingSubmittedResult !== null) {
      return {
        type: "submitted",
        result: existingSubmittedResult,
      };
    }

    const result = await this.controller.submitReview({
      orderId: draft.orderId,
      actor: {
        userId: draft.actorUserId,
        role: draft.actorRole,
      },
      targetUserId: draft.targetUserId,
      targetRole: draft.targetRole,
      rating: draft.rating,
      reasonCode: draft.reasonCode,
      source: "telegram_bot",
    });

    draft.submittedReviewId = result.reviewId;
    draft.submittedRevision = result.revision;
    draft.submittedComment = result.comment;
    draft.submittedCreatedAt = result.createdAt;
    draft.expiresAt = this.buildDraftExpiry();
    await this.persistDraft(draft);

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

    const draft = await this.getDraft(input.orderId, input.actor.userId, input.direction);

    if (draft === undefined || draft.rating === null || draft.reasonCode === null) {
      return {
        type: "ignored",
        reason: "missing_draft",
      };
    }

    const existingSubmittedResult = await this.getSubmittedResult(draft);

    if (existingSubmittedResult !== null) {
      return {
        type: "submitted",
        result: existingSubmittedResult,
      };
    }

    const result = await this.controller.submitReview({
      orderId: draft.orderId,
      actor: {
        userId: draft.actorUserId,
        role: draft.actorRole,
      },
      targetUserId: draft.targetUserId,
      targetRole: draft.targetRole,
      rating: draft.rating,
      reasonCode: draft.reasonCode,
      comment: input.comment,
      source: "telegram_bot",
    });

    draft.submittedReviewId = result.reviewId;
    draft.submittedRevision = result.revision;
    draft.submittedComment = result.comment;
    draft.submittedCreatedAt = result.createdAt;
    draft.expiresAt = this.buildDraftExpiry();
    await this.persistDraft(draft);

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

  private matchesExpectedStep(
    draft: Pick<PendingReviewDraft, "expectedStage" | "expectedRevision">,
    stage: ReviewStepperStage,
    revision: string,
  ): boolean {
    const normalizedStage = stage === "skip_comment" ? "comment" : stage;

    return draft.expectedStage === normalizedStage && draft.expectedRevision === revision;
  }

  private async getDraft(
    orderId: ReviewsFeedbackOrderId,
    actorUserId: ReviewsFeedbackUserId,
    direction: ReviewsFeedbackDirection,
  ): Promise<PendingReviewDraft | undefined> {
    const draft = await this.controller.getActiveReviewDraft(orderId, actorUserId, direction, new Date());

    return draft === null
      ? undefined
      : {
          orderId: draft.orderId,
          actorUserId: draft.actorUserId,
          actorRole: direction === "client_to_courier" ? "client" : "courier",
          actorTelegramId: draft.actorTelegramId,
          direction: draft.direction,
          targetUserId: draft.targetUserId,
          targetRole: draft.targetRole,
          expectedStage: draft.expectedStage,
          expectedRevision: draft.expectedRevision,
          rating: draft.rating,
          reasonCode: draft.reasonCode,
          submittedReviewId: draft.submittedReviewId,
          submittedRevision: draft.submittedRevision,
          submittedComment: draft.submittedComment,
          submittedCreatedAt: draft.submittedCreatedAt,
          expiresAt: draft.expiresAt,
        };
  }

  private persistDraft(draft: PendingReviewDraft) {
    return this.controller.upsertReviewDraft({
      orderId: draft.orderId,
      actorUserId: draft.actorUserId,
      direction: draft.direction,
      actorTelegramId: draft.actorTelegramId,
      targetUserId: draft.targetUserId,
      targetRole: draft.targetRole,
      expectedStage: draft.expectedStage,
      expectedRevision: draft.expectedRevision,
      rating: draft.rating,
      reasonCode: draft.reasonCode,
      submittedReviewId: draft.submittedReviewId,
      submittedRevision: draft.submittedRevision,
      submittedComment: draft.submittedComment,
      submittedCreatedAt: draft.submittedCreatedAt,
      expiresAt: draft.expiresAt,
    });
  }

  private async getSubmittedResult(draft: PendingReviewDraft): Promise<ReviewsFeedbackCommandResult | null> {
    if (draft.submittedReviewId === null || draft.submittedRevision === null || draft.submittedCreatedAt === null) {
      return null;
    }

    return {
      reviewId: draft.submittedReviewId,
      orderId: draft.orderId,
      authorId: draft.actorUserId,
      targetUserId: draft.targetUserId,
      targetRole: draft.targetRole,
      rating: draft.rating ?? 0,
      reasonCode: draft.reasonCode ?? "",
      comment: draft.submittedComment,
      revision: draft.submittedRevision,
      createdAt: draft.submittedCreatedAt,
    };
  }

  private buildDraftExpiry(): Date {
    return new Date(Date.now() + REVIEW_DRAFT_TTL_MS);
  }
}
