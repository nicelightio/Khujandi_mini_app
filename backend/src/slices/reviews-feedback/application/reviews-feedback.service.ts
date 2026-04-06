import type {
  ReviewsFeedbackCommandResult,
  ReviewsFeedbackDirection,
  ReviewsFeedbackReviewDraftRecord,
  ReviewsFeedbackNotifier,
  ReviewsFeedbackOrderRecord,
  ReviewsFeedbackOrderId,
  ReviewsFeedbackRepository,
  ReviewsFeedbackReviewRecord,
  SubmitReviewInput,
  UpsertReviewDraftInput,
  ReviewsFeedbackUserId,
} from "../domain/reviews-feedback.types";
import { AppError } from "../../../shared/errors/app-error";

const COMPLETED_ORDER_STATUS = "COMPLETED";
const NEGATIVE_REVIEW_RATING_THRESHOLD = 2;

const NOOP_REVIEWS_FEEDBACK_NOTIFIER: ReviewsFeedbackNotifier = {
  async notifyNegativeReview() {
    return undefined;
  },
};

const resolveDirection = (
  actorRole: SubmitReviewInput["actor"] extends infer T
    ? T extends { role: infer R }
      ? R
      : never
    : never,
  targetRole: SubmitReviewInput["targetRole"],
): ReviewsFeedbackDirection => {
  if (actorRole === "client" && targetRole === "courier") {
    return "client_to_courier";
  }

  if (actorRole === "courier" && targetRole === "client") {
    return "courier_to_client";
  }

  throw new AppError("FORBIDDEN", "Actor cannot submit a review for the requested direction", 403, {
    actorRole,
    targetRole,
  });
};

const toCommandResult = (
  review: ReviewsFeedbackReviewRecord,
  revision: string,
): ReviewsFeedbackCommandResult => ({
  reviewId: review.id.toString(),
  orderId: review.orderId,
  authorId: review.authorId,
  targetUserId: review.targetUserId,
  targetRole: review.targetRole,
  rating: review.rating,
  reasonCode: review.reasonCode,
  comment: review.comment,
  revision,
  createdAt: review.createdAt,
});

export class ReviewsFeedbackService {
  constructor(
    private readonly repository: ReviewsFeedbackRepository,
    private readonly notifier: ReviewsFeedbackNotifier = NOOP_REVIEWS_FEEDBACK_NOTIFIER,
  ) {}

  findOrderById(orderId: ReviewsFeedbackOrderId) {
    return this.repository.findOrderById(orderId);
  }

  findUserById(userId: ReviewsFeedbackUserId) {
    return this.repository.findUserById(userId);
  }

  listReviewsByOrderId(orderId: ReviewsFeedbackOrderId) {
    return this.repository.listReviewsByOrderId(orderId);
  }

  findActiveReviewDraft(
    orderId: ReviewsFeedbackOrderId,
    actorUserId: ReviewsFeedbackUserId,
    direction: ReviewsFeedbackDirection,
    now: Date,
  ): Promise<ReviewsFeedbackReviewDraftRecord | null> {
    return this.repository.findActiveReviewDraft(orderId, actorUserId, direction, now);
  }

  upsertReviewDraft(input: UpsertReviewDraftInput): Promise<ReviewsFeedbackReviewDraftRecord> {
    return this.repository.upsertReviewDraft(input);
  }

  async submitReview(input: SubmitReviewInput): Promise<ReviewsFeedbackCommandResult> {
    const actor = input.actor;

    if (actor === null) {
      throw new AppError("AUTH_REQUIRED", "Review submission requires an authenticated actor", 401);
    }

    const direction = resolveDirection(actor.role, input.targetRole);
    const order = await this.repository.findOrderById(input.orderId);

    this.assertReviewableOrder(order, input.orderId);

    const rating = Number.isInteger(input.rating) ? input.rating : Number.NaN;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError("VALIDATION_ERROR", "Review rating must be an integer between 1 and 5", 400, {
        field: "rating",
      });
    }

