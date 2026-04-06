import type {
  ReviewsFeedbackAdminUserRecord,
  PersistReviewInput,
  ReviewsFeedbackArtifactsRecord,
  ReviewsFeedbackEventRecord,
  ReviewsFeedbackOrderRecord,
  ReviewsFeedbackOrderStatus,
  ReviewsFeedbackRepository,
  ReviewsFeedbackReviewRecord,
  ReviewsFeedbackSource,
  ReviewsFeedbackTargetRole,
  ReviewsFeedbackUserRecord,
  ReviewsFeedbackUserRole,
} from "../domain/reviews-feedback.types";

type ReviewsFeedbackOrderFindUniqueArgs = {
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

type ReviewsFeedbackUserFindUniqueArgs = {
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

type ReviewsFeedbackAdminFindManyArgs = {
  where: {
    role: {
      in: ["BOSS", "MANAGER", "ADMIN"];
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

type ReviewsFeedbackReviewFindManyArgs = {
  where: {
    orderId: string;
  };
  orderBy: {
    createdAt: "asc";
  };
  select: {
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
};

type ReviewsFeedbackReviewFindUniqueArgs = {
  where: {
    orderId_authorId_targetUserId: {
      orderId: string;
      authorId: string;
      targetUserId: string;
    };
  };
  select: {
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
};

type ReviewsFeedbackReviewCreateArgs = {
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
  select: {
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
};

type ReviewsFeedbackEventCreateArgs = {
  data: {
    type: string;
    entity: string;
    entityId: string;
    payload: Record<string, unknown>;
  };
};

type ReviewsFeedbackPrismaEventRecord = {
  id: bigint;
  type: string;
  entity: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: Date;
};

type ReviewsFeedbackPrismaClientLike = {
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
  event: {
    create(args: ReviewsFeedbackEventCreateArgs): Promise<ReviewsFeedbackPrismaEventRecord>;
  };
};

type ReviewsFeedbackPrismaTransactionalClientLike = ReviewsFeedbackPrismaClientLike & {
  $transaction<T>(callback: (client: ReviewsFeedbackPrismaClientLike) => Promise<T>): Promise<T>;
};

export type ReviewsFeedbackPrismaProvider = {
  readonly client: ReviewsFeedbackPrismaTransactionalClientLike;
};

const isPrismaUniqueConstraintError = (error: unknown): error is { code: string } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as { code?: unknown }).code === "string" &&
  (error as { code: string }).code === "P2002";

const mapOrderStatus = (status: string): ReviewsFeedbackOrderStatus =>
  status as ReviewsFeedbackOrderStatus;

const mapUserRole = (role: string): ReviewsFeedbackUserRole => role.toLowerCase() as ReviewsFeedbackUserRole;

const mapAdminUserRole = (
  role: string,
): ReviewsFeedbackAdminUserRecord["role"] => role.toLowerCase() as ReviewsFeedbackAdminUserRecord["role"];

const mapTargetRole = (role: string): ReviewsFeedbackTargetRole =>
  role.toLowerCase() as ReviewsFeedbackTargetRole;

const mapSource = (source: string): ReviewsFeedbackSource => source.toLowerCase() as ReviewsFeedbackSource;

const mapReviewRecord = (review: ReviewsFeedbackReviewRecord): ReviewsFeedbackReviewRecord => ({
  ...review,
  targetRole: mapTargetRole(review.targetRole),
  source: mapSource(review.source),
});

const mapReviewCreatedEventRecord = (
  event: ReviewsFeedbackPrismaEventRecord,
  review: ReviewsFeedbackReviewRecord,
): ReviewsFeedbackEventRecord => ({
  id: event.id,
  type: "review.created",
  entity: "review",
  entityId: event.entityId,
  payload: {
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
  },
  createdAt: event.createdAt,
});

const mapNegativeReviewEventRecord = (
  event: ReviewsFeedbackPrismaEventRecord,
  review: ReviewsFeedbackReviewRecord,
): ReviewsFeedbackEventRecord => ({
  id: event.id,
  type: "review.negative",
  entity: "review",
  entityId: event.entityId,
  payload: {
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
  },
  createdAt: event.createdAt,
});

export class PrismaReviewsFeedbackRepository implements ReviewsFeedbackRepository {
  constructor(private readonly prisma: ReviewsFeedbackPrismaProvider) {}

  async findOrderById(orderId: string): Promise<ReviewsFeedbackOrderRecord | null> {
    const order = await this.prisma.client.order.findUnique({
      where: {
        id: orderId,
      },
      select: {
        id: true,
        clientId: true,
        courierId: true,
        status: true,
        updatedAt: true,
        isDeleted: true,
      },
    });

    if (order === null) {
      return null;
    }

    return {
      ...order,
      status: mapOrderStatus(order.status),
    };
  }

  async findUserById(userId: string): Promise<ReviewsFeedbackUserRecord | null> {
    const user = await this.prisma.client.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        telegramId: true,
        role: true,
        isActive: true,
        name: true,
      },
    });

    if (user === null) {
      return null;
    }

    return {
      ...user,
      role: mapUserRole(user.role),
    };
  }

  async listActiveAdminUsers(): Promise<ReviewsFeedbackAdminUserRecord[]> {
    const users = await this.prisma.client.user.findMany({
      where: {
        role: {
          in: ["BOSS", "MANAGER", "ADMIN"],
        },
        isActive: true,
      },
      select: {
        id: true,
        telegramId: true,
        role: true,
        isActive: true,
        name: true,
      },
    });

    return users.map((user) => ({
      ...user,
      role: mapAdminUserRole(user.role),
    }));
  }

  async listReviewsByOrderId(orderId: string): Promise<ReviewsFeedbackReviewRecord[]> {
    const reviews = await this.prisma.client.review.findMany({
      where: {
        orderId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
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
      },
    });

    return reviews.map(mapReviewRecord);
  }

  async findReviewByUniquePair(
    orderId: string,
    authorId: string,
    targetUserId: string,
  ): Promise<ReviewsFeedbackReviewRecord | null> {
    const review = await this.prisma.client.review.findUnique({
      where: {
        orderId_authorId_targetUserId: {
          orderId,
          authorId,
          targetUserId,
        },
      },
      select: {
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
      },
    });

    return review === null ? null : mapReviewRecord(review);
  }

  async persistReview(input: PersistReviewInput): Promise<ReviewsFeedbackArtifactsRecord> {
    try {
      return await this.prisma.client.$transaction(async (transactionClient) => {
        const review = await transactionClient.review.create({
          data: {
            orderId: input.orderId,
            authorId: input.authorId,
            targetUserId: input.targetUserId,
            targetRole: input.targetRole.toUpperCase() as Uppercase<ReviewsFeedbackTargetRole>,
            rating: input.rating,
            reasonCode: input.reasonCode,
            comment: input.comment,
            source: input.source.toUpperCase() as Uppercase<ReviewsFeedbackSource>,
            createdAt: input.createdAt,
          },
          select: {
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
          },
        });

        const event = await transactionClient.event.create({
          data: {
            type: "review.created",
            entity: "review",
            entityId: review.id.toString(),
            payload: {
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
            },
          },
        });
        const events = [mapReviewCreatedEventRecord(event, review)];

        if (input.publishNegativeEvent) {
          const negativeEvent = await transactionClient.event.create({
            data: {
              type: "review.negative",
              entity: "review",
              entityId: review.id.toString(),
              payload: {
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
              },
            },
          });

          events.push(mapNegativeReviewEventRecord(negativeEvent, review));
        }

        const latestEvent = events[events.length - 1] ?? event;

        return {
          review: mapReviewRecord(review),
          events,
          revision: latestEvent.id.toString(),
        };
      });
    } catch (error) {
      if (!isPrismaUniqueConstraintError(error)) {
        throw error;
      }

      const existingReview = await this.findReviewByUniquePair(
        input.orderId,
        input.authorId,
        input.targetUserId,
      );

      if (existingReview !== null) {
        return {
          review: existingReview,
          events: [],
          revision: existingReview.id.toString(),
        };
      }

      throw error;
    }
  }
}
