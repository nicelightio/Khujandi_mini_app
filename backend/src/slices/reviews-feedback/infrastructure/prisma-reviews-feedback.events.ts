import type {
  CreateReviewCreatedEventInput,
  ReviewsFeedbackEventRecord,
  ReviewsFeedbackReviewRecord,
} from "../domain/reviews-feedback.types";
import { mapSource, mapTargetRole } from "./prisma-reviews-feedback.mappers";
import type { ReviewsFeedbackPrismaEventRecord } from "./prisma-reviews-feedback.types";

export const buildReviewEventPayload = (
  review: ReviewsFeedbackReviewRecord,
): CreateReviewCreatedEventInput["payload"] => ({
  reviewId: review.id.toString(),
  orderId: review.orderId,
  authorId: review.authorId,
  targetUserId: review.targetUserId,
  targetRole: mapTargetRole(review.targetRole),
  rating: review.rating,
  reasonCode: review.reasonCode,
  comment: review.comment,
  source: mapSource(review.source),
  createdAt: review.createdAt.toISOString(),
});

export const mapReviewEventRecord = (
  event: ReviewsFeedbackPrismaEventRecord,
  review: ReviewsFeedbackReviewRecord,
  type: "review.created" | "review.negative",
): ReviewsFeedbackEventRecord => ({
  id: event.id,
  type,
  entity: "review",
  entityId: event.entityId,
  payload: buildReviewEventPayload(review),
  createdAt: event.createdAt,
});
