import { PrismaReviewsFeedbackStaffMetricsReader } from "../../../backend/src/slices/reviews-feedback/infrastructure/prisma-staff-metrics.reader";

describe("reviews-feedback staff metrics read model", () => {
  it("averages only client-to-courier review ratings for courier table metrics", async () => {
    const reviewFindMany = jest.fn(async () => [
      {
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "COURIER",
        rating: 5,
        order: {
          clientId: "client-1",
        },
      },
      {
        authorId: "client-2",
        targetUserId: "courier-1",
        targetRole: "COURIER",
        rating: 3,
        order: {
          clientId: "client-2",
        },
      },
      {
        authorId: "courier-1",
        targetUserId: "courier-1",
        targetRole: "COURIER",
        rating: 1,
        order: {
          clientId: "client-1",
        },
      },
      {
        authorId: "client-3",
        targetUserId: "courier-2",
        targetRole: "CLIENT",
        rating: 5,
        order: {
          clientId: "client-3",
        },
      },
    ]);
    const reader = new PrismaReviewsFeedbackStaffMetricsReader({
      client: {
        review: {
          findMany: reviewFindMany,
        },
      },
    });

    await expect(
      reader.listCourierAverageClientReviewRatings(["courier-1", "courier-2"]),
    ).resolves.toEqual([
      {
        courierUserId: "courier-1",
        averageRating: 4,
        reviewCount: 2,
      },
      {
        courierUserId: "courier-2",
        averageRating: null,
        reviewCount: 0,
      },
    ]);

    expect(reviewFindMany).toHaveBeenCalledWith({
      where: {
        targetUserId: {
          in: ["courier-1", "courier-2"],
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
  });

  it("returns only client-authored rating-one courier review evidence for card problem blocks", async () => {
    const reviewFindMany = jest.fn(async () => [
      {
        orderId: "order-client-rating-one",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "COURIER",
        rating: 1,
        createdAt: new Date("2026-05-14T10:00:00.000Z"),
        order: {
          clientId: "client-1",
        },
      },
      {
        orderId: "order-rating-two",
        authorId: "client-2",
        targetUserId: "courier-1",
        targetRole: "COURIER",
        rating: 2,
        createdAt: new Date("2026-05-14T10:01:00.000Z"),
        order: {
          clientId: "client-2",
        },
      },
      {
        orderId: "order-courier-authored",
        authorId: "courier-1",
        targetUserId: "courier-1",
        targetRole: "COURIER",
        rating: 1,
        createdAt: new Date("2026-05-14T10:02:00.000Z"),
        order: {
          clientId: "client-1",
        },
      },
    ]);
    const reader = new PrismaReviewsFeedbackStaffMetricsReader({
      client: {
        review: {
          findMany: reviewFindMany,
        },
      },
    });

    await expect(
      reader.listCourierClientRatingOneProblemReviews(["courier-1"]),
    ).resolves.toEqual([
      {
        courierUserId: "courier-1",
        orderId: "order-client-rating-one",
        rating: 1,
        createdAt: new Date("2026-05-14T10:00:00.000Z"),
      },
    ]);

    expect(reviewFindMany).toHaveBeenCalledWith({
      where: {
        targetUserId: {
          in: ["courier-1"],
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
  });
});
