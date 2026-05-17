import { DeliveryAssignmentService } from "../../../backend/src/slices/delivery-assignment/application/delivery-assignment.service";
import {
  PrismaDeliveryAssignmentRepository,
  type DeliveryAssignmentPrismaProvider,
} from "../../../backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import type {
  DeliveryAssignmentCourierRecord,
  DeliveryAssignmentCourierStaffIdentityRecord,
  DeliveryAssignmentCourierStaffRecord,
  DeliveryAssignmentCourierStaffRepository,
  DeliveryAssignmentRepository,
} from "../../../backend/src/slices/delivery-assignment/domain/delivery-assignment.types";

const now = new Date("2026-05-14T09:00:00.000Z");
const actorAdmin = {
  adminAccountId: "admin-account-1",
  role: "admin" as const,
};
const actorBoss = {
  adminAccountId: "boss-account-1",
  role: "boss" as const,
};
const courierStaff: DeliveryAssignmentCourierStaffRecord = {
  id: "courier-user-1",
  telegramId: "10001",
  role: "courier",
  nickname: "Courier One",
  fallbackDisplayName: "Courier One",
  workActive: false,
  acceptingOrdersUntil: null,
  autoOfferEnabled: false,
  ratingScore: 0,
  lifecycle: {
    staffCreatedAt: now,
    staffCreatedByAdminAccountId: "admin-account-1",
    staffDeactivatedAt: null,
    staffDeactivatedByAdminAccountId: null,
    staffReactivatedAt: null,
    staffReactivatedByAdminAccountId: null,
  },
  createdAt: now,
  updatedAt: now,
};
const deactivatedCourierStaff: DeliveryAssignmentCourierStaffRecord = {
  ...courierStaff,
  lifecycle: {
    ...courierStaff.lifecycle,
    staffDeactivatedAt: new Date("2026-05-14T10:00:00.000Z"),
    staffDeactivatedByAdminAccountId: "admin-account-1",
  },
};
const activeOperationalCourier: DeliveryAssignmentCourierRecord = {
  id: "courier-user-1",
  telegramId: "10001",
  role: "courier",
  isActive: true,
  acceptingOrdersUntil: null,
  autoOfferEnabled: true,
  ratingScore: 4,
  name: "Courier One",
  staffDeactivatedAt: null,
};
const deactivatedOperationalCourier: DeliveryAssignmentCourierRecord = {
  ...activeOperationalCourier,
  staffDeactivatedAt: new Date("2026-05-14T10:00:00.000Z"),
};

const createDeliveryRepository = (): DeliveryAssignmentRepository => ({
  findOrderById: jest.fn(),
  findCourierById: jest.fn(),
  startCourierWork: jest.fn(),
  stopCourierWorkAfter: jest.fn(),
  setCourierAutoOfferParticipation: jest.fn(),
  hasBusyCourierOrder: jest.fn(),
  createManualOffer: jest.fn(),
  createBroadcastOffers: jest.fn(),
  claimOffer: jest.fn(),
  assignCourier: jest.fn(),
});

const createCourierStaffRepository = (
  options: {
    byId?: DeliveryAssignmentCourierStaffIdentityRecord | null;
    byTelegram?: DeliveryAssignmentCourierStaffIdentityRecord | null;
  } = {},
) => {
  const repository = {
    findCourierStaffById: jest.fn(async () => options.byId ?? courierStaff),
    findCourierStaffByTelegramUserId: jest.fn(async () => options.byTelegram ?? null),
    createCourierStaff: jest.fn(async (input) => ({
      ...courierStaff,
      telegramId: input.telegramId,
      nickname: input.nickname,
      fallbackDisplayName: input.nickname,
      lifecycle: {
        ...courierStaff.lifecycle,
        staffCreatedAt: input.createdAt,
        staffCreatedByAdminAccountId: input.actorAdminAccountId,
      },
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    })),
    deactivateCourierStaff: jest.fn(async (input) => ({
      ...courierStaff,
      lifecycle: {
        ...courierStaff.lifecycle,
        staffDeactivatedAt: input.deactivatedAt,
        staffDeactivatedByAdminAccountId: input.actorAdminAccountId,
      },
    })),
    reactivateCourierStaff: jest.fn(async (input) => ({
      ...deactivatedCourierStaff,
      lifecycle: {
        ...deactivatedCourierStaff.lifecycle,
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: input.reactivatedAt,
        staffReactivatedByAdminAccountId: input.actorAdminAccountId,
      },
    })),
    recordCourierStaffLifecycleEvent: jest.fn(async (input) => ({
      id: 1n,
      courierUserId: input.courierUserId,
      actorAdminAccountId: input.actorAdminAccountId,
      action: input.action,
      previousNickname: input.previousNickname ?? null,
      newNickname: input.newNickname ?? null,
      reason: input.reason ?? null,
      createdAt: input.createdAt,
    })),
    recordCourierStaffRatingAdjustment: jest.fn(async (input) => ({
      id: 2n,
      courierUserId: input.courierUserId,
      actorAdminAccountId: input.actorAdminAccountId,
      delta: input.delta,
      reason: input.reason ?? null,
      createdAt: input.createdAt,
    })),
  } satisfies DeliveryAssignmentCourierStaffRepository;

  return repository;
};

