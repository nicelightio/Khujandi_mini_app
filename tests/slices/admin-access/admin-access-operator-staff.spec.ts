import { AdminAccessService } from "../../../backend/src/slices/admin-access/application/admin-access.service";
import { PrismaAdminAccessRepository } from "../../../backend/src/slices/admin-access/infrastructure/prisma-admin-access.repository";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import type {
  AdminAccessAccountRecord,
  AdminAccessOperatorStaffRecord,
  AdminAccessOperatorStaffRepository,
  AdminAccessRepository,
} from "../../../backend/src/slices/admin-access/domain/admin-access.types";
import type { AdminAccessPrismaProvider } from "../../../backend/src/slices/admin-access/infrastructure/prisma-admin-access.repository";

const now = new Date("2026-05-14T09:00:00.000Z");
const actorAdmin: AdminAccessAccountRecord = {
  id: "admin-account-1",
  login: "admin@example.com",
  passwordHash: "admin-password-hash",
  role: "admin",
  isActive: true,
  lockedUntil: null,
  createdAt: new Date("2026-05-01T09:00:00.000Z"),
  updatedAt: new Date("2026-05-01T09:00:00.000Z"),
};
const actorBoss: AdminAccessAccountRecord = {
  ...actorAdmin,
  id: "boss-account-1",
  login: "boss@example.com",
  role: "boss",
};
const operatorStaff: AdminAccessOperatorStaffRecord = {
  id: "operator-account-1",
  login: "operator@example.com",
  nickname: "Operator One",
  role: "operator",
  authActive: true,
  lockedUntil: null,
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

const createRepository = (
  options: {
    actor?: AdminAccessAccountRecord | null;
    duplicateAccount?: AdminAccessAccountRecord | null;
    revokedSessionCount?: number;
  } = {},
) => {
  const repository = {
    findAccountByLogin: jest.fn(async () => options.duplicateAccount ?? null),
    findAccountById: jest.fn(async () => options.actor ?? actorBoss),
    createSession: jest.fn(),
    findSessionByRefreshTokenHash: jest.fn(),
    updateSession: jest.fn(),
    revokeSession: jest.fn(),
    revokeSessionsByAccount: jest.fn(async () => options.revokedSessionCount ?? 0),
    recordAudit: jest.fn(),
    countFailedLoginAuditsSince: jest.fn(),
    setAccountLockout: jest.fn(),
  } satisfies AdminAccessRepository;

  return repository;
};

const createOperatorStaffRepository = (
  options: {
    operator?: AdminAccessOperatorStaffRecord | null;
  } = {},
) => {
  const repository = {
    findOperatorStaffById: jest.fn(async () => options.operator ?? operatorStaff),
    createOperatorStaff: jest.fn(async (input) => ({
      ...operatorStaff,
      login: input.login,
      nickname: input.nickname,
      lifecycle: {
        ...operatorStaff.lifecycle,
        staffCreatedAt: input.createdAt,
        staffCreatedByAdminAccountId: input.actorAdminAccountId,
      },
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    })),
    deactivateOperatorStaff: jest.fn(async (input) => ({
      ...operatorStaff,
      authActive: false,
      lifecycle: {
        ...operatorStaff.lifecycle,
        staffDeactivatedAt: input.deactivatedAt,
        staffDeactivatedByAdminAccountId: input.actorAdminAccountId,
      },
    })),
    reactivateOperatorStaff: jest.fn(async (input) => ({
      ...operatorStaff,
      lifecycle: {
        ...operatorStaff.lifecycle,
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: input.reactivatedAt,
        staffReactivatedByAdminAccountId: input.actorAdminAccountId,
      },
    })),
    updateOperatorStaffPassword: jest.fn(async () => operatorStaff),
    updateOperatorStaffNickname: jest.fn(async (input) => ({
      ...operatorStaff,
      nickname: input.nickname,
    })),
    recordOperatorStaffLifecycleEvent: jest.fn(async (input) => ({
      id: 1n,
      operatorAdminAccountId: input.operatorAdminAccountId,
      actorAdminAccountId: input.actorAdminAccountId,
      action: input.action,
      previousNickname: input.previousNickname ?? null,
      newNickname: input.newNickname ?? null,
      reason: input.reason ?? null,
      createdAt: input.createdAt,
    })),
    recordOperatorStaffRatingAdjustment: jest.fn(),
  } satisfies AdminAccessOperatorStaffRepository;

  return repository;
};

describe("admin-access operator staff commands", () => {
  it("creates only OPERATOR staff accounts, stores a hash, and returns plaintext only as one-time response state", async () => {
    const repository = createRepository({
      actor: actorAdmin,
    });
    const operatorRepository = createOperatorStaffRepository();
    const passwordHashing = {
      hash: jest.fn(async () => "operator-password-hash"),
    };
    const service = new AdminAccessService(repository, operatorRepository);

    await expect(
      service.createOperatorStaffAccount(
        {
          actorAdminAccountId: "admin-account-1",
          login: "  Operator@Example.com ",
          nickname: " Operator One ",
          password: "strong-password-01",
          role: "operator",
          now,
        },
        {
          passwordHashing,
        },
      ),
    ).resolves.toEqual({
      operator: expect.objectContaining({
        id: "operator-account-1",
        login: "operator@example.com",
        nickname: "Operator One",
        role: "operator",
      }),
      oneTimePassword: "strong-password-01",
    });

    expect(repository.findAccountById).toHaveBeenCalledWith("admin-account-1");
    expect(repository.findAccountByLogin).toHaveBeenCalledWith("operator@example.com");
    expect(passwordHashing.hash).toHaveBeenCalledWith("strong-password-01");
    expect(operatorRepository.createOperatorStaff).toHaveBeenCalledWith({
      login: "operator@example.com",
      nickname: "Operator One",
      passwordHash: "operator-password-hash",
      actorAdminAccountId: "admin-account-1",
      createdAt: now,
    });
    expect(JSON.stringify(operatorRepository.createOperatorStaff.mock.calls)).not.toContain(
      "strong-password-01",
    );
    expect(operatorRepository.recordOperatorStaffLifecycleEvent).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      actorAdminAccountId: "admin-account-1",
      action: "created",
      previousNickname: null,
      newNickname: "Operator One",
      reason: null,
      createdAt: now,
    });
    expect(repository.recordAudit).not.toHaveBeenCalled();
  });

  it("rejects attempts to create ADMIN or BOSS accounts through the operator staff command", async () => {
    const repository = createRepository({
      actor: actorBoss,
    });
    const operatorRepository = createOperatorStaffRepository();
    const passwordHashing = {
      hash: jest.fn(),
    };
    const service = new AdminAccessService(repository, operatorRepository);

    await expect(
      service.createOperatorStaffAccount(
        {
          actorAdminAccountId: "boss-account-1",
          login: "admin2@example.com",
          nickname: "Admin Two",
          password: "strong-password-01",
          role: "admin",
          now,
        },
        {
          passwordHashing,
        },
      ),
    ).rejects.toEqual(
      new AppError("INVALID_OPERATOR_ROLE", "Staff panel can create only operator accounts", 400, {
        requested_role: "admin",
      }),
    );
    expect(passwordHashing.hash).not.toHaveBeenCalled();
    expect(operatorRepository.createOperatorStaff).not.toHaveBeenCalled();
  });

  it("fails duplicate login and weak password cases before persisting operator staff", async () => {
    const duplicateRepository = createRepository({
      actor: actorBoss,
      duplicateAccount: {
        ...actorAdmin,
        id: "existing-operator-account",
        login: "operator@example.com",
        role: "operator",
      },
    });
    const weakPasswordRepository = createRepository({
      actor: actorBoss,
    });
    const operatorRepository = createOperatorStaffRepository();
    const passwordHashing = {
      hash: jest.fn(),
    };

    await expect(
      new AdminAccessService(duplicateRepository, operatorRepository).createOperatorStaffAccount(
        {
          actorAdminAccountId: "boss-account-1",
          login: "operator@example.com",
          nickname: "Operator One",
          password: "strong-password-01",
          role: "operator",
          now,
        },
        {
          passwordHashing,
        },
      ),
    ).rejects.toEqual(new AppError("DUPLICATE_LOGIN", "Operator login already exists", 409));

    await expect(
      new AdminAccessService(weakPasswordRepository, operatorRepository).createOperatorStaffAccount(
        {
          actorAdminAccountId: "boss-account-1",
          login: "operator2@example.com",
          nickname: "Operator Two",
          password: "short",
          role: "operator",
          now,
        },
        {
          passwordHashing,
        },
      ),
    ).rejects.toEqual(
      new AppError("WEAK_PASSWORD", "Operator password does not meet admin auth policy", 400, {
        min_length: 12,
      }),
    );

    expect(passwordHashing.hash).not.toHaveBeenCalled();
    expect(operatorRepository.createOperatorStaff).not.toHaveBeenCalled();
  });

  it("lets only boss reset an operator password, revokes sessions, and records actor metadata", async () => {
    const repository = createRepository({
      actor: actorBoss,
      revokedSessionCount: 2,
    });
    const operatorRepository = createOperatorStaffRepository();
    const passwordHashing = {
      hash: jest.fn(async () => "new-operator-password-hash"),
    };
    const service = new AdminAccessService(repository, operatorRepository);

    await expect(
      service.resetOperatorStaffPassword(
        {
          actorAdminAccountId: "boss-account-1",
          operatorAdminAccountId: "operator-account-1",
          password: "new-password-01",
          now,
        },
        {
          passwordHashing,
        },
      ),
    ).resolves.toEqual({
      operator: operatorStaff,
      revokedSessionCount: 2,
      oneTimePassword: "new-password-01",
    });

    expect(passwordHashing.hash).toHaveBeenCalledWith("new-password-01");
    expect(operatorRepository.updateOperatorStaffPassword).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      passwordHash: "new-operator-password-hash",
    });
    expect(JSON.stringify(operatorRepository.updateOperatorStaffPassword.mock.calls)).not.toContain(
      "new-password-01",
    );
    expect(repository.revokeSessionsByAccount).toHaveBeenCalledWith({
      adminAccountId: "operator-account-1",
      revokedAt: now,
    });
    expect(operatorRepository.recordOperatorStaffLifecycleEvent).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      actorAdminAccountId: "boss-account-1",
      action: "nickname_updated",
      previousNickname: "Operator One",
      newNickname: "Operator One",
      reason: "password_reset",
      createdAt: now,
    });
    const lifecycleCalls = JSON.stringify(
      operatorRepository.recordOperatorStaffLifecycleEvent.mock.calls,
    );
    expect(lifecycleCalls).not.toContain("new-password-01");

    const adminRepository = createRepository({
      actor: actorAdmin,
    });
    const deniedPasswordHashing = {
      hash: jest.fn(),
    };

    await expect(
      new AdminAccessService(adminRepository, operatorRepository).resetOperatorStaffPassword(
        {
          actorAdminAccountId: "admin-account-1",
          operatorAdminAccountId: "operator-account-1",
          password: "new-password-02",
          now,
        },
        {
          passwordHashing: deniedPasswordHashing,
        },
      ),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "This operator staff action requires boss access", 403),
    );
    expect(deniedPasswordHashing.hash).not.toHaveBeenCalled();
  });

  it("lets only boss update operator nickname and records lifecycle metadata", async () => {
    const repository = createRepository({
      actor: actorBoss,
    });
    const operatorRepository = createOperatorStaffRepository();
    const service = new AdminAccessService(repository, operatorRepository);

    await expect(
      service.updateOperatorStaffNickname({
        actorAdminAccountId: "boss-account-1",
        operatorAdminAccountId: "operator-account-1",
        nickname: " Senior Operator ",
        now,
      }),
    ).resolves.toEqual({
      operator: expect.objectContaining({
        id: "operator-account-1",
        nickname: "Senior Operator",
      }),
    });

    expect(operatorRepository.updateOperatorStaffNickname).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      nickname: "Senior Operator",
    });
    expect(operatorRepository.recordOperatorStaffLifecycleEvent).toHaveBeenCalledWith({
      operatorAdminAccountId: "operator-account-1",
      actorAdminAccountId: "boss-account-1",
      action: "nickname_updated",
      previousNickname: "Operator One",
      newNickname: "Senior Operator",
      reason: null,
      createdAt: now,
    });

    await expect(
      new AdminAccessService(
        createRepository({
          actor: actorAdmin,
        }),
        operatorRepository,
      ).updateOperatorStaffNickname({
        actorAdminAccountId: "admin-account-1",
        operatorAdminAccountId: "operator-account-1",
        nickname: "Denied Nickname",
        now,
      }),
    ).rejects.toEqual(
      new AppError("FORBIDDEN", "This operator staff action requires boss access", 403),
    );
  });
});

