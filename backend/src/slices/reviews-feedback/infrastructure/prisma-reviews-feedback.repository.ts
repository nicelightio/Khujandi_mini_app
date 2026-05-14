import type {
  PersistReviewInput,
  ReviewsFeedbackAdminUserRecord,
  ReviewsFeedbackArtifactsRecord,
  ReviewsFeedbackDirection,
  ReviewsFeedbackEventRecord,
  ReviewsFeedbackOrderRecord,
  ReviewsFeedbackRepository,
  ReviewsFeedbackReviewDraftRecord,
  ReviewsFeedbackReviewRecord,
  ReviewsFeedbackSource,
  ReviewsFeedbackTargetRole,
  ReviewsFeedbackUserRecord,
  UpsertReviewDraftInput,
} from "../domain/reviews-feedback.types";
import { AppError } from "../../../shared/errors/app-error";
import {
  buildReviewDraftCasWhere,
  buildReviewDraftKey,
  buildReviewDraftWriteData,
} from "./prisma-reviews-feedback.drafts";
import { buildReviewEventPayload, mapReviewEventRecord } from "./prisma-reviews-feedback.events";
import {
  mapAdminUserRole,
  mapOrderStatus,
  mapReviewDraftRecord,
  mapReviewRecord,
  mapUserRole,
} from "./prisma-reviews-feedback.mappers";
import { reviewDraftSelect, reviewEventSelect, reviewSelect } from "./prisma-reviews-feedback.selects";
import type { ReviewsFeedbackPrismaProvider } from "./prisma-reviews-feedback.types";
import { isPrismaUniqueConstraintError } from "./prisma-reviews-feedback.types";

export type { ReviewsFeedbackPrismaProvider } from "./prisma-reviews-feedback.types";

const NEGATIVE_REVIEW_RATING_THRESHOLD = 2;

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
          in: ["BOSS", "OPERATOR", "ADMIN"],
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
      select: reviewSelect,
    });

    return reviews.map(mapReviewRecord);
  }

  async findActiveReviewDraft(
    orderId: string,
    actorUserId: string,
    direction: ReviewsFeedbackDirection,
    now: Date,
  ): Promise<ReviewsFeedbackReviewDraftRecord | null> {
    const draft = await this.prisma.client.reviewDraft.findUnique({
      where: {
        orderId_actorUserId_direction: {
          orderId,
          actorUserId,
          direction,
        },
      },
      select: {
        ...reviewDraftSelect,
      },
    });

    if (draft === null || draft.expiresAt.getTime() <= now.getTime()) {
      return null;
    }

    return mapReviewDraftRecord(draft);
  }

  async upsertReviewDraft(input: UpsertReviewDraftInput): Promise<ReviewsFeedbackReviewDraftRecord> {
    const data = buildReviewDraftWriteData(input);
    const key = buildReviewDraftKey(input);
    const casWhere = buildReviewDraftCasWhere(input);

    if (casWhere !== null) {
      const updateResult = await this.prisma.client.reviewDraft.updateMany({
        where: casWhere,
        data: data.update,
      });

      if (updateResult.count !== 1) {
        throw new AppError("CONFLICT", "Review draft moved to another stage or revision", 409, {
          orderId: input.orderId,
          actorUserId: input.actorUserId,
          direction: input.direction,
        });
      }

      const updatedDraft = await this.prisma.client.reviewDraft.findUnique({
        where: {
          orderId_actorUserId_direction: key,
        },
        select: reviewDraftSelect,
      });

      if (updatedDraft === null) {
        throw new AppError("CONFLICT", "Review draft moved to another stage or revision", 409, {
          orderId: input.orderId,
          actorUserId: input.actorUserId,
          direction: input.direction,
        });
      }

      return mapReviewDraftRecord(updatedDraft);
    }

    const draft = await this.prisma.client.reviewDraft.upsert({
      where: {
        orderId_actorUserId_direction: key,
      },
      create: data.create,
      update: data.update,
      select: reviewDraftSelect,
    });

    return mapReviewDraftRecord(draft);
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
      select: reviewSelect,
    });

    return review === null ? null : mapReviewRecord(review);
  }

  async findReviewCreatedEvent(
    review: ReviewsFeedbackReviewRecord,
  ): Promise<ReviewsFeedbackEventRecord | null> {
    return this.findReviewEventByType(review, "review.created");
  }

  async findReviewNegativeEvent(
    review: ReviewsFeedbackReviewRecord,
  ): Promise<ReviewsFeedbackEventRecord | null> {
    return this.findReviewEventByType(review, "review.negative");
  }

  private async findReviewEventByType(
    review: ReviewsFeedbackReviewRecord,
    type: "review.created" | "review.negative",
  ): Promise<ReviewsFeedbackEventRecord | null> {
    const eventStore = this.prisma.client.event;

    if (eventStore.findFirst === undefined) {
      return null;
    }

    const event = await eventStore.findFirst({
      where: {
        type,
        entity: "review",
        entityId: review.id.toString(),
      },
      orderBy: {
        id: "asc",
      },
      select: reviewEventSelect,
    });

    return event === null ? null : mapReviewEventRecord(event, review, type);
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
          select: reviewSelect,
        });

        const event = await transactionClient.event.create({
          data: {
            type: "review.created",
            entity: "review",
            entityId: review.id.toString(),
            payload: buildReviewEventPayload(review),
          },
        });
        const events = [mapReviewEventRecord(event, review, "review.created")];

        if (input.publishNegativeEvent) {
          const negativeEvent = await transactionClient.event.create({
            data: {
              type: "review.negative",
              entity: "review",
              entityId: review.id.toString(),
              payload: buildReviewEventPayload(review),
            },
          });

          events.push(mapReviewEventRecord(negativeEvent, review, "review.negative"));
        }

        const latestEvent = events[events.length - 1] ?? event;

        return {
          review: mapReviewRecord(review),
          events,
          revision: latestEvent.id.toString(),
          createdReview: true,
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
        const reviewCreatedEvent = await this.findReviewCreatedEvent(existingReview);
        const reviewNegativeEvent = existingReview.rating <= NEGATIVE_REVIEW_RATING_THRESHOLD
          ? await this.findReviewNegativeEvent(existingReview)
          : null;
        const events = [reviewCreatedEvent, reviewNegativeEvent].filter(
          (event): event is ReviewsFeedbackEventRecord => event !== null,
        );
        const latestEvent = events[events.length - 1] ?? null;

        return {
          review: existingReview,
          events,
          revision: latestEvent === null ? "0" : latestEvent.id.toString(),
          createdReview: false,
        };
      }

      throw error;
    }
  }
}