const createService = (courierStaffRepository: DeliveryAssignmentCourierStaffRepository) =>
  new DeliveryAssignmentService(createDeliveryRepository(), undefined, courierStaffRepository);

describe("delivery-assignment courier staff commands", () => {
  it("creates courier staff by Telegram user id and nickname without web password state", async () => {
    const repository = createCourierStaffRepository();
    const service = createService(repository);

    await expect(
      service.createCourierStaff({
        actor: actorAdmin,
        telegramUserId: " 10001 ",
        nickname: " Courier One ",
        now,
      }),
    ).resolves.toEqual({
      courier: expect.objectContaining({
        telegramId: "10001",
        role: "courier",
        nickname: "Courier One",
        workActive: false,
      }),
    });

    expect(repository.findCourierStaffByTelegramUserId).toHaveBeenCalledWith("10001");
    expect(repository.createCourierStaff).toHaveBeenCalledWith({
      telegramId: "10001",
      nickname: "Courier One",
      actorAdminAccountId: "admin-account-1",
      createdAt: now,
    });
    expect(JSON.stringify(repository.createCourierStaff.mock.calls)).not.toContain("password");
    expect(repository.recordCourierStaffLifecycleEvent).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      actorAdminAccountId: "admin-account-1",
      action: "created",
      previousNickname: null,
      newNickname: "Courier One",
      reason: null,
      createdAt: now,
    });
  });

  it("fails duplicate and Telegram identity conflict cases before courier creation", async () => {
    const duplicateRepository = createCourierStaffRepository({
      byTelegram: courierStaff,
    });

    await expect(
      createService(duplicateRepository).createCourierStaff({
        actor: actorBoss,
        telegramUserId: "10001",
        nickname: "Courier One",
        now,
      }),
    ).rejects.toEqual(
      new AppError("DUPLICATE_COURIER_STAFF", "Courier staff already exists", 409, {
        telegram_user_id: "10001",
        courierUserId: "courier-user-1",
      }),
    );

    const conflictRepository = createCourierStaffRepository({
      byTelegram: {
        ...courierStaff,
        role: "client",
      },
    });

    await expect(
      createService(conflictRepository).createCourierStaff({
        actor: actorBoss,
        telegramUserId: "10001",
        nickname: "Courier One",
        now,
      }),
    ).rejects.toEqual(
      new AppError(
        "TELEGRAM_USER_CONFLICT",
        "Telegram user id already belongs to a non-courier account",
        409,
        {
          telegram_user_id: "10001",
          role: "client",
        },
      ),
    );

    const archivedRepository = createCourierStaffRepository({
      byTelegram: deactivatedCourierStaff,
    });

    await expect(
      createService(archivedRepository).createCourierStaff({
        actor: actorBoss,
        telegramUserId: "10001",
        nickname: "Courier One",
        now,
      }),
    ).rejects.toEqual(
      new AppError("COURIER_STAFF_DEACTIVATED", "Courier staff is deactivated; use boss reactivation", 409, {
        courierUserId: "courier-user-1",
      }),
    );

    expect(duplicateRepository.createCourierStaff).not.toHaveBeenCalled();
    expect(conflictRepository.createCourierStaff).not.toHaveBeenCalled();
    expect(archivedRepository.createCourierStaff).not.toHaveBeenCalled();
  });

  it("soft-deactivates courier staff with explicit actor metadata instead of hard delete", async () => {
    const repository = createCourierStaffRepository();
    const service = createService(repository);

    await expect(
      service.deactivateCourierStaff({
        actor: actorAdmin,
        courierUserId: "courier-user-1",
        reason: " no shifts ",
        now,
      }),
    ).resolves.toEqual({
      courier: expect.objectContaining({
        id: "courier-user-1",
        lifecycle: expect.objectContaining({
          staffDeactivatedAt: now,
          staffDeactivatedByAdminAccountId: "admin-account-1",
        }),
      }),
    });

    expect(repository.deactivateCourierStaff).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      actorAdminAccountId: "admin-account-1",
      deactivatedAt: now,
    });
    expect(repository.recordCourierStaffLifecycleEvent).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      actorAdminAccountId: "admin-account-1",
      action: "deactivated",
      previousNickname: "Courier One",
      newNickname: "Courier One",
      reason: "no shifts",
      createdAt: now,
    });
  });

  it("allows only boss to reactivate deactivated courier staff", async () => {
    const deniedRepository = createCourierStaffRepository({
      byId: deactivatedCourierStaff,
    });

    await expect(
      createService(deniedRepository).reactivateCourierStaff({
        actor: actorAdmin,
        courierUserId: "courier-user-1",
        now,
      }),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "Courier staff reactivation requires boss access", 403),
    );
    expect(deniedRepository.reactivateCourierStaff).not.toHaveBeenCalled();

    const repository = createCourierStaffRepository({
      byId: deactivatedCourierStaff,
    });

    await expect(
      createService(repository).reactivateCourierStaff({
        actor: actorBoss,
        courierUserId: "courier-user-1",
        reason: " back on schedule ",
        now,
      }),
    ).resolves.toEqual({
      courier: expect.objectContaining({
        id: "courier-user-1",
        lifecycle: expect.objectContaining({
          staffDeactivatedAt: null,
          staffReactivatedAt: now,
          staffReactivatedByAdminAccountId: "boss-account-1",
        }),
      }),
    });

    expect(repository.reactivateCourierStaff).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      actorAdminAccountId: "boss-account-1",
      reactivatedAt: now,
    });
    expect(repository.recordCourierStaffLifecycleEvent).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      actorAdminAccountId: "boss-account-1",
      action: "reactivated",
      previousNickname: "Courier One",
      newNickname: "Courier One",
      reason: "back on schedule",
      createdAt: now,
    });
  });

  it("records manual rating adjustment history without mutating courier rating or review averages", async () => {
    const repository = createCourierStaffRepository();

    await expect(
      createService(repository).adjustCourierStaffRating({
        actor: actorAdmin,
        courierUserId: "courier-user-1",
        delta: -1,
        reason: " late handoff ",
        now,
      }),
    ).resolves.toEqual({
      adjustment: {
        id: 2n,
        courierUserId: "courier-user-1",
        actorAdminAccountId: "admin-account-1",
        delta: -1,
        reason: "late handoff",
        createdAt: now,
      },
    });

    expect(repository.recordCourierStaffRatingAdjustment).toHaveBeenCalledWith({
      courierUserId: "courier-user-1",
      actorAdminAccountId: "admin-account-1",
      delta: -1,
      reason: "late handoff",
      createdAt: now,
    });
    expect(repository.deactivateCourierStaff).not.toHaveBeenCalled();
    expect(repository.reactivateCourierStaff).not.toHaveBeenCalled();
  });
});

