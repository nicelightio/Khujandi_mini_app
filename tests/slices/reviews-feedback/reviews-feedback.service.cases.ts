import { ReviewsFeedbackService } from "../../../backend/src/slices/reviews-feedback/application/reviews-feedback.service";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import { createRepository } from "./reviews-feedback.unit.test-helpers";

export const registerReviewsFeedbackServiceCases = () => {
  it("keeps order and user lookups behind the owning slice repository", async () => {
    const findOrderById = jest.fn().mockResolvedValue({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    const findUserById = jest.fn().mockResolvedValue({
      id: "courier-1",
      telegramId: "70001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      findOrderById,
      findUserById,
    });

    await expect(service.findOrderById("order-1")).resolves.toEqual({
      id: "order-1",
      clientId: "client-1",
      courierId: "courier-1",
      status: "COMPLETED",
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      isDeleted: false,
    });
    await expect(service.findUserById("courier-1")).resolves.toEqual({
      id: "courier-1",
      telegramId: "70001",
      role: "courier",
      isActive: true,
      name: "Courier One",
    });
    expect(findOrderById).toHaveBeenCalledWith("order-1");
    expect(findUserById).toHaveBeenCalledWith("courier-1");
  });

  it("returns persisted reviews ordered by creation time via the owning slice repository", async () => {
    const listReviewsByOrderId = jest.fn().mockResolvedValue([
      {
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
      {
        id: 12n,
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 4,
        reasonCode: "RESPONSIVE",
        comment: "Quick handoff",
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:03:00.000Z"),
      },
    ]);
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      listReviewsByOrderId,
    });

    await expect(service.listReviewsByOrderId("order-1")).resolves.toEqual([
      {
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
      {
        id: 12n,
        orderId: "order-1",
        authorId: "courier-1",
        targetUserId: "client-1",
        targetRole: "client",
        rating: 4,
        reasonCode: "RESPONSIVE",
        comment: "Quick handoff",
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:03:00.000Z"),
      },
    ]);
    expect(listReviewsByOrderId).toHaveBeenCalledWith("order-1");
  });

  it.todo("rejects review submission before the order reaches COMPLETED");
  it("rejects review submission before the order reaches COMPLETED", async () => {
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      findOrderById: jest.fn().mockResolvedValue({
        id: "order-1",
        clientId: "client-1",
        courierId: "courier-1",
        status: "DELIVERED",
        updatedAt: new Date("2026-04-05T09:00:00.000Z"),
        isDeleted: false,
      }),
    });

    await expect(
      service.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 4,
        reasonCode: "ON_TIME",
        source: "telegram_bot",
      }),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      service.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 4,
        reasonCode: "ON_TIME",
        source: "telegram_bot",
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      statusCode: 409,
    });
  });

  it("persists a structured review only once for a unique order and actor-target pair", async () => {
    const findReviewByUniquePair = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
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
      });
    const persistReview = jest.fn().mockResolvedValue({
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
      events: [],
      revision: "12",
    });
    const service = new ReviewsFeedbackService({
      ...createRepository(),
      findOrderById: jest.fn().mockResolvedValue({
        id: "order-1",
        clientId: "client-1",
        courierId: "courier-1",
        status: "COMPLETED",
        updatedAt: new Date("2026-04-05T09:00:00.000Z"),
        isDeleted: false,
      }),
      findReviewByUniquePair,
      persistReview,
    });

    await expect(
      service.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: " ON_TIME ",
        comment: "   ",
        source: "telegram_bot",
      }),
    ).resolves.toEqual({
      reviewId: "11",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      revision: "12",
      createdAt: new Date("2026-04-05T09:00:00.000Z"),
    });

    await expect(
      service.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 5,
        reasonCode: "ON_TIME",
        source: "telegram_bot",
      }),
    ).resolves.toEqual({
      reviewId: "11",
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      revision: "11",
      createdAt: new Date("2026-04-05T09:00:00.000Z"),
    });

    expect(persistReview).toHaveBeenCalledTimes(1);
    expect(persistReview).toHaveBeenCalledWith({
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 5,
      reasonCode: "ON_TIME",
      comment: null,
      source: "telegram_bot",
      createdAt: expect.any(Date),
      publishNegativeEvent: false,
    });
  });

  it("publishes a single review.negative notification for low-rating reviews", async () => {
    const notifyNegativeReview = jest.fn().mockResolvedValue(undefined);
    const persistReview = jest.fn().mockResolvedValue({
      review: {
        id: 21n,
        orderId: "order-1",
        authorId: "client-1",
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 2,
        reasonCode: "RUDE",
        comment: null,
        source: "telegram_bot",
        createdAt: new Date("2026-04-05T09:00:00.000Z"),
      },
      events: [
        {
          id: 22n,
          type: "review.created",
          entity: "review",
          entityId: "21",
          payload: {
            reviewId: "21",
            orderId: "order-1",
            authorId: "client-1",
            targetUserId: "courier-1",
            targetRole: "courier",
            rating: 2,
            reasonCode: "RUDE",
            comment: null,
            source: "telegram_bot",
            createdAt: "2026-04-05T09:00:00.000Z",
          },
          createdAt: new Date("2026-04-05T09:00:01.000Z"),
        },
        {
          id: 23n,
          type: "review.negative",
          entity: "review",
          entityId: "21",
          payload: {
            reviewId: "21",
            orderId: "order-1",
            authorId: "client-1",
            targetUserId: "courier-1",
            targetRole: "courier",
            rating: 2,
            reasonCode: "RUDE",
            comment: null,
            source: "telegram_bot",
            createdAt: "2026-04-05T09:00:00.000Z",
          },
          createdAt: new Date("2026-04-05T09:00:02.000Z"),
        },
      ],
      revision: "23",
    });
    const listActiveAdminUsers = jest.fn().mockResolvedValue([
      {
        id: "admin-1",
        telegramId: "80001",
        role: "admin",
        isActive: true,
        name: "Admin One",
      },
      {
        id: "boss-1",
        telegramId: "80002",
        role: "boss",
        isActive: true,
        name: "Boss One",
      },
    ]);
    const service = new ReviewsFeedbackService(
      {
        ...createRepository(),
        findOrderById: jest.fn().mockResolvedValue({
          id: "order-1",
          clientId: "client-1",
          courierId: "courier-1",
          status: "COMPLETED",
          updatedAt: new Date("2026-04-05T09:00:00.000Z"),
          isDeleted: false,
        }),
        persistReview,
        listActiveAdminUsers,
      },
      {
        notifyNegativeReview,
      },
    );

    await expect(
      service.submitReview({
        orderId: "order-1",
        actor: {
          userId: "client-1",
          role: "client",
        },
        targetUserId: "courier-1",
        targetRole: "courier",
        rating: 2,
        reasonCode: "RUDE",
        source: "telegram_bot",
      }),
    ).resolves.toMatchObject({
      reviewId: "21",
      revision: "23",
      rating: 2,
      reasonCode: "RUDE",
    });

    expect(persistReview).toHaveBeenCalledWith({
      orderId: "order-1",
      authorId: "client-1",
      targetUserId: "courier-1",
      targetRole: "courier",
      rating: 2,
      reasonCode: "RUDE",
      comment: null,
      source: "telegram_bot",
      createdAt: expect.any(Date),
      publishNegativeEvent: true,
    });
    expect(listActiveAdminUsers).toHaveBeenCalledTimes(1);
    expect(notifyNegativeReview).toHaveBeenCalledWith({
      adminTelegramIds: ["80001", "80002"],
      orderId: "order-1",
      reviewId: "21",
      direction: "client_to_courier",
      rating: 2,
      reasonCode: "RUDE",
    });
  });
};
