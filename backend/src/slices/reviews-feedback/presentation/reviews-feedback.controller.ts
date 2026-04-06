import { ReviewsFeedbackService } from "../application/reviews-feedback.service";
import type {
  ReviewsFeedbackCommandResult,
  ReviewsFeedbackDirection,
  ReviewsFeedbackOrderId,
  SubmitReviewInput,
  UpsertReviewDraftInput,
  ReviewsFeedbackUserId,
} from "../domain/reviews-feedback.types";

export class ReviewsFeedbackController {
  constructor(private readonly service: ReviewsFeedbackService) {}

  getOrderById(orderId: ReviewsFeedbackOrderId) {
    return this.service.findOrderById(orderId);
  }

  getUserById(userId: ReviewsFeedbackUserId) {
    return this.service.findUserById(userId);
  }

  getReviewsByOrderId(orderId: ReviewsFeedbackOrderId) {
    return this.service.listReviewsByOrderId(orderId);
  }

  getActiveReviewDraft(
    orderId: ReviewsFeedbackOrderId,
    actorUserId: ReviewsFeedbackUserId,
    direction: ReviewsFeedbackDirection,
    now: Date,
  ) {
    return this.service.findActiveReviewDraft(orderId, actorUserId, direction, now);
  }

  upsertReviewDraft(input: UpsertReviewDraftInput) {
    return this.service.upsertReviewDraft(input);
  }

  submitReview(input: SubmitReviewInput): Promise<ReviewsFeedbackCommandResult> {
    return this.service.submitReview(input);
  }
}
