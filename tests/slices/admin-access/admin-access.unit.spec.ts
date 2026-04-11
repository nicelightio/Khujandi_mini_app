import {
  AdminAccessService,
  buildAdminAccessRefreshTimeline,
  buildAdminAccessSessionTimeline,
  countRecentAdminAccessFailures,
  resolveAdminAccessLockoutUntil,
  shouldLockAdminAccessAccount,
} from "../../../backend/src/slices/admin-access/application/admin-access.service";
import { AppError } from "../../../backend/src/shared/errors/app-error";
import type {
  AdminAccessPasswordHasher,
  AdminAccessRepository,
} from "../../../backend/src/slices/admin-access/domain/admin-access.types";

const createRepository = (): AdminAccessRepository => ({
  findAccountByLogin: async () => ({
    id: "admin-account-1",
    login: "boss@example.com",
    passwordHash: "stored-hash",
    role: "boss",
    isActive: true,
    lockedUntil: null,
    createdAt: new Date("2026-04-04T09:00:00.000Z"),
    updatedAt: new Date("2026-04-04T09:00:00.000Z"),
  }),
  createSession: async (input) => ({
    id: "session-1",
    revokedAt: null,
    createdAt: input.lastActivityAt,
    updatedAt: input.lastActivityAt,
    ...input,
  }),
  findSessionByRefreshTokenHash: async () => null,
  findAccountById: async () => ({
    id: "admin-account-1",
    login: "boss@example.com",
    passwordHash: "stored-hash",
    role: "boss",
    isActive: true,
    lockedUntil: null,
    createdAt: new Date("2026-04-04T09:00:00.000Z"),
    updatedAt: new Date("2026-04-04T09:00:00.000Z"),
  }),
  updateSession: async (input) => ({
    id: input.sessionId,
    adminAccountId: "admin-account-1",
    revokedAt: null,
    createdAt: new Date("2026-04-04T09:00:00.000Z"),
    updatedAt: input.lastActivityAt,
    ...input,
  }),
  revokeSession: async (input) => ({
    id: input.sessionId,
    adminAccountId: "admin-account-1",
    accessTokenHash: "hashed-access-token",
    refreshTokenHash: "hashed-refresh-token",
    accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
    refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
    idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
    lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
    revokedAt: input.revokedAt,
    createdAt: new Date("2026-04-04T09:00:00.000Z"),
    updatedAt: input.revokedAt,
  }),
  revokeSessionsByAccount: async () => 0,
  recordAudit: async (input) => ({
    id: 101n,
    ...input,
  }),
  countFailedLoginAuditsSince: async () => 0,
  setAccountLockout: async (input) => ({
    id: "admin-account-1",
    login: "boss@example.com",
    passwordHash: "stored-hash",
    role: "boss",
    isActive: true,
    lockedUntil: input.lockedUntil,
    createdAt: new Date("2026-04-04T09:00:00.000Z"),
    updatedAt: input.lockedUntil,
  }),
});

