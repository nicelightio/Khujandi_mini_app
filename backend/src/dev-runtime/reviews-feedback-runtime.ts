import type { CheckoutPaymentRuntimeState } from "./checkout-payment-runtime";
import type { CheckoutPaymentUserRecord } from "../slices/checkout-payment/domain/checkout-payment.types";
import type {
  ReviewsFeedbackPrismaEventRecord,
  ReviewsFeedbackPrismaProvider,
  ReviewsFeedbackPrismaReviewDraftRecord,
} from "../slices/reviews-feedback/infrastructure/prisma-reviews-feedback.types";
import type {
  ReviewsFeedbackActor,
  ReviewsFeedbackAdminUserRecord,
  ReviewsFeedbackDirection,
  ReviewsFeedbackReviewRecord,
  ReviewsFeedbackSource,
  ReviewsFeedbackTargetRole,
  ReviewsFeedbackUserRecord,
} from "../slices/reviews-feedback/domain/reviews-feedback.types";

type RuntimeReviewsFeedbackState = {
  reviews: ReviewsFeedbackReviewRecord[];
  reviewDrafts: ReviewsFeedbackPrismaReviewDraftRecord[];
  events: ReviewsFeedbackPrismaEventRecord[];
  nextReviewId: bigint;
  nextEventId: bigint;
};

const cloneDate = (value: Date | null): Date | null => (value === null ? null : new Date(value));

const toReviewActor = (user: CheckoutPaymentUserRecord): ReviewsFeedbackActor | null => {
  if (user.role !== "client" && user.role !== "courier") {
    return null;
  }

  return {
    userId: user.id,
    role: user.role,
  };
};

