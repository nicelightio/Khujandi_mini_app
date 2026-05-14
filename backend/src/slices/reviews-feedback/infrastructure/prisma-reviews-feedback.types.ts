import type {
  ReviewsFeedbackAdminUserRecord,
  ReviewsFeedbackOrderRecord,
  ReviewsFeedbackSource,
  ReviewsFeedbackTargetRole,
  ReviewsFeedbackReviewRecord,
  ReviewsFeedbackUserRecord,
} from "../domain/reviews-feedback.types";

export type ReviewsFeedbackOrderFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    clientId: true;
    courierId: true;
    status: true;
    updatedAt: true;
    isDeleted: true;
  };
};

export type ReviewsFeedbackUserFindUniqueArgs = {
  where: {
    id: string;
  };
  select: {
    id: true;
    telegramId: true;
    role: true;
    isActive: true;
    name: true;
  };
};

export type ReviewsFeedbackAdminFindManyArgs = {
  where: {
    role: {
      in: ["BOSS", "OPERATOR", "ADMIN"];
    };
    isActive: true;
  };
  select: {
    id: true;
    telegramId: true;
    role: true;
    isActive: true;
    name: true;
  };
};

export type ReviewsFeedbackReviewFindManyArgs = {
  where: {
    orderId: string;
  };
  orderBy: {
    createdAt: "asc";
  };
  select: ReviewsFeedbackReviewSelect;
};

export type ReviewsFeedbackReviewFindUniqueArgs = {
  where: {
    orderId_authorId_targetUserId: {
      orderId: string;
      authorId: string;
      targetUserId: string;
    };
  };
  select: ReviewsFeedbackReviewSelect;
};

export type ReviewsFeedbackReviewSelect = {
  id: true;
  orderId: true;
  authorId: true;
  targetUserId: true;
  targetRole: true;
  rating: true;
  reasonCode: true;
  comment: true;
  source: true;
  createdAt: true;
};

export type ReviewsFeedbackReviewDraftFindUniqueArgs = {
  where: {
    orderId_actorUserId_direction: {
      orderId: string;
      actorUserId: string;
      direction: string;
    };
  };
  select: ReviewsFeedbackReviewDraftSelect;
};

export type ReviewsFeedbackReviewDraftSelect = {
  orderId: true;
  actorUserId: true;
  direction: true;
  actorTelegramId: true;
  targetUserId: true;
  targetRole: true;
  expectedStage: true;
  expectedRevision: true;
  rating: true;
  reasonCode: true;
  submittedReviewId: true;
  submittedRevision: true;
  submittedComment: true;
  submittedCreatedAt: true;
  expiresAt: true;
  updatedAt: true;
};

export type ReviewsFeedbackReviewDraftUpsertArgs = {
  where: {
    orderId_actorUserId_direction: {
      orderId: string;
      actorUserId: string;
      direction: string;
    };
  };
  create: {
    orderId: string;
    actorUserId: string;
    direction: string;
    actorTelegramId: string;
    targetUserId: string;
    targetRole: Uppercase<ReviewsFeedbackTargetRole>;
    expectedStage: string;
    expectedRevision: string;
    rating: number | null;
    reasonCode: string | null;
    submittedReviewId: string | null;
    submittedRevision: string | null;
    submittedComment: string | null;
    submittedCreatedAt: Date | null;
    expiresAt: Date;
  };
  update: {
    actorTelegramId: string;
    targetUserId: string;
    targetRole: Uppercase<ReviewsFeedbackTargetRole>;
    expectedStage: string;
    expectedRevision: string;
    rating: number | null;
    reasonCode: string | null;
    submittedReviewId: string | null;
    submittedRevision: string | null;
    submittedComment: string | null;
    submittedCreatedAt: Date | null;
    expiresAt: Date;
  };
  select: ReviewsFeedbackReviewDraftSelect;
};

export type ReviewsFeedbackReviewDraftUpdateManyArgs = {
  where: {
    orderId: string;
    actorUserId: string;
    direction: string;
    expectedStage?: string;
    expectedRevision?: string;
    rating?: number | null;
    reasonCode?: string | null;
    submittedReviewId?: string | null;
  };
  data: ReviewsFeedbackReviewDraftUpsertArgs["update"];
};

