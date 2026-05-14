export type ReviewsFeedbackOrderId = string;
export type ReviewsFeedbackUserId = string;
export type ReviewsFeedbackRevision = string;

export type ReviewsFeedbackUserRole =
  | "boss"
  | "operator"
  | "admin"
  | "seller"
  | "courier"
  | "client";

export type ReviewsFeedbackOrderStatus =
  | "CREATED"
  | "DELAYED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type ReviewsFeedbackTargetRole = "client" | "courier";
export type ReviewsFeedbackSource = "mini_app" | "telegram_bot";
export type ReviewsFeedbackDirection = "client_to_courier" | "courier_to_client";
export type ReviewsFeedbackDraftStage = "rating" | "reason_code" | "comment";

export type ReviewsFeedbackOrderRecord = {
  id: ReviewsFeedbackOrderId;
  clientId: ReviewsFeedbackUserId;
  courierId: ReviewsFeedbackUserId | null;
  status: ReviewsFeedbackOrderStatus;
  updatedAt: Date;
  isDeleted: boolean;
};

export type ReviewsFeedbackUserRecord = {
  id: ReviewsFeedbackUserId;
  telegramId: string;
  role: ReviewsFeedbackUserRole;
  isActive: boolean;
  name: string;
};

export type ReviewsFeedbackAdminUserRecord = {
  id: ReviewsFeedbackUserId;
  telegramId: string;
  role: Extract<ReviewsFeedbackUserRole, "boss" | "operator" | "admin">;
  isActive: boolean;
  name: string;
};

export type ReviewsFeedbackReviewRecord = {
  id: bigint;
  orderId: ReviewsFeedbackOrderId;
  authorId: ReviewsFeedbackUserId;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  rating: number;
  reasonCode: string;
  comment: string | null;
  source: ReviewsFeedbackSource;
  createdAt: Date;
};

export type ReviewsFeedbackCourierAverageClientReviewRatingMetric = {
  courierUserId: ReviewsFeedbackUserId;
  averageRating: number | null;
  reviewCount: number;
};

export type ReviewsFeedbackCourierClientProblemReviewMetric = {
  courierUserId: ReviewsFeedbackUserId;
  orderId: ReviewsFeedbackOrderId;
  rating: number;
  createdAt: Date;
};

export type ReviewsFeedbackActor = {
  userId: ReviewsFeedbackUserId;
  role: Extract<ReviewsFeedbackUserRole, "client" | "courier">;
};

export type ReviewsFeedbackFlowContext = {
  actorTelegramId: string;
  direction: ReviewsFeedbackDirection;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
};

export type SubmitReviewInput = {
  orderId: ReviewsFeedbackOrderId;
  actor: ReviewsFeedbackActor | null;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  rating: number;
  reasonCode: string;
  comment?: string;
  source: ReviewsFeedbackSource;
};

export type PersistReviewInput = {
  orderId: ReviewsFeedbackOrderId;
  authorId: ReviewsFeedbackUserId;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  rating: number;
  reasonCode: string;
  comment: string | null;
  source: ReviewsFeedbackSource;
  createdAt: Date;
  publishNegativeEvent: boolean;
};

export type CreateReviewCreatedEventInput = {
  type: "review.created";
  entity: "review";
  entityId: string;
  payload: {
    reviewId: string;
    orderId: ReviewsFeedbackOrderId;
    authorId: ReviewsFeedbackUserId;
    targetUserId: ReviewsFeedbackUserId;
    targetRole: ReviewsFeedbackTargetRole;
    rating: number;
    reasonCode: string;
    comment: string | null;
    source: ReviewsFeedbackSource;
    createdAt: string;
  };
};

export type CreateNegativeReviewEventInput = {
  type: "review.negative";
  entity: "review";
  entityId: string;
  payload: {
    reviewId: string;
    orderId: ReviewsFeedbackOrderId;
    authorId: ReviewsFeedbackUserId;
    targetUserId: ReviewsFeedbackUserId;
    targetRole: ReviewsFeedbackTargetRole;
    rating: number;
    reasonCode: string;
    comment: string | null;
    source: ReviewsFeedbackSource;
    createdAt: string;
  };
};

