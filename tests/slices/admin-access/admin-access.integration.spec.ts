import { createAdminAccessModule } from "../../../backend/src/slices/admin-access/presentation/admin-access.module";
import type { AdminAccessPrismaProvider } from "../../../backend/src/slices/admin-access/infrastructure/prisma-admin-access.repository";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";
import { AppError } from "../../../backend/src/shared/errors/app-error";

type AdminAccessPrismaClient = AdminAccessPrismaProvider["client"];

const createPrismaProvider = (client: AdminAccessPrismaClient): AdminAccessPrismaProvider => ({
  client,
});

describe("admin-access module integration", () => {
  it("normalizes credential lookup and reads recent failed login counts inside the lockout window", async () => {
    const adminAccountFindUnique = jest.fn().mockResolvedValue({
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS",
      isActive: true,
      lockedUntil: null,
      createdAt: new Date("2026-04-04T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T09:00:00.000Z"),
    });
    const adminAuthAuditCount = jest.fn().mockResolvedValue(4);
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: adminAccountFindUnique,
        update: jest.fn(),
      },
      adminSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      adminAuthAudit: {
        create: jest.fn(),
        count: adminAuthAuditCount,
      },
    });
    const context = createTestContext(prisma.client);
    const module = createAdminAccessModule(prisma);
    const passwordHasher = {
      verify: jest.fn().mockResolvedValue(true),
    };
    const now = new Date("2026-04-04T10:15:00.000Z");

    expect(context.prisma).toBe(prisma.client);
    await expect(
      module.controller.verifyCredentials(
        {
          login: "  BOSS@example.com  ",
          password: "super-secret-01",
          now,
        },
        passwordHasher,
      ),
    ).resolves.toEqual({
      ok: true,
      account: expect.objectContaining({
        id: "admin-account-1",
        role: "boss",
      }),
    });
    expect(adminAccountFindUnique).toHaveBeenCalledWith({
      where: {
        login: "boss@example.com",
      },
      select: {
        id: true,
        login: true,
        passwordHash: true,
        role: true,
        isActive: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await expect(module.controller.getRecentFailedLoginCount("admin-account-1", now)).resolves.toBe(4);
    expect(adminAuthAuditCount).toHaveBeenCalledWith({
      where: {
        adminAccountId: "admin-account-1",
        action: "LOGIN_FAILED",
        createdAt: {
          gte: new Date("2026-04-04T10:00:00.000Z"),
        },
      },
    });
  });

  it("persists session lifetime markers, hashed refresh token storage, and auth audit writes", async () => {
    const adminAccountUpdate = jest.fn().mockResolvedValue({
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS",
      isActive: true,
      lockedUntil: new Date("2026-04-04T10:45:00.000Z"),
      createdAt: new Date("2026-04-04T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:15:00.000Z"),
    });
    const adminSessionCreate = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token",
      accessTokenExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:15:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:45:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:15:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-04T10:15:00.000Z"),
      updatedAt: new Date("2026-04-04T10:15:00.000Z"),
    });
    const adminSessionUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const adminAuthAuditCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 201n,
        adminAccountId: "admin-account-1",
        action: "LOGIN_SUCCESS",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-login",
        reason: null,
        createdAt: new Date("2026-04-04T10:15:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: 202n,
        adminAccountId: "admin-account-1",
        action: "LOCKED",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-locked",
        reason: "threshold_reached",
        createdAt: new Date("2026-04-04T10:15:00.000Z"),
      });
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: jest.fn(),
        update: adminAccountUpdate,
      },
      adminSession: {
        create: adminSessionCreate,
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: adminSessionUpdateMany,
      },
      adminAuthAudit: {
        create: adminAuthAuditCreate,
        count: jest.fn(),
      },
    });
    const module = createAdminAccessModule(prisma);
    const tokenHasher = {
      hash: jest.fn().mockResolvedValue("hashed-refresh-token"),
    };
    const now = new Date("2026-04-04T10:15:00.000Z");

    await expect(
      module.controller.createSessionBaseline(
        {
          adminAccountId: "admin-account-1",
          refreshToken: "plain-refresh-token",
          now,
        },
        tokenHasher,
      ),
    ).resolves.toEqual({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token",
      accessTokenExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:15:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:45:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:15:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-04T10:15:00.000Z"),
      updatedAt: new Date("2026-04-04T10:15:00.000Z"),
    });
    expect(adminSessionCreate).toHaveBeenCalledWith({
      data: {
        adminAccountId: "admin-account-1",
        refreshTokenHash: "hashed-refresh-token",
        accessTokenExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
        refreshTokenExpiresAt: new Date("2026-04-07T10:15:00.000Z"),
        idleExpiresAt: new Date("2026-04-04T10:45:00.000Z"),
        lastActivityAt: new Date("2026-04-04T10:15:00.000Z"),
      },
    });

    await expect(
      module.controller.recordAuditBaseline({
        adminAccountId: "admin-account-1",
        action: "login_success",
        traceId: "trace-login",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        createdAt: now,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 201n,
        action: "login_success",
      }),
    );
    expect(adminAuthAuditCreate).toHaveBeenNthCalledWith(1, {
      data: {
        adminAccountId: "admin-account-1",
        action: "LOGIN_SUCCESS",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-login",
        reason: null,
        createdAt: now,
      },
    });

    await expect(
      module.controller.lockAccountBaseline({
        adminAccountId: "admin-account-1",
        traceId: "trace-locked",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        reason: "threshold_reached",
        now,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: "admin-account-1",
        lockedUntil: new Date("2026-04-04T10:45:00.000Z"),
      }),
    );
    expect(adminAccountUpdate).toHaveBeenCalledWith({
      where: {
        id: "admin-account-1",
      },
      data: {
        lockedUntil: new Date("2026-04-04T10:45:00.000Z"),
      },
      select: {
        id: true,
        login: true,
        passwordHash: true,
        role: true,
        isActive: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(adminSessionUpdateMany).toHaveBeenCalledWith({
      where: {
        adminAccountId: "admin-account-1",
        revokedAt: null,
      },
      data: {
        revokedAt: new Date("2026-04-04T10:15:00.000Z"),
      },
    });
    expect(adminAuthAuditCreate).toHaveBeenNthCalledWith(2, {
      data: {
        adminAccountId: "admin-account-1",
        action: "LOCKED",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-locked",
        reason: "threshold_reached",
        createdAt: now,
      },
    });
  });

  it("creates a session and writes login_success for a valid provisioned admin login", async () => {
    const adminAccountFindUnique = jest.fn().mockResolvedValue({
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS",
      isActive: true,
      lockedUntil: null,
      createdAt: new Date("2026-04-04T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T09:00:00.000Z"),
    });
    const adminSessionCreate = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token",
      accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:00:00.000Z"),
    });
    const adminAuthAuditCreate = jest.fn().mockResolvedValue({
      id: 301n,
      adminAccountId: "admin-account-1",
      action: "LOGIN_SUCCESS",
      ipAddress: "127.0.0.1",
      userAgent: "jest",
      traceId: "trace-login",
      reason: null,
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
    });
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: adminAccountFindUnique,
        update: jest.fn(),
      },
      adminSession: {
        create: adminSessionCreate,
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      adminAuthAudit: {
        create: adminAuthAuditCreate,
        count: jest.fn().mockResolvedValue(0),
      },
    });
    const module = createAdminAccessModule(prisma);

    await expect(
      module.controller.login(
        {
          login: "boss@example.com",
          password: "super-secret-01",
          traceId: "trace-login",
          ipAddress: "127.0.0.1",
          userAgent: "jest",
          now: new Date("2026-04-04T10:00:00.000Z"),
        },
        {
          passwordHasher: {
            verify: jest.fn().mockResolvedValue(true),
          },
          tokenHasher: {
            hash: jest.fn().mockResolvedValue("hashed-refresh-token"),
          },
          tokenFactory: {
            createTokenPair: jest.fn().mockResolvedValue({
              accessToken: "access-token-1",
              refreshToken: "refresh-token-1",
            }),
          },
        },
      ),
    ).resolves.toEqual({
      adminAccountId: "admin-account-1",
      role: "boss",
      accessToken: "access-token-1",
      refreshToken: "refresh-token-1",
      accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
    });

    expect(adminSessionCreate).toHaveBeenCalledTimes(1);
    expect(adminAuthAuditCreate).toHaveBeenCalledWith({
      data: {
        adminAccountId: "admin-account-1",
        action: "LOGIN_SUCCESS",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-login",
        reason: null,
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
      },
    });
  });

  it("writes login_failed and keeps session side effects absent when credentials are invalid", async () => {
    const adminAccountFindUnique = jest.fn().mockResolvedValue({
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS",
      isActive: true,
      lockedUntil: null,
      createdAt: new Date("2026-04-04T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T09:00:00.000Z"),
    });
    const adminSessionCreate = jest.fn();
    const adminAuthAuditCreate = jest.fn().mockResolvedValue({
      id: 302n,
      adminAccountId: "admin-account-1",
      action: "LOGIN_FAILED",
      ipAddress: "127.0.0.1",
      userAgent: "jest",
      traceId: "trace-invalid",
      reason: "invalid_credentials",
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
    });
    const adminAuthAuditCount = jest.fn().mockResolvedValue(1);
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: adminAccountFindUnique,
        update: jest.fn(),
      },
      adminSession: {
        create: adminSessionCreate,
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      adminAuthAudit: {
        create: adminAuthAuditCreate,
        count: adminAuthAuditCount,
      },
    });
    const module = createAdminAccessModule(prisma);

    await expect(
      module.controller.login(
        {
          login: "boss@example.com",
          password: "wrong-password-01",
          traceId: "trace-invalid",
          ipAddress: "127.0.0.1",
          userAgent: "jest",
          now: new Date("2026-04-04T10:00:00.000Z"),
        },
        {
          passwordHasher: {
            verify: jest.fn().mockResolvedValue(false),
          },
          tokenHasher: {
            hash: jest.fn(),
          },
          tokenFactory: {
            createTokenPair: jest.fn(),
          },
        },
      ),
    ).rejects.toEqual(new AppError("INVALID_CREDENTIALS", "Login or password is invalid", 401));

    expect(adminSessionCreate).not.toHaveBeenCalled();
    expect(adminAuthAuditCreate).toHaveBeenCalledWith({
      data: {
        adminAccountId: "admin-account-1",
        action: "LOGIN_FAILED",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-invalid",
        reason: "invalid_credentials",
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
      },
    });
    expect(adminAuthAuditCount).toHaveBeenCalledTimes(1);
  });

  it("locks the account on the fifth failure inside the 15-minute window and returns 429", async () => {
    const adminAccountFindUnique = jest.fn().mockResolvedValue({
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS",
      isActive: true,
      lockedUntil: null,
      createdAt: new Date("2026-04-04T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T09:00:00.000Z"),
    });
    const adminAccountUpdate = jest.fn().mockResolvedValue({
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS",
      isActive: true,
      lockedUntil: new Date("2026-04-04T10:30:00.000Z"),
      createdAt: new Date("2026-04-04T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:00:00.000Z"),
    });
    const adminSessionCreate = jest.fn();
    const adminSessionUpdateMany = jest.fn().mockResolvedValue({ count: 2 });
    const adminAuthAuditCreate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 303n,
        adminAccountId: "admin-account-1",
        action: "LOGIN_FAILED",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-locked",
        reason: "invalid_credentials",
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: 304n,
        adminAccountId: "admin-account-1",
        action: "LOCKED",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-locked",
        reason: "threshold_reached",
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
      });
    const adminAuthAuditCount = jest.fn().mockResolvedValue(5);
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: adminAccountFindUnique,
        update: adminAccountUpdate,
      },
      adminSession: {
        create: adminSessionCreate,
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: adminSessionUpdateMany,
      },
      adminAuthAudit: {
        create: adminAuthAuditCreate,
        count: adminAuthAuditCount,
      },
    });
    const module = createAdminAccessModule(prisma);

    await expect(
      module.controller.login(
        {
          login: "boss@example.com",
          password: "wrong-password-01",
          traceId: "trace-locked",
          ipAddress: "127.0.0.1",
          userAgent: "jest",
          now: new Date("2026-04-04T10:00:00.000Z"),
        },
        {
          passwordHasher: {
            verify: jest.fn().mockResolvedValue(false),
          },
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
        locked_until: "2026-04-04T10:30:00.000Z",
      }),
    );

    expect(adminSessionCreate).not.toHaveBeenCalled();
    expect(adminSessionUpdateMany).toHaveBeenCalledWith({
      where: {
        adminAccountId: "admin-account-1",
        revokedAt: null,
      },
      data: {
        revokedAt: new Date("2026-04-04T10:00:00.000Z"),
      },
    });
    expect(adminAccountUpdate).toHaveBeenCalledWith({
      where: {
        id: "admin-account-1",
      },
      data: {
        lockedUntil: new Date("2026-04-04T10:30:00.000Z"),
      },
      select: {
        id: true,
        login: true,
        passwordHash: true,
        role: true,
        isActive: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(adminAuthAuditCreate).toHaveBeenNthCalledWith(1, {
      data: {
        adminAccountId: "admin-account-1",
        action: "LOGIN_FAILED",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-locked",
        reason: "invalid_credentials",
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
      },
    });
    expect(adminAuthAuditCreate).toHaveBeenNthCalledWith(2, {
      data: {
        adminAccountId: "admin-account-1",
        action: "LOCKED",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-locked",
        reason: "threshold_reached",
        createdAt: new Date("2026-04-04T10:00:00.000Z"),
      },
    });
  });

  it("rotates the refresh token without extending the session lifetime", async () => {
    const adminAccountFindUnique = jest.fn().mockResolvedValue({
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS",
      isActive: true,
      lockedUntil: null,
      createdAt: new Date("2026-04-04T09:00:00.000Z"),
      updatedAt: new Date("2026-04-04T09:00:00.000Z"),
    });
    const adminSessionFindUnique = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token-1",
      accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:00:00.000Z"),
    });
    const adminSessionUpdate = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token-2",
      accessTokenExpiresAt: new Date("2026-04-04T10:35:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:50:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:20:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:20:00.000Z"),
    });
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: adminAccountFindUnique,
        update: jest.fn(),
      },
      adminSession: {
        create: jest.fn(),
        findUnique: adminSessionFindUnique,
        update: adminSessionUpdate,
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      adminAuthAudit: {
        create: jest.fn(),
        count: jest.fn(),
      },
    });
    const module = createAdminAccessModule(prisma);

    await expect(
      module.controller.refresh(
        {
          refreshToken: "refresh-token-1",
          traceId: "trace-refresh",
          now: new Date("2026-04-04T10:20:00.000Z"),
        },
        {
          tokenHasher: {
            hash: jest
              .fn()
              .mockResolvedValueOnce("hashed-refresh-token-1")
              .mockResolvedValueOnce("hashed-refresh-token-2"),
          },
          tokenFactory: {
            createTokenPair: jest.fn().mockResolvedValue({
              accessToken: "access-token-2",
              refreshToken: "refresh-token-2",
            }),
          },
        },
      ),
    ).resolves.toEqual({
      adminAccountId: "admin-account-1",
      role: "boss",
      accessToken: "access-token-2",
      refreshToken: "refresh-token-2",
      accessTokenExpiresAt: new Date("2026-04-04T10:35:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:50:00.000Z"),
    });

    expect(adminSessionUpdate).toHaveBeenCalledWith({
      where: {
        id: "session-1",
      },
      data: {
        refreshTokenHash: "hashed-refresh-token-2",
        accessTokenExpiresAt: new Date("2026-04-04T10:35:00.000Z"),
        refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
        idleExpiresAt: new Date("2026-04-04T10:50:00.000Z"),
        lastActivityAt: new Date("2026-04-04T10:20:00.000Z"),
      },
      select: {
        id: true,
        adminAccountId: true,
        refreshTokenHash: true,
        accessTokenExpiresAt: true,
        refreshTokenExpiresAt: true,
        idleExpiresAt: true,
        lastActivityAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });

  it("rejects an expired refresh token and revokes the session", async () => {
    const adminSessionFindUnique = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token-1",
      accessTokenExpiresAt: new Date("2026-04-07T09:55:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:00:00.000Z"),
    });
    const adminSessionUpdate = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token-1",
      accessTokenExpiresAt: new Date("2026-04-07T09:55:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
      revokedAt: new Date("2026-04-07T10:00:01.000Z"),
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: new Date("2026-04-07T10:00:01.000Z"),
    });
    const tokenFactory = {
      createTokenPair: jest.fn(),
    };
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      adminSession: {
        create: jest.fn(),
        findUnique: adminSessionFindUnique,
        update: adminSessionUpdate,
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      adminAuthAudit: {
        create: jest.fn(),
        count: jest.fn(),
      },
    });
    const module = createAdminAccessModule(prisma);

    await expect(
      module.controller.refresh(
        {
          refreshToken: "refresh-token-1",
          traceId: "trace-refresh-expired",
          now: new Date("2026-04-07T10:00:01.000Z"),
        },
        {
          tokenHasher: {
            hash: jest.fn().mockResolvedValue("hashed-refresh-token-1"),
          },
          tokenFactory,
        },
      ),
    ).rejects.toEqual(
      new AppError("SESSION_EXPIRED", "Admin session has expired", 401, {
        reason: "refresh_expired",
      }),
    );

    expect(adminSessionUpdate).toHaveBeenCalledWith({
      where: {
        id: "session-1",
      },
      data: {
        revokedAt: new Date("2026-04-07T10:00:01.000Z"),
      },
      select: {
        id: true,
        adminAccountId: true,
        refreshTokenHash: true,
        accessTokenExpiresAt: true,
        refreshTokenExpiresAt: true,
        idleExpiresAt: true,
        lastActivityAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(tokenFactory.createTokenPair).not.toHaveBeenCalled();
  });

  it("revokes the active session and writes logout audit", async () => {
    const adminSessionFindUnique = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token-1",
      accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
      revokedAt: null,
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:00:00.000Z"),
    });
    const adminSessionUpdate = jest.fn().mockResolvedValue({
      id: "session-1",
      adminAccountId: "admin-account-1",
      refreshTokenHash: "hashed-refresh-token-1",
      accessTokenExpiresAt: new Date("2026-04-04T10:15:00.000Z"),
      refreshTokenExpiresAt: new Date("2026-04-07T10:00:00.000Z"),
      idleExpiresAt: new Date("2026-04-04T10:30:00.000Z"),
      lastActivityAt: new Date("2026-04-04T10:00:00.000Z"),
      revokedAt: new Date("2026-04-04T10:10:00.000Z"),
      createdAt: new Date("2026-04-04T10:00:00.000Z"),
      updatedAt: new Date("2026-04-04T10:10:00.000Z"),
    });
    const adminAuthAuditCreate = jest.fn().mockResolvedValue({
      id: 401n,
      adminAccountId: "admin-account-1",
      action: "LOGOUT",
      ipAddress: "127.0.0.1",
      userAgent: "jest",
      traceId: "trace-logout",
      reason: null,
      createdAt: new Date("2026-04-04T10:10:00.000Z"),
    });
    const prisma = createPrismaProvider({
      adminAccount: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      adminSession: {
        create: jest.fn(),
        findUnique: adminSessionFindUnique,
        update: adminSessionUpdate,
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      adminAuthAudit: {
        create: adminAuthAuditCreate,
        count: jest.fn(),
      },
    });
    const module = createAdminAccessModule(prisma);

    await expect(
      module.controller.logout(
        {
          refreshToken: "refresh-token-1",
          traceId: "trace-logout",
          ipAddress: "127.0.0.1",
          userAgent: "jest",
          now: new Date("2026-04-04T10:10:00.000Z"),
        },
        {
          tokenHasher: {
            hash: jest.fn().mockResolvedValue("hashed-refresh-token-1"),
          },
        },
      ),
    ).resolves.toEqual({ loggedOut: true });

    expect(adminSessionUpdate).toHaveBeenCalledWith({
      where: {
        id: "session-1",
      },
      data: {
        revokedAt: new Date("2026-04-04T10:10:00.000Z"),
      },
      select: {
        id: true,
        adminAccountId: true,
        refreshTokenHash: true,
        accessTokenExpiresAt: true,
        refreshTokenExpiresAt: true,
        idleExpiresAt: true,
        lastActivityAt: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(adminAuthAuditCreate).toHaveBeenCalledWith({
      data: {
        adminAccountId: "admin-account-1",
        action: "LOGOUT",
        ipAddress: "127.0.0.1",
        userAgent: "jest",
        traceId: "trace-logout",
        reason: null,
        createdAt: new Date("2026-04-04T10:10:00.000Z"),
      },
    });
  });
});
