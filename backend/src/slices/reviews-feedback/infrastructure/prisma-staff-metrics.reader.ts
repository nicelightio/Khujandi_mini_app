import type {
  ReviewsFeedbackCourierAverageClientReviewRatingMetric,
  ReviewsFeedbackCourierClientProblemReviewMetric,
  ReviewsFeedbackUserId,
} from "../domain/reviews-feedback.types";

type ReviewForCourierAveragePrismaRecord = {
  orderId?: string;
  authorId: string;
  targetUserId: string;
  targetRole: string;
  rating: number;
  createdAt?: Date;
  order: {
    clientId: string;
  } | null;
};

type ReviewsFeedbackStaffMetricsPrismaClientLike = {
  review: {
    findMany(args: {
      where: {
        targetUserId: {
          in: string[];
        };
        targetRole: "COURIER";
      };
      select: {
        orderId?: true;
        authorId: true;
        targetUserId: true;
        targetRole: true;
        rating: true;
        createdAt?: true;
        order: {
          select: {
            clientId: true;
          };
        };
      };
    }): Promise<ReviewForCourierAveragePrismaRecord[]>;
  };
};

export type ReviewsFeedbackStaffMetricsPrismaProvider = {
  readonly client: ReviewsFeedbackStaffMetricsPrismaClientLike;
};

export class PrismaReviewsFeedbackStaffMetricsReader {
  constructor(private readonly prisma: ReviewsFeedbackStaffMetricsPrismaProvider) {}

  async listCourierAverageClientReviewRatings(
    courierUserIds: ReviewsFeedbackUserId[],
  ): Promise<ReviewsFeedbackCourierAverageClientReviewRatingMetric[]> {
    if (courierUserIds.length === 0) {
      return [];
    }

    const reviews = await this.prisma.client.review.findMany({
      where: {
        targetUserId: {
          in: courierUserIds,
        },
        targetRole: "COURIER",
      },
      select: {
        authorId: true,
        targetUserId: true,
        targetRole: true,
        rating: true,
        order: {
          select: {
            clientId: true,
          },
        },
      },
    });
    const ratingsByCourierId = new Map<string, number[]>();

    for (const review of reviews) {
      if (
        review.targetRole !== "COURIER" ||
        review.order === null ||
        review.authorId !== review.order.clientId
      ) {
        continue;
      }

      const existing = ratingsByCourierId.get(review.targetUserId) ?? [];
      existing.push(review.rating);
      ratingsByCourierId.set(review.targetUserId, existing);
    }

    return courierUserIds.map((courierUserId) => {
      const ratings = ratingsByCourierId.get(courierUserId) ?? [];
      const ratingSum = ratings.reduce((sum, rating) => sum + rating, 0);

      return {
        courierUserId,
        averageRating: ratings.length === 0 ? null : ratingSum / ratings.length,
        reviewCount: ratings.length,
      };
    });
  }

  async listCourierClientRatingOneProblemReviews(
    courierUserIds: ReviewsFeedbackUserId[],
  ): Promise<ReviewsFeedbackCourierClientProblemReviewMetric[]> {
    if (courierUserIds.length === 0) {
      return [];
    }

    const reviews = await this.prisma.client.review.findMany({
      where: {
        targetUserId: {
          in: courierUserIds,
        },
        targetRole: "COURIER",
      },
      select: {
        orderId: true,
        authorId: true,
        targetUserId: true,
        targetRole: true,
        rating: true,
        createdAt: true,
        order: {
          select: {
            clientId: true,
          },
        },
      },
    });

    return reviews
      .filter(
        (
          review,
        ): review is ReviewForCourierAveragePrismaRecord & {
          orderId: string;
          createdAt: Date;
        } =>
          review.targetRole === "COURIER" &&
          review.rating === 1 &&
          review.order !== null &&
          review.authorId === review.order.clientId &&
          review.orderId !== undefined &&
          review.createdAt !== undefined,
      )
      .map((review) => ({
        courierUserId: review.targetUserId,
        orderId: review.orderId,
        rating: review.rating,
        createdAt: review.createdAt,
      }));
  }
}