export type ReviewsFeedbackEventRecord =
  | (CreateReviewCreatedEventInput & { id: bigint; createdAt: Date })
  | (CreateNegativeReviewEventInput & { id: bigint; createdAt: Date });

export type ReviewsFeedbackArtifactsRecord = {
  review: ReviewsFeedbackReviewRecord;
  events: ReviewsFeedbackEventRecord[];
  revision: ReviewsFeedbackRevision;
  createdReview: boolean;
};

export type ReviewsFeedbackCommandResult = {
  reviewId: string;
  orderId: ReviewsFeedbackOrderId;
  authorId: ReviewsFeedbackUserId;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  rating: number;
  reasonCode: string;
  comment: string | null;
  revision: ReviewsFeedbackRevision;
  createdAt: Date;
};

export type ReviewsFeedbackReviewDraftRecord = {
  orderId: ReviewsFeedbackOrderId;
  actorUserId: ReviewsFeedbackUserId;
  direction: ReviewsFeedbackDirection;
  actorTelegramId: string;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  expectedStage: ReviewsFeedbackDraftStage;
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

export type UpsertReviewDraftInput = {
  orderId: ReviewsFeedbackOrderId;
  actorUserId: ReviewsFeedbackUserId;
  direction: ReviewsFeedbackDirection;
  currentExpectedRevision?: string;
  actorTelegramId: string;
  targetUserId: ReviewsFeedbackUserId;
  targetRole: ReviewsFeedbackTargetRole;
  expectedStage: ReviewsFeedbackDraftStage;
  expectedRevision: string;
  rating: number | null;
  reasonCode: string | null;
  submittedReviewId: string | null;
  submittedRevision: string | null;
  submittedComment: string | null;
  submittedCreatedAt: Date | null;
  expiresAt: Date;
};

export type ReviewsFeedbackNegativeAlertNotificationInput = {
  adminTelegramIds: string[];
  orderId: ReviewsFeedbackOrderId;
  reviewId: string;
  direction: ReviewsFeedbackDirection;
  rating: number;
  reasonCode: string;
};

export interface ReviewsFeedbackNotifier {
  notifyNegativeReview(input: ReviewsFeedbackNegativeAlertNotificationInput): Promise<void>;
}

export interface ReviewsFeedbackRepository {
  findOrderById(orderId: ReviewsFeedbackOrderId): Promise<ReviewsFeedbackOrderRecord | null>;
  findUserById(userId: ReviewsFeedbackUserId): Promise<ReviewsFeedbackUserRecord | null>;
  listActiveAdminUsers(): Promise<ReviewsFeedbackAdminUserRecord[]>;
  listReviewsByOrderId(orderId: ReviewsFeedbackOrderId): Promise<ReviewsFeedbackReviewRecord[]>;
  findActiveReviewDraft(
    orderId: ReviewsFeedbackOrderId,
    actorUserId: ReviewsFeedbackUserId,
    direction: ReviewsFeedbackDirection,
    now: Date,
  ): Promise<ReviewsFeedbackReviewDraftRecord | null>;
  upsertReviewDraft(input: UpsertReviewDraftInput): Promise<ReviewsFeedbackReviewDraftRecord>;
  findReviewByUniquePair(
    orderId: ReviewsFeedbackOrderId,
    authorId: ReviewsFeedbackUserId,
    targetUserId: ReviewsFeedbackUserId,
  ): Promise<ReviewsFeedbackReviewRecord | null>;
  findReviewCreatedEvent(review: ReviewsFeedbackReviewRecord): Promise<ReviewsFeedbackEventRecord | null>;
  findReviewNegativeEvent(review: ReviewsFeedbackReviewRecord): Promise<ReviewsFeedbackEventRecord | null>;
  persistReview(input: PersistReviewInput): Promise<ReviewsFeedbackArtifactsRecord>;
}
