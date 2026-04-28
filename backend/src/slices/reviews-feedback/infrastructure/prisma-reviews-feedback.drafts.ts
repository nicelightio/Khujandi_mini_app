import type { ReviewsFeedbackTargetRole, UpsertReviewDraftInput } from "../domain/reviews-feedback.types";
import type {
  ReviewsFeedbackReviewDraftUpdateManyArgs,
  ReviewsFeedbackReviewDraftWriteData,
} from "./prisma-reviews-feedback.types";

export const buildReviewDraftWriteData = (input: UpsertReviewDraftInput): ReviewsFeedbackReviewDraftWriteData => {
  const writableData = {
    actorTelegramId: input.actorTelegramId,
    targetUserId: input.targetUserId,
    targetRole: input.targetRole.toUpperCase() as Uppercase<ReviewsFeedbackTargetRole>,
    expectedStage: input.expectedStage,
    expectedRevision: input.expectedRevision,
    rating: input.rating,
    reasonCode: input.reasonCode,
    submittedReviewId: input.submittedReviewId,
    submittedRevision: input.submittedRevision,
    submittedComment: input.submittedComment,
    submittedCreatedAt: input.submittedCreatedAt,
    expiresAt: input.expiresAt,
  };

  return {
    create: {
      orderId: input.orderId,
      actorUserId: input.actorUserId,
      direction: input.direction,
      ...writableData,
    },
    update: writableData,
  };
};

export const buildReviewDraftKey = (input: Pick<UpsertReviewDraftInput, "orderId" | "actorUserId" | "direction">) => ({
  orderId: input.orderId,
  actorUserId: input.actorUserId,
  direction: input.direction,
});

export const buildReviewDraftCasWhere = (
  input: UpsertReviewDraftInput,
): ReviewsFeedbackReviewDraftUpdateManyArgs["where"] | null => {
  const key = buildReviewDraftKey(input);

  if (
    input.expectedStage === "rating" &&
    input.rating === null &&
    input.reasonCode === null &&
    input.submittedReviewId === null
  ) {
    return null;
  }

  if (input.expectedStage === "reason_code") {
    return {
      ...key,
      expectedStage: "rating",
      ...(input.currentExpectedRevision === undefined ? {} : { expectedRevision: input.currentExpectedRevision }),
      rating: null,
      reasonCode: null,
      submittedReviewId: null,
    };
  }

  if (input.expectedStage === "comment" && input.submittedReviewId === null) {
    return {
      ...key,
      expectedStage: "reason_code",
      ...(input.currentExpectedRevision === undefined ? {} : { expectedRevision: input.currentExpectedRevision }),
      rating: input.rating,
      reasonCode: null,
      submittedReviewId: null,
    };
  }

  return {
    ...key,
    expectedStage: "comment",
    ...(input.currentExpectedRevision === undefined ? {} : { expectedRevision: input.currentExpectedRevision }),
    rating: input.rating,
    reasonCode: input.reasonCode,
    submittedReviewId: null,
  };
};