export type ReviewsFeedbackBatchPayload = {
  count: number;
};

export type ReviewsFeedbackPrismaReviewDraftRecord = {
  orderId: string;
  actorUserId: string;
  direction: string;
  actorTelegramId: string;
  targetUserId: string;
  targetRole: string;
  expectedStage: string;
  expectedRevision: string;
  rating: number | null;
  reasonCode: string | null;
  submittedReviewId: string | null;
  submittedRevision: string | null;
  submittedComment: string | null;
  submittedCreatedAt: Date | null;
  expiresAt: Date;
  updatedAt: Date;
};

export type ReviewsFeedbackReviewCreateArgs = {
  data: {
    orderId: string;
    authorId: string;
    targetUserId: string;
    targetRole: Uppercase<ReviewsFeedbackTargetRole>;
    rating: number;
    reasonCode: string;
    comment: string | null;
    source: Uppercase<ReviewsFeedbackSource>;
    createdAt: Date;
  };
  select: ReviewsFeedbackReviewSelect;
};

export type ReviewsFeedbackEventCreateArgs = {
  data: {
    type: string;
    entity: string;
    entityId: string;
    payload: Record<string, unknown>;
  };
};

export type ReviewsFeedbackEventFindFirstArgs = {
  where: {
    type: string;
    entity: string;
    entityId: string;
  };
  orderBy: {
    id: "asc";
  };
  select: ReviewsFeedbackEventSelect;
};

export type ReviewsFeedbackEventSelect = {
  id: true;
  type: true;
  entity: true;
  entityId: true;
  payload: true;
  createdAt: true;
};

export type ReviewsFeedbackReviewDraftWriteData = Pick<ReviewsFeedbackReviewDraftUpsertArgs, "create" | "update">;

export type ReviewsFeedbackPrismaEventRecord = {
  id: bigint;
  type: string;
  entity: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: Date;
};

export type ReviewsFeedbackPrismaClientLike = {
  order: {
    findUnique(args: ReviewsFeedbackOrderFindUniqueArgs): Promise<ReviewsFeedbackOrderRecord | null>;
  };
  user: {
    findUnique(args: ReviewsFeedbackUserFindUniqueArgs): Promise<ReviewsFeedbackUserRecord | null>;
    findMany(args: ReviewsFeedbackAdminFindManyArgs): Promise<ReviewsFeedbackAdminUserRecord[]>;
  };
  review: {
    findMany(args: ReviewsFeedbackReviewFindManyArgs): Promise<ReviewsFeedbackReviewRecord[]>;
    findUnique(args: ReviewsFeedbackReviewFindUniqueArgs): Promise<ReviewsFeedbackReviewRecord | null>;
    create(args: ReviewsFeedbackReviewCreateArgs): Promise<ReviewsFeedbackReviewRecord>;
  };
  reviewDraft: {
    findUnique(
      args: ReviewsFeedbackReviewDraftFindUniqueArgs,
    ): Promise<ReviewsFeedbackPrismaReviewDraftRecord | null>;
    updateMany(args: ReviewsFeedbackReviewDraftUpdateManyArgs): Promise<ReviewsFeedbackBatchPayload>;
    upsert(args: ReviewsFeedbackReviewDraftUpsertArgs): Promise<ReviewsFeedbackPrismaReviewDraftRecord>;
  };
  event: {
    create(args: ReviewsFeedbackEventCreateArgs): Promise<ReviewsFeedbackPrismaEventRecord>;
    findFirst?(args: ReviewsFeedbackEventFindFirstArgs): Promise<ReviewsFeedbackPrismaEventRecord | null>;
  };
};

export type ReviewsFeedbackPrismaTransactionalClientLike = ReviewsFeedbackPrismaClientLike & {
  $transaction<T>(callback: (client: ReviewsFeedbackPrismaClientLike) => Promise<T>): Promise<T>;
};

export type ReviewsFeedbackPrismaProvider = {
  readonly client: ReviewsFeedbackPrismaTransactionalClientLike;
};

export const isPrismaUniqueConstraintError = (error: unknown): error is { code: string } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as { code?: unknown }).code === "string" &&
  (error as { code: string }).code === "P2002";