describe("delivery-assignment courier staff operational deactivation", () => {
  it("treats staff-deactivated active courier as operationally inactive and blocks availability writes", async () => {
    const findCourierById = jest.fn().mockResolvedValue(deactivatedOperationalCourier);
    const startCourierWork = jest.fn();
    const stopCourierWorkAfter = jest.fn();
    const setCourierAutoOfferParticipation = jest.fn();
    const hasBusyCourierOrder = jest.fn().mockResolvedValue(false);
    const service = new DeliveryAssignmentService({
      ...createDeliveryRepository(),
      findCourierById,
      startCourierWork,
      stopCourierWorkAfter,
      setCourierAutoOfferParticipation,
      hasBusyCourierOrder,
    });

    await expect(
      service.getCourierAvailability("courier-user-1", now),
    ).resolves.toEqual({
      courierId: "courier-user-1",
      active: false,
      free: true,
      autoOfferEnabled: false,
      acceptingOrdersUntil: null,
      ratingScore: 4,
    });

    await expect(service.startCourierWork("courier-user-1", now)).rejects.toEqual(
      new AppError("COURIER_STAFF_INACTIVE", "Courier staff is deactivated", 409, {
        courierId: "courier-user-1",
        staffDeactivatedAt: deactivatedOperationalCourier.staffDeactivatedAt?.toISOString() ?? null,
      }),
    );
    await expect(service.stopCourierWorkAfter("courier-user-1", now)).rejects.toEqual(
      new AppError("COURIER_STAFF_INACTIVE", "Courier staff is deactivated", 409, {
        courierId: "courier-user-1",
        staffDeactivatedAt: deactivatedOperationalCourier.staffDeactivatedAt?.toISOString() ?? null,
      }),
    );
    await expect(
      service.setCourierAutoOfferParticipation("courier-user-1", true, now),
    ).rejects.toEqual(
      new AppError("COURIER_STAFF_INACTIVE", "Courier staff is deactivated", 409, {
        courierId: "courier-user-1",
        staffDeactivatedAt: deactivatedOperationalCourier.staffDeactivatedAt?.toISOString() ?? null,
      }),
    );

    expect(startCourierWork).not.toHaveBeenCalled();
    expect(stopCourierWorkAfter).not.toHaveBeenCalled();
    expect(setCourierAutoOfferParticipation).not.toHaveBeenCalled();
  });

  it("excludes deactivated couriers from broadcast offers and restores eligibility after reactivation", async () => {
    const reactivatedCourier: DeliveryAssignmentCourierRecord = {
      ...activeOperationalCourier,
      id: "courier-reactivated",
      telegramId: "10002",
      name: "Courier Reactivated",
      staffDeactivatedAt: null,
    };
    const findAutoOfferCandidateCouriers = jest.fn().mockResolvedValue([
      {
        ...deactivatedOperationalCourier,
        id: "courier-deactivated",
        telegramId: "10003",
        name: "Courier Deactivated",
      },
      reactivatedCourier,
    ]);
    const createBroadcastOffers = jest.fn().mockResolvedValue({
      offers: [
        {
          offer: {
            id: "offer-reactivated",
            orderId: "order-1",
            targetCourierId: "courier-reactivated",
            kind: "broadcast",
            status: "pending",
            createdAt: now,
            updatedAt: now,
          },
          event: {
            id: 10n,
            type: "order.offer_created",
            entity: "order",
            entityId: "order-1",
            payload: {},
            createdAt: now,
          },
        },
      ],
      order: {
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: now,
        isDeleted: false,
      },
      revision: "10",
    });
    const service = new DeliveryAssignmentService({
      ...createDeliveryRepository(),
      findOrderById: jest.fn().mockResolvedValue({
        id: "order-1",
        courierId: null,
        status: "CREATED",
        updatedAt: now,
        isDeleted: false,
      }),
      findAutoOfferCandidateCouriers,
      hasBusyCourierOrder: jest.fn().mockResolvedValue(false),
      createBroadcastOffers,
    });

    await expect(
      service.createBroadcastOffers({
        orderId: "order-1",
        actor: {
          userId: "operator-1",
          role: "operator",
        },
      }, now),
    ).resolves.toMatchObject({
      eligibleCourierCount: 1,
      offers: [
        expect.objectContaining({
          targetCourierId: "courier-reactivated",
        }),
      ],
    });

    expect(createBroadcastOffers).toHaveBeenCalledWith({
      orderId: "order-1",
      courierIds: ["courier-reactivated"],
      actorUserId: "operator-1",
      orderStatus: "CREATED",
      createdAt: now,
    });
  });
});

