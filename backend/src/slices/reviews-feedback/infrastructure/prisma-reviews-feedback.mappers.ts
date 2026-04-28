import type {
  ReviewsFeedbackAdminUserRecord,
  ReviewsFeedbackDirection,
  ReviewsFeedbackDraftStage,
  ReviewsFeedbackOrderStatus,
  ReviewsFeedbackReviewDraftRecord,
  ReviewsFeedbackReviewRecord,
  ReviewsFeedbackSource,
  ReviewsFeedbackTargetRole,
  ReviewsFeedbackUserRole,
} from "../domain/reviews-feedback.types";
import type { ReviewsFeedbackPrismaReviewDraftRecord } from "./prisma-reviews-feedback.types";

export const mapOrderStatus = (status: string): ReviewsFeedbackOrderStatus =>
  status as ReviewsFeedbackOrderStatus;

export const mapUserRole = (role: string): ReviewsFeedbackUserRole => role.toLowerCase() as ReviewsFeedbackUserRole;

export const mapAdminUserRole = (
  role: string,
): ReviewsFeedbackAdminUserRecord["role"] => role.toLowerCase() as ReviewsFeedbackAdminUserRecord["role"];

export const mapTargetRole = (role: string): ReviewsFeedbackTargetRole =>
  role.toLowerCase() as ReviewsFeedbackTargetRole;

export const mapSource = (source: string): ReviewsFeedbackSource => source.toLowerCase() as ReviewsFeedbackSource;

export const mapDirection = (direction: string): ReviewsFeedbackDirection =>
  direction as ReviewsFeedbackDirection;

export const mapDraftStage = (stage: string): ReviewsFeedbackDraftStage => stage as ReviewsFeedbackDraftStage;

export const mapReviewRecord = (review: ReviewsFeedbackReviewRecord): ReviewsFeedbackReviewRecord => ({
  ...review,
  targetRole: mapTargetRole(review.targetRole),
  source: mapSource(review.source),
});

export const mapReviewDraftRecord = (
  draft: ReviewsFeedbackPrismaReviewDraftRecord,
): ReviewsFeedbackReviewDraftRecord => ({
  ...draft,
  direction: mapDirection(draft.direction),
  expectedStage: mapDraftStage(draft.expectedStage),
  targetRole: mapTargetRole(draft.targetRole),
});
