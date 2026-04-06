import { ReviewsFeedbackService } from "../application/reviews-feedback.service";
import type {
  ReviewsFeedbackCommandResult,
  ReviewsFeedbackOrderId,
  SubmitReviewInput,
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

  submitReview(input: SubmitReviewInput): Promise<ReviewsFeedbackCommandResult> {
    return this.service.submitReview(input);
  }
}