describe("prisma delivery-assignment courier staff repository", () => {
  it("persists courier staff as User(COURIER) with staff metadata and no password field", async () => {
    const userCreate = jest.fn(async () => ({
      id: "courier-user-1",
      telegramId: "10001",
      role: "COURIER",
      name: "Courier One",
      isActive: false,
      acceptingOrdersUntil: null,
      autoOfferEnabled: false,
      ratingScore: 0,
      staffNickname: "Courier One",
      staffCreatedAt: now,
      staffCreatedByAdminAccountId: "boss-account-1",
      staffDeactivatedAt: null,
      staffDeactivatedByAdminAccountId: null,
      staffReactivatedAt: null,
      staffReactivatedByAdminAccountId: null,
      nickname: "Courier One",
      fallbackDisplayName: "Courier One",
      workActive: false,
      lifecycle: {
        staffCreatedAt: now,
        staffCreatedByAdminAccountId: "boss-account-1",
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: null,
        staffReactivatedByAdminAccountId: null,
      },
      createdAt: now,
      updatedAt: now,
    }));
    const lifecycleCreate = jest.fn(async ({ data }) => ({
      id: 1n,
      ...data,
    }));
    const prisma = createPrismaProvider({
      user: {
        findUnique: jest.fn(),
        create: userCreate,
      },
      courierStaffLifecycleEvent: {
        create: lifecycleCreate,
      },
      courierStaffRatingAdjustment: {
        create: jest.fn(),
      },
    });
    const repository = new PrismaDeliveryAssignmentRepository(prisma);

    await expect(
      repository.createCourierStaff({
        telegramId: "10001",
        nickname: "Courier One",
        actorAdminAccountId: "boss-account-1",
        createdAt: now,
      }),
    ).resolves.toEqual({
      ...courierStaff,
      lifecycle: {
        ...courierStaff.lifecycle,
        staffCreatedByAdminAccountId: "boss-account-1",
      },
    });

    expect(userCreate).toHaveBeenCalledWith({
      data: {
        telegramId: "10001",
        role: "COURIER",
        name: "Courier One",
        staffNickname: "Courier One",
        isActive: false,
        acceptingOrdersUntil: null,
        autoOfferEnabled: false,
        ratingScore: 0,
        staffCreatedAt: now,
        staffCreatedByAdminAccountId: "boss-account-1",
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: null,
        staffReactivatedByAdminAccountId: null,
      },
      select: expect.objectContaining({
        telegramId: true,
        staffNickname: true,
        staffCreatedAt: true,
      }),
    });
    expect(JSON.stringify(userCreate.mock.calls)).not.toContain("password");

    await expect(
      repository.recordCourierStaffLifecycleEvent({
        courierUserId: "courier-user-1",
        actorAdminAccountId: "boss-account-1",
        action: "created",
        previousNickname: null,
        newNickname: "Courier One",
        createdAt: now,
      }),
    ).resolves.toEqual({
      id: 1n,
      courierUserId: "courier-user-1",
      actorAdminAccountId: "boss-account-1",
      action: "created",
      previousNickname: null,
      newNickname: "Courier One",
      reason: null,
      createdAt: now,
    });
    expect(lifecycleCreate).toHaveBeenCalledWith({
      data: {
        courierUserId: "courier-user-1",
        actorAdminAccountId: "boss-account-1",
        action: "CREATED",
        previousNickname: null,
        newNickname: "Courier One",
        reason: null,
        createdAt: now,
      },
    });
  });

  it("updates only staff lifecycle metadata for deactivate/reactivate and stores rating history separately", async () => {
    const userUpdate = jest
      .fn()
      .mockResolvedValueOnce({
        ...toPrismaCourierStaff(deactivatedCourierStaff),
        updatedAt: now,
      })
      .mockResolvedValueOnce({
        ...toPrismaCourierStaff(courierStaff),
        staffReactivatedAt: now,
        staffReactivatedByAdminAccountId: "boss-account-1",
        updatedAt: now,
      });
    const ratingCreate = jest.fn(async ({ data }) => ({
      id: 2n,
      ...data,
    }));
    const prisma = createPrismaProvider({
      user: {
        findUnique: jest.fn(),
        update: userUpdate,
      },
      courierStaffRatingAdjustment: {
        create: ratingCreate,
      },
    });
    const repository = new PrismaDeliveryAssignmentRepository(prisma);

    await expect(
      repository.deactivateCourierStaff({
        courierUserId: "courier-user-1",
        actorAdminAccountId: "admin-account-1",
        deactivatedAt: now,
      }),
    ).resolves.toEqual({
      ...deactivatedCourierStaff,
      updatedAt: now,
    });
    await expect(
      repository.reactivateCourierStaff({
        courierUserId: "courier-user-1",
        actorAdminAccountId: "boss-account-1",
        reactivatedAt: now,
      }),
    ).resolves.toEqual({
      ...courierStaff,
      lifecycle: {
        ...courierStaff.lifecycle,
        staffReactivatedAt: now,
        staffReactivatedByAdminAccountId: "boss-account-1",
      },
      updatedAt: now,
    });
    await expect(
      repository.recordCourierStaffRatingAdjustment({
        courierUserId: "courier-user-1",
        actorAdminAccountId: "admin-account-1",
        delta: 1,
        reason: "good recovery",
        createdAt: now,
      }),
    ).resolves.toEqual({
      id: 2n,
      courierUserId: "courier-user-1",
      actorAdminAccountId: "admin-account-1",
      delta: 1,
      reason: "good recovery",
      createdAt: now,
    });

    expect(userUpdate).toHaveBeenNthCalledWith(1, {
      where: {
        id: "courier-user-1",
      },
      data: {
        staffDeactivatedAt: now,
        staffDeactivatedByAdminAccountId: "admin-account-1",
      },
      select: expect.objectContaining({
        staffDeactivatedAt: true,
        staffDeactivatedByAdminAccountId: true,
      }),
    });
    expect(userUpdate).toHaveBeenNthCalledWith(2, {
      where: {
        id: "courier-user-1",
      },
      data: {
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: now,
        staffReactivatedByAdminAccountId: "boss-account-1",
      },
      select: expect.objectContaining({
        staffReactivatedAt: true,
        staffReactivatedByAdminAccountId: true,
      }),
    });
    expect(ratingCreate).toHaveBeenCalledWith({
      data: {
        courierUserId: "courier-user-1",
        actorAdminAccountId: "admin-account-1",
        delta: 1,
        reason: "good recovery",
        createdAt: now,
      },
    });
    expect(userUpdate.mock.calls[0][0].data).not.toHaveProperty("ratingScore");
    expect(userUpdate.mock.calls[1][0].data).not.toHaveProperty("ratingScore");
  });
});

