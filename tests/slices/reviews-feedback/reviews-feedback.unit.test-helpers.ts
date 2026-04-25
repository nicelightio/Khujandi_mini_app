import type { ReviewsFeedbackService } from "../../../backend/src/slices/reviews-feedback/application/reviews-feedback.service";
import type {
  ReviewsFeedbackFlowContext,
  ReviewsFeedbackRepository,
  ReviewsFeedbackReviewDraftRecord,
  UpsertReviewDraftInput,
} from "../../../backend/src/slices/reviews-feedback/domain/reviews-feedback.types";

export const reviewReasons = {
  client_to_courier: ["ON_TIME", "RUDE"],
  courier_to_client: ["RESPONSIVE", "LATE_RESPONSE"],
};

export const createRepository = (): ReviewsFeedbackRepository => ({
  findOrderById: async () => null,
  findUserById: async () => null,
  listActiveAdminUsers: async () => [],
  listReviewsByOrderId: async () => [],
  findActiveReviewDraft: async () => null,
  upsertReviewDraft: async (input) => ({
    orderId: input.orderId,
    actorUserId: input.actorUserId,
    direction: input.direction,
    actorTelegramId: input.actorTelegramId,
    targetUserId: input.targetUserId,
    targetRole: input.targetRole,
    expectedStage: input.expectedStage,
    expectedRevision: input.expectedRevision,
    rating: input.rating,
    reasonCode: input.reasonCode,
    submittedReviewId: input.submittedReviewId,
    submittedRevision: input.submittedRevision,
    submittedComment: input.submittedComment,
    submittedCreatedAt: input.submittedCreatedAt,
    expiresAt: input.expiresAt,
    updatedAt: new Date("2026-04-06T10:00:00.000Z"),
  }),
  findReviewByUniquePair: async () => null,
  persistReview: async () => ({
    review: {
      id: 11n,
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      source: "telegram_bot",
      createdAt: new Date("2026-04-05T09:00:00.000Z"),
    },
    events: [
      {
        id: 12n,
        type: "review.created",
        entity: "review",
        entityId: "11",
        payload: {
          reviewId: "11",
          orderId: "order-1",
          authorId: "client-1",
          targetUserId: "courier-1",
          targetRole: "courier",
          rating: 5,
          reasonCode: "ON_TIME",
          comment: null,
          source: "telegram_bot",
          createdAt: "2026-04-05T09:00:00.000Z",
        },
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      },
    ],
    revision: "12",
  }),
});

export const createFlowService = (input: {
  resolveReviewFlowContext: jest.Mock<Promise<ReviewsFeedbackFlowContext>, [string, { userId: string; role: "client" | "courier" }]>;
  submitReview: jest.Mock;
}): ReviewsFeedbackService => {
  const drafts = new Map<string, ReviewsFeedbackReviewDraftRecord>();
  const submittedReviews = new Map<string, Awaited<ReturnType<typeof input.submitReview>>>();
  const buildKey = (orderId: string, actorUserId: string, direction: string): string =>
    `${orderId}:${actorUserId}:${direction}`;
  const getReviewsByOrderId = jest.fn(async (orderId: string) => {
    return [...submittedReviews.values()]
      .filter((review) => review.orderId === orderId)
      .map((review) => ({
        id: BigInt(review.reviewId),
        orderId: review.orderId,
        authorId: review.authorId,
        targetUserId: review.targetUserId,
        targetRole: review.targetRole,
        rating: review.rating,
        reasonCode: review.reasonCode,
        comment: review.comment,
        source: "telegram_bot" as const,
        createdAt: review.createdAt,
      }));
  });
  const submitReview = jest.fn(async (payload) => {
    const result = await input.submitReview(payload);

    submittedReviews.set(result.reviewId, result);

    return result;
  });

  return {
    resolveReviewFlowContext: input.resolveReviewFlowContext,
    listReviewsByOrderId: getReviewsByOrderId,
    findActiveReviewDraft: jest.fn(async (orderId, actorUserId, direction, now) => {
      const draft = drafts.get(buildKey(orderId, actorUserId, direction)) ?? null;

      if (draft === null || draft.expiresAt.getTime() <= now.getTime()) {
        return null;
      }

      return draft;
    }),
    upsertReviewDraft: jest.fn(async (draft: UpsertReviewDraftInput) => {
      const nextDraft: ReviewsFeedbackReviewDraftRecord = {
        ...draft,
        updatedAt: new Date("2026-04-06T10:00:00.000Z"),
      };

      drafts.set(buildKey(draft.orderId, draft.actorUserId, draft.direction), nextDraft);

      return nextDraft;
    }),
    submitReview,
  } as unknown as ReviewsFeedbackService;
};