    const reasonCode = input.reasonCode.trim();

    if (reasonCode.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Review reason_code is required", 400, {
        field: "reasonCode",
      });
    }

    const comment = input.comment?.trim();
    const normalizedComment = comment === undefined || comment.length === 0 ? null : comment;
    const ownership = this.resolveOwnership(order, direction, actor.userId, input.targetUserId);

    const existingReview = await this.repository.findReviewByUniquePair(
      input.orderId,
      actor.userId,
      input.targetUserId,
    );

    if (existingReview !== null) {
      return toCommandResult(existingReview, existingReview.id.toString());
    }

    const artifacts = await this.repository.persistReview({
      orderId: input.orderId,
      authorId: actor.userId,
      targetUserId: ownership.targetUserId,
      targetRole: ownership.targetRole,
      rating,
      reasonCode,
      comment: normalizedComment,
      source: input.source,
      createdAt: new Date(),
      publishNegativeEvent: rating <= NEGATIVE_REVIEW_RATING_THRESHOLD,
    });

    const negativeReviewEvent = artifacts.events.find((event) => event.type === "review.negative");

    if (negativeReviewEvent !== undefined) {
      const activeAdmins = await this.repository.listActiveAdminUsers();

      try {
        await this.notifier.notifyNegativeReview({
          adminTelegramIds: activeAdmins.map((admin) => admin.telegramId),
          orderId: artifacts.review.orderId,
          reviewId: artifacts.review.id.toString(),
          direction,
          rating: artifacts.review.rating,
          reasonCode: artifacts.review.reasonCode,
        });
      } catch {
        // Transport outages must not roll back the committed negative-review semantics.
      }
    }

    return toCommandResult(artifacts.review, artifacts.revision);
  }

  private assertReviewableOrder(
    order: ReviewsFeedbackOrderRecord | null,
    orderId: ReviewsFeedbackOrderId,
  ): asserts order is ReviewsFeedbackOrderRecord {
    if (order === null || order.isDeleted) {
      throw new AppError("ORDER_NOT_FOUND", "Order was not found", 404, {
        orderId,
      });
    }

    if (order.status !== COMPLETED_ORDER_STATUS) {
      throw new AppError("CONFLICT", "Review submission is available only for completed orders", 409, {
        orderId,
        currentStatus: order.status,
        expectedStatus: COMPLETED_ORDER_STATUS,
      });
    }
  }

  private resolveOwnership(
    order: ReviewsFeedbackOrderRecord,
    direction: ReviewsFeedbackDirection,
    actorUserId: ReviewsFeedbackUserId,
    targetUserId: ReviewsFeedbackUserId,
  ) {
    if (direction === "client_to_courier") {
      if (order.clientId !== actorUserId) {
        throw new AppError("FORBIDDEN", "Client cannot submit a review for another customer's order", 403, {
          orderId: order.id,
          actorUserId,
          clientId: order.clientId,
        });
      }

      if (order.courierId === null || order.courierId !== targetUserId) {
        throw new AppError("FORBIDDEN", "Client review target must match the completed order courier", 403, {
          orderId: order.id,
          targetUserId,
          courierId: order.courierId,
        });
      }

      return {
        targetRole: "courier" as const,
        targetUserId: order.courierId,
      };
    }

    if (order.courierId !== actorUserId) {
      throw new AppError("FORBIDDEN", "Courier cannot submit a review for another courier's order", 403, {
        orderId: order.id,
        actorUserId,
        courierId: order.courierId,
      });
    }

    if (order.clientId !== targetUserId) {
      throw new AppError("FORBIDDEN", "Courier review target must match the completed order client", 403, {
        orderId: order.id,
        targetUserId,
        clientId: order.clientId,
      });
    }

    return {
      targetRole: "client" as const,
      targetUserId: order.clientId,
    };
  }
}