describe("prisma admin-access operator staff repository", () => {
  it("persists operator staff accounts as AdminAccount(OPERATOR) with hash-only password storage", async () => {
    const adminAccountCreate = jest.fn(async () => ({
      id: "operator-account-1",
      login: "operator@example.com",
      role: "OPERATOR",
      nickname: "Operator One",
      isActive: true,
      lockedUntil: null,
      staffCreatedAt: now,
      staffCreatedByAdminAccountId: "boss-account-1",
      staffDeactivatedAt: null,
      staffDeactivatedByAdminAccountId: null,
      staffReactivatedAt: null,
      staffReactivatedByAdminAccountId: null,
      createdAt: now,
      updatedAt: now,
    }));
    const lifecycleCreate = jest.fn(async ({ data }) => ({
      id: 1n,
      ...data,
    }));
    const prisma: AdminAccessPrismaProvider = {
      client: {
        adminAccount: {
          findUnique: jest.fn(),
          create: adminAccountCreate,
          update: jest.fn(),
        },
        adminSession: {
          create: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        adminAuthAudit: {
          create: jest.fn(),
          count: jest.fn(),
        },
        operatorStaffLifecycleEvent: {
          create: lifecycleCreate,
        },
      },
    };
    const repository = new PrismaAdminAccessRepository(prisma);

    await expect(
      repository.createOperatorStaff({
        login: "operator@example.com",
        nickname: "Operator One",
        passwordHash: "operator-password-hash",
        actorAdminAccountId: "boss-account-1",
        createdAt: now,
      }),
    ).resolves.toEqual({
      id: "operator-account-1",
      login: "operator@example.com",
      nickname: "Operator One",
      role: "operator",
      authActive: true,
      lockedUntil: null,
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
    });
    expect(adminAccountCreate).toHaveBeenCalledWith({
      data: {
        login: "operator@example.com",
        passwordHash: "operator-password-hash",
        role: "OPERATOR",
        nickname: "Operator One",
        isActive: true,
        lockedUntil: null,
        staffCreatedAt: now,
        staffCreatedByAdminAccountId: "boss-account-1",
        staffDeactivatedAt: null,
        staffDeactivatedByAdminAccountId: null,
        staffReactivatedAt: null,
        staffReactivatedByAdminAccountId: null,
      },
      select: {
        id: true,
        login: true,
        role: true,
        nickname: true,
        isActive: true,
        lockedUntil: true,
        staffCreatedAt: true,
        staffCreatedByAdminAccountId: true,
        staffDeactivatedAt: true,
        staffDeactivatedByAdminAccountId: true,
        staffReactivatedAt: true,
        staffReactivatedByAdminAccountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await expect(
      repository.recordOperatorStaffLifecycleEvent({
        operatorAdminAccountId: "operator-account-1",
        actorAdminAccountId: "boss-account-1",
        action: "created",
        previousNickname: null,
        newNickname: "Operator One",
        reason: null,
        createdAt: now,
      }),
    ).resolves.toEqual({
      id: 1n,
      operatorAdminAccountId: "operator-account-1",
      actorAdminAccountId: "boss-account-1",
      action: "created",
      previousNickname: null,
      newNickname: "Operator One",
      reason: null,
      createdAt: now,
    });
    expect(lifecycleCreate).toHaveBeenCalledWith({
      data: {
        operatorAdminAccountId: "operator-account-1",
        actorAdminAccountId: "boss-account-1",
        action: "CREATED",
        previousNickname: null,
        newNickname: "Operator One",
        reason: null,
        createdAt: now,
      },
    });
  });
});
