import type {
  ReviewsFeedbackEventSelect,
  ReviewsFeedbackReviewDraftSelect,
  ReviewsFeedbackReviewSelect,
} from "./prisma-reviews-feedback.types";

export const reviewSelect: ReviewsFeedbackReviewSelect = {
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
};

export const reviewDraftSelect: ReviewsFeedbackReviewDraftSelect = {
  orderId: true,
  actorUserId: true,
  direction: true,
  actorTelegramId: true,
  targetUserId: true,
  targetRole: true,
  expectedStage: true,
  expectedRevision: true,
  rating: true,
  reasonCode: true,
  submittedReviewId: true,
  submittedRevision: true,
  submittedComment: true,
  submittedCreatedAt: true,
  expiresAt: true,
  updatedAt: true,
};

export const reviewEventSelect: ReviewsFeedbackEventSelect = {
  id: true,
  type: true,
  entity: true,
  entityId: true,
  payload: true,
  createdAt: true,
};