describe("admin-access service", () => {
  it("counts recent failures inside the 15-minute lockout window", () => {
    const now = new Date("2026-04-04T10:15:00.000Z");
    const failedAt = [
      new Date("2026-04-04T10:14:59.000Z"),
      new Date("2026-04-04T10:10:00.000Z"),
      new Date("2026-04-04T10:05:01.000Z"),
      new Date("2026-04-04T09:59:59.000Z"),
      new Date("2026-04-04T10:03:00.000Z"),
    ];

    expect(countRecentAdminAccessFailures(failedAt, now)).toBe(4);
    expect(shouldLockAdminAccessAccount(failedAt, now)).toBe(false);
    expect(
      shouldLockAdminAccessAccount(
        [...failedAt, new Date("2026-04-04T10:12:00.000Z")],
        now,
      ),
    ).toBe(true);
    expect(resolveAdminAccessLockoutUntil(now).toISOString()).toBe("2026-04-04T10:45:00.000Z");
  });

  it("builds admin session lifetime markers from the baseline policy", () => {
    const issuedAt = new Date("2026-04-04T10:00:00.000Z");

    expect(buildAdminAccessSessionTimeline(issuedAt)).toEqual({
      accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: issuedAt,
    });
  });

  it("keeps the refresh lifetime fixed while extending access and idle markers on refresh", () => {
    const refreshedAt = new Date("2026-04-04T10:20:00.000Z");
    const refreshTokenExpiresAt = new Date("2026-04-07T10:00:00.000Z");

    expect(buildAdminAccessRefreshTimeline(refreshedAt, refreshTokenExpiresAt)).toEqual({
      accessTokenExpiresAt: new Date("2026-04-04T10:35:00.000Z"),
      refreshTokenExpiresAt,
      idleExpiresAt: new Date("2026-04-04T10:50:00.000Z"),
      lastActivityAt: refreshedAt,
    });
  });

  it("verifies credentials only for active and unlocked provisioned accounts", async () => {
    const repository = createRepository();
    const service = new AdminAccessService(repository);
    const passwordHasher: AdminAccessPasswordHasher = {
      verify: jest.fn().mockResolvedValue(true),
    };

    await expect(
      service.verifyCredentials(
        {
          login: "  BOSS@example.com  ",
          password: "super-secret-01",
          now: new Date("2026-04-04T10:00:00.000Z"),
        },
        passwordHasher,
      ),
    ).resolves.toEqual({
      ok: true,
      account: expect.objectContaining({
        id: "admin-account-1",
        login: "boss@example.com",
        role: "boss",
      }),
    });

    const lockedRepository: AdminAccessRepository = {
      ...repository,
      findAccountByLogin: async () => ({
        id: "admin-account-2",
        login: "admin@example.com",
        passwordHash: "stored-hash",
        role: "admin",
        isActive: true,
        lockedUntil: new Date("2026-04-04T10:20:00.000Z"),
        createdAt: new Date("2026-04-04T09:00:00.000Z"),
        updatedAt: new Date("2026-04-04T09:00:00.000Z"),
      }),
    };

    await expect(
      new AdminAccessService(lockedRepository).verifyCredentials(
        {
          login: "admin@example.com",
          password: "super-secret-01",
          now: new Date("2026-04-04T10:00:00.000Z"),
        },
        passwordHasher,
      ),
    ).resolves.toEqual({
      ok: false,
      reason: "ACCOUNT_LOCKED",
      lockedUntil: new Date("2026-04-04T10:20:00.000Z"),
    });
  });

  it("returns 429 without password verification when the account is already locked", async () => {
    const passwordHasher: AdminAccessPasswordHasher = {
      verify: jest.fn().mockResolvedValue(true),
    };
    const lockedRepository: AdminAccessRepository = {
      ...createRepository(),
      findAccountByLogin: async () => ({
        id: "admin-account-2",
        login: "admin@example.com",
        passwordHash: "stored-hash",
        role: "admin",
        isActive: true,
        lockedUntil: new Date("2026-04-04T10:20:00.000Z"),
        createdAt: new Date("2026-04-04T09:00:00.000Z"),
        updatedAt: new Date("2026-04-04T09:00:00.000Z"),
      }),
      recordAudit: jest.fn(async (input) => ({
        id: 101n,
        ...input,
      })),
      countFailedLoginAuditsSince: jest.fn(async () => 2),
    };
    const service = new AdminAccessService(lockedRepository);

    await expect(
      service.login(
        {
          login: "admin@example.com",
          password: "super-secret-01",
          traceId: "trace-locked",
          now: new Date("2026-04-04T10:00:00.000Z"),
        },
        {
          passwordHasher,
          tokenHasher: {
            hash: jest.fn(),
          },
          tokenFactory: {
            createTokenPair: jest.fn(),
          },
        },
      ),
    ).rejects.toEqual(
      new AppError("TOO_MANY_REQUESTS", "Admin account is temporarily locked", 429, {
        locked_until: "2026-04-04T10:20:00.000Z",
      }),
    );

    expect(passwordHasher.verify).not.toHaveBeenCalled();
  });

  it("rejects refresh for an idle-expired session and revokes the session", async () => {
    const revokeSession = jest.fn(async (input) => ({
      id: input.sessionId,
      adminAccountId: "admin-account-1",
      accessTokenHash: "hashed-access-token",
      refreshTokenHash: "hashed-refresh-token",
      accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
      revokedAt: input.revokedAt,
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: input.revokedAt,
    }));
    const repository: AdminAccessRepository = {
      ...createRepository(),
      findSessionByRefreshTokenHash: async () => ({
        id: "session-1",
        adminAccountId: "admin-account-1",
        accessTokenHash: "hashed-access-token",
        refreshTokenHash: "hashed-refresh-token",
        accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
        refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
        idleExpiresAt: new Date("2026-04-04T10:29:00.000Z"),
        lastActivityAt: new Date("2026-04-04T09:59:00.000Z"),
        revokedAt: null,
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
        updatedAt: new Date("2026-04-04T10:00:00.000Z"),
      }),
      revokeSession,
    };
    const service = new AdminAccessService(repository);

    await expect(
      service.refresh(
        {
          refreshToken: "refresh-token-1",
          traceId: "trace-refresh-expired",
          now: new Date("2026-04-04T10:30:00.000Z"),
        },
        {
          tokenHasher: {
            hash: jest.fn().mockResolvedValue("hashed-refresh-token"),
          },
          tokenFactory: {
            createTokenPair: jest.fn(),
          },
        },
      ),
    ).rejects.toEqual(
      new AppError("SESSION_EXPIRED", "Admin session has expired", 401, {
        reason: "idle_timeout",
      }),
    );

    expect(revokeSession).toHaveBeenCalledWith({
      sessionId: "session-1",
      revokedAt: new Date("2026-04-04T10:30:00.000Z"),
    });
  });
});