const createPrismaProvider = (
  partialClient: Partial<DeliveryAssignmentPrismaProvider["client"]>,
): DeliveryAssignmentPrismaProvider => {
  const client = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    deliveryAssignmentAudit: {
      create: jest.fn(),
    },
    event: {
      create: jest.fn(),
    },
    ...partialClient,
  } as DeliveryAssignmentPrismaProvider["client"];

  return {
    client: {
      ...client,
      $transaction: async (callback) => callback(client),
    },
  };
};

const toPrismaCourierStaff = (courier: DeliveryAssignmentCourierStaffRecord) => ({
  id: courier.id,
  telegramId: courier.telegramId,
  role: "COURIER",
  name: courier.fallbackDisplayName,
  isActive: courier.workActive,
  acceptingOrdersUntil: courier.acceptingOrdersUntil,
  autoOfferEnabled: courier.autoOfferEnabled,
  ratingScore: courier.ratingScore,
  staffNickname: courier.nickname,
  staffCreatedAt: courier.lifecycle.staffCreatedAt,
  staffCreatedByAdminAccountId: courier.lifecycle.staffCreatedByAdminAccountId,
  staffDeactivatedAt: courier.lifecycle.staffDeactivatedAt,
  staffDeactivatedByAdminAccountId: courier.lifecycle.staffDeactivatedByAdminAccountId,
  staffReactivatedAt: courier.lifecycle.staffReactivatedAt,
  staffReactivatedByAdminAccountId: courier.lifecycle.staffReactivatedByAdminAccountId,
  nickname: courier.nickname,
  fallbackDisplayName: courier.fallbackDisplayName,
  workActive: courier.workActive,
  lifecycle: courier.lifecycle,
  createdAt: courier.createdAt,
  updatedAt: courier.updatedAt,
});