export const createInMemoryReviewsFeedbackPrisma = (
  checkoutPaymentState: CheckoutPaymentRuntimeState,
  options: { now?: () => Date } = {},
) => {
  const nowFactory = options.now ?? (() => new Date());
  const state: RuntimeReviewsFeedbackState = {
    reviews: [],
    reviewDrafts: [],
    events: [],
    nextReviewId: BigInt(1),
    nextEventId: BigInt(1),
  };

  const findUserByTelegramId = (telegramId: string): ReviewsFeedbackActor | null => {
    const user = checkoutPaymentState.users.find(
      (candidate) => candidate.telegramId === telegramId && candidate.isActive,
    );

    return user === undefined ? null : toReviewActor(user);
  };

  const findActiveCommentDraftByActor = (
    actor: ReviewsFeedbackActor,
    now = nowFactory(),
  ): { orderId: string; direction: ReviewsFeedbackDirection } | null => {
    const draft = state.reviewDrafts.find(
      (candidate) =>
        candidate.actorUserId === actor.userId &&
        candidate.expectedStage === "comment" &&
        candidate.expiresAt.getTime() > now.getTime() &&
        candidate.submittedReviewId === null,
    );

    if (draft === undefined) {
      return null;
    }

    return {
      orderId: draft.orderId,
      direction: draft.direction as ReviewsFeedbackDirection,
    };
  };

  const client: ReviewsFeedbackPrismaProvider["client"] = {
    order: {
      findUnique: async ({ where }) => {
        const order = checkoutPaymentState.orders.find((candidate) => candidate.id === where.id);

        return order === undefined
          ? null
          : {
              id: order.id,
              clientId: order.clientId,
              courierId: order.courierId,
              status: order.status,
              updatedAt: nowFactory(),
              isDeleted: order.isDeleted,
            };
      },
    },
    user: {
      findUnique: async ({ where }) => {
        const user = checkoutPaymentState.users.find((candidate) => candidate.id === where.id);

        return user === undefined
          ? null
          : {
              id: user.id,
              telegramId: user.telegramId,
              role: user.role as ReviewsFeedbackUserRecord["role"],
              isActive: user.isActive,
              name: user.name,
            };
      },
      findMany: async ({ where }) =>
        checkoutPaymentState.users
          .filter(
            (user) =>
              user.isActive === where.isActive &&
              where.role.in.map((role) => role.toLowerCase()).includes(user.role),
          )
          .map((user): ReviewsFeedbackAdminUserRecord => ({
            id: user.id,
            telegramId: user.telegramId,
            role: user.role as ReviewsFeedbackAdminUserRecord["role"],
            isActive: user.isActive,
            name: user.name,
          })),
    },
    review: {
      findMany: async ({ where }) =>
        state.reviews
          .filter((review) => review.orderId === where.orderId)
          .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
          .map((review) => ({ ...review, createdAt: new Date(review.createdAt) })),
      findUnique: async ({ where }) => {
        const key = where.orderId_authorId_targetUserId;
        const review = state.reviews.find(
          (candidate) =>
            candidate.orderId === key.orderId &&
            candidate.authorId === key.authorId &&
            candidate.targetUserId === key.targetUserId,
        );

        return review === undefined ? null : { ...review, createdAt: new Date(review.createdAt) };
      },
      create: async ({ data }) => {
        if (
          state.reviews.some(
            (review) =>
              review.orderId === data.orderId &&
              review.authorId === data.authorId &&
              review.targetUserId === data.targetUserId,
          )
        ) {
          throw { code: "P2002" };
        }

        const review: ReviewsFeedbackReviewRecord = {
          id: state.nextReviewId++,
          orderId: data.orderId,
          authorId: data.authorId,
          targetUserId: data.targetUserId,
          targetRole: data.targetRole.toLowerCase() as ReviewsFeedbackTargetRole,
          rating: data.rating,
          reasonCode: data.reasonCode,
          comment: data.comment,
          source: data.source.toLowerCase() as ReviewsFeedbackSource,
          createdAt: new Date(data.createdAt),
        };
        state.reviews.push(review);
        return { ...review, createdAt: new Date(review.createdAt) };
      },
    },
    reviewDraft: {
      findUnique: async ({ where }) => {
        const key = where.orderId_actorUserId_direction;
        const draft = state.reviewDrafts.find(
          (candidate) =>
            candidate.orderId === key.orderId &&
            candidate.actorUserId === key.actorUserId &&
            candidate.direction === key.direction,
        );

        return draft === undefined
          ? null
          : {
              ...draft,
              submittedCreatedAt: cloneDate(draft.submittedCreatedAt),
              expiresAt: new Date(draft.expiresAt),
              updatedAt: new Date(draft.updatedAt),
            };
      },
      updateMany: async ({ where, data }) => {
        const draft = state.reviewDrafts.find(
          (candidate) =>
            candidate.orderId === where.orderId &&
            candidate.actorUserId === where.actorUserId &&
            candidate.direction === where.direction &&
            (where.expectedStage === undefined || candidate.expectedStage === where.expectedStage) &&
            (where.expectedRevision === undefined || candidate.expectedRevision === where.expectedRevision) &&
            (where.rating === undefined || candidate.rating === where.rating) &&
            (where.reasonCode === undefined || candidate.reasonCode === where.reasonCode) &&
            (where.submittedReviewId === undefined || candidate.submittedReviewId === where.submittedReviewId),
        );

        if (draft === undefined) {
          return { count: 0 };
        }

        Object.assign(draft, {
          ...data,
          submittedCreatedAt: cloneDate(data.submittedCreatedAt),
          expiresAt: new Date(data.expiresAt),
          updatedAt: nowFactory(),
        });
        return { count: 1 };
      },
      upsert: async ({ where, create, update }) => {
        const key = where.orderId_actorUserId_direction;
        const existing = state.reviewDrafts.find(
          (candidate) =>
            candidate.orderId === key.orderId &&
            candidate.actorUserId === key.actorUserId &&
            candidate.direction === key.direction,
        );

        if (existing !== undefined) {
          Object.assign(existing, {
            ...update,
            submittedCreatedAt: cloneDate(update.submittedCreatedAt),
            expiresAt: new Date(update.expiresAt),
            updatedAt: nowFactory(),
          });
          return { ...existing };
        }

        const draft: ReviewsFeedbackPrismaReviewDraftRecord = {
          ...create,
          submittedCreatedAt: cloneDate(create.submittedCreatedAt),
          expiresAt: new Date(create.expiresAt),
          updatedAt: nowFactory(),
        };
        state.reviewDrafts.push(draft);
        return { ...draft };
      },
    },
    event: {
      create: async ({ data }) => {
        const event: ReviewsFeedbackPrismaEventRecord = {
          id: state.nextEventId++,
          type: data.type,
          entity: data.entity,
          entityId: data.entityId,
          payload: data.payload,
          createdAt: nowFactory(),
        };
        state.events.push(event);
        return { ...event, createdAt: new Date(event.createdAt) };
      },
      findFirst: async ({ where }) => {
        const event = state.events.find(
          (candidate) =>
            candidate.type === where.type && candidate.entity === where.entity && candidate.entityId === where.entityId,
        );

        return event === undefined ? null : { ...event, createdAt: new Date(event.createdAt) };
      },
    },
    $transaction: async (callback) => callback(client),
  };

  return {
    prisma: { client },
    state,
    findUserByTelegramId,
    findActiveCommentDraftByActor,
  };
};
