import type {
  AdminAccessCredentialVerificationResult,
  AdminAccessPasswordHasher,
  AdminAccessRepository,
  AdminAccessSessionRecord,
  AdminAccessSessionTimeline,
  AdminAccessTokenFactory,
  AdminAccessTokenHasher,
  CreateAdminSessionBaselineInput,
  LoginAdminAccessInput,
  LoginAdminAccessResult,
  LockAdminAccountBaselineInput,
  LogoutAdminAccessInput,
  LogoutAdminAccessResult,
  RefreshAdminAccessInput,
  RefreshAdminAccessResult,
  RecordAdminAuditBaselineInput,
  VerifyAdminCredentialsInput,
} from "../domain/admin-access.types";
import {
  ADMIN_ACCESS_ACCESS_TOKEN_TTL_MS,
  ADMIN_ACCESS_FAILURE_THRESHOLD,
  ADMIN_ACCESS_FAILURE_WINDOW_MS,
  ADMIN_ACCESS_IDLE_TIMEOUT_MS,
  ADMIN_ACCESS_LOCKOUT_MS,
  ADMIN_ACCESS_PASSWORD_MIN_LENGTH,
  ADMIN_ACCESS_REFRESH_TOKEN_TTL_MS,
} from "../domain/admin-access.types";
import { AppError } from "../../../shared/errors/app-error";

export const buildAdminAccessSessionTimeline = (issuedAt: Date): AdminAccessSessionTimeline => ({
  accessTokenExpiresAt: new Date(issuedAt.getTime() + ADMIN_ACCESS_ACCESS_TOKEN_TTL_MS),
  refreshTokenExpiresAt: new Date(issuedAt.getTime() + ADMIN_ACCESS_REFRESH_TOKEN_TTL_MS),
  idleExpiresAt: new Date(issuedAt.getTime() + ADMIN_ACCESS_IDLE_TIMEOUT_MS),
  lastActivityAt: issuedAt,
});

export const buildAdminAccessRefreshTimeline = (
  refreshedAt: Date,
  refreshTokenExpiresAt: Date,
): AdminAccessSessionTimeline => ({
  accessTokenExpiresAt: new Date(refreshedAt.getTime() + ADMIN_ACCESS_ACCESS_TOKEN_TTL_MS),
  refreshTokenExpiresAt,
  idleExpiresAt: new Date(refreshedAt.getTime() + ADMIN_ACCESS_IDLE_TIMEOUT_MS),
  lastActivityAt: refreshedAt,
});

export const countRecentAdminAccessFailures = (failedAt: Date[], now: Date): number => {
  const threshold = now.getTime() - ADMIN_ACCESS_FAILURE_WINDOW_MS;

  return failedAt.filter((attempt) => attempt.getTime() >= threshold).length;
};

export const shouldLockAdminAccessAccount = (failedAt: Date[], now: Date): boolean =>
  countRecentAdminAccessFailures(failedAt, now) >= ADMIN_ACCESS_FAILURE_THRESHOLD;

export const resolveAdminAccessLockoutUntil = (now: Date): Date =>
  new Date(now.getTime() + ADMIN_ACCESS_LOCKOUT_MS);

const normalizeLogin = (login: string): string => login.trim().toLowerCase();

const toLockedError = (lockedUntil: Date): AppError =>
  new AppError("TOO_MANY_REQUESTS", "Admin account is temporarily locked", 429, {
    locked_until: lockedUntil.toISOString(),
  });

const toInvalidSessionError = (): AppError =>
  new AppError("INVALID_SESSION", "Admin session is invalid or revoked", 401);

const toExpiredSessionError = (reason: "refresh_expired" | "idle_timeout"): AppError =>
  new AppError("SESSION_EXPIRED", "Admin session has expired", 401, {
    reason,
  });

const resolveSessionExpiryReason = (
  session: AdminAccessSessionRecord,
  now: Date,
): "refresh_expired" | "idle_timeout" | null => {
  if (session.refreshTokenExpiresAt.getTime() <= now.getTime()) {
    return "refresh_expired";
  }

  if (session.idleExpiresAt.getTime() <= now.getTime()) {
    return "idle_timeout";
  }

  return null;
};

export class AdminAccessService {
  constructor(private readonly repository: AdminAccessRepository) {}

  findAccountByLogin(login: string) {
    return this.repository.findAccountByLogin(normalizeLogin(login));
  }

  findSessionByRefreshTokenHash(refreshTokenHash: string) {
    return this.repository.findSessionByRefreshTokenHash(refreshTokenHash);
  }

  countRecentFailedLoginAttempts(adminAccountId: string, now = new Date()) {
    return this.repository.countFailedLoginAuditsSince({
      adminAccountId,
      since: new Date(now.getTime() - ADMIN_ACCESS_FAILURE_WINDOW_MS),
    });
  }

  async verifyCredentials(
    input: VerifyAdminCredentialsInput,
    passwordHasher: AdminAccessPasswordHasher,
  ): Promise<AdminAccessCredentialVerificationResult> {
    const now = input.now ?? new Date();
    const account = await this.repository.findAccountByLogin(normalizeLogin(input.login));

    if (account === null || input.password.length < ADMIN_ACCESS_PASSWORD_MIN_LENGTH) {
      return {
        ok: false,
        reason: "INVALID_CREDENTIALS",
      };
    }

    if (!account.isActive) {
      return {
        ok: false,
        reason: "ACCOUNT_INACTIVE",
      };
    }

    if (account.lockedUntil !== null && account.lockedUntil.getTime() > now.getTime()) {
      return {
        ok: false,
        reason: "ACCOUNT_LOCKED",
        lockedUntil: account.lockedUntil,
      };
    }

    const passwordMatches = await passwordHasher.verify(input.password, account.passwordHash);

    if (!passwordMatches) {
      return {
        ok: false,
        reason: "INVALID_CREDENTIALS",
      };
    }

    return {
      ok: true,
      account,
    };
  }

  async createSessionBaseline(
    input: CreateAdminSessionBaselineInput,
    tokenHasher: AdminAccessTokenHasher,
  ) {
    const now = input.now ?? new Date();
    const refreshTokenHash = await tokenHasher.hash(input.refreshToken);
    const timeline = buildAdminAccessSessionTimeline(now);

    return this.repository.createSession({
      adminAccountId: input.adminAccountId,
      refreshTokenHash,
      accessTokenExpiresAt: timeline.accessTokenExpiresAt,
      refreshTokenExpiresAt: timeline.refreshTokenExpiresAt,
      idleExpiresAt: timeline.idleExpiresAt,
      lastActivityAt: timeline.lastActivityAt,
    });
  }

  recordAuditBaseline(input: RecordAdminAuditBaselineInput) {
    return this.repository.recordAudit({
      adminAccountId: input.adminAccountId,
      action: input.action,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      traceId: input.traceId,
      reason: input.reason ?? null,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  async lockAccountBaseline(input: LockAdminAccountBaselineInput) {
    const now = input.now ?? new Date();
    const lockedUntil = resolveAdminAccessLockoutUntil(now);
    const account = await this.repository.setAccountLockout({
      adminAccountId: input.adminAccountId,
      lockedUntil,
    });

    await this.repository.revokeSessionsByAccount({
      adminAccountId: input.adminAccountId,
      revokedAt: now,
    });

    await this.repository.recordAudit({
      adminAccountId: input.adminAccountId,
      action: "locked",
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      traceId: input.traceId,
      reason: input.reason ?? null,
      createdAt: now,
    });

    return account;
  }

  private async getActiveSessionByRefreshToken(
    refreshToken: string,
    tokenHasher: AdminAccessTokenHasher,
  ): Promise<AdminAccessSessionRecord | null> {
    const refreshTokenHash = await tokenHasher.hash(refreshToken);

    return this.repository.findSessionByRefreshTokenHash(refreshTokenHash);
  }

  private async revokeSessionIfNeeded(session: AdminAccessSessionRecord, revokedAt: Date) {
    if (session.revokedAt !== null) {
      return session;
    }

    return this.repository.revokeSession({
      sessionId: session.id,
      revokedAt,
    });
  }

  async login(
    input: LoginAdminAccessInput,
    dependencies: {
      passwordHasher: AdminAccessPasswordHasher;
      tokenHasher: AdminAccessTokenHasher;
      tokenFactory: AdminAccessTokenFactory;
    },
  ): Promise<LoginAdminAccessResult> {
    const now = input.now ?? new Date();
    const verification = await this.verifyCredentials(
      {
        login: input.login,
        password: input.password,
        now,
      },
      dependencies.passwordHasher,
    );

    if (!verification.ok) {
      if (verification.reason === "ACCOUNT_LOCKED") {
        throw toLockedError(verification.lockedUntil ?? resolveAdminAccessLockoutUntil(now));
      }

      const account = await this.findAccountByLogin(input.login);

      if (account !== null) {
        await this.recordAuditBaseline({
          adminAccountId: account.id,
          action: "login_failed",
          traceId: input.traceId,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
          reason: verification.reason.toLowerCase(),
          createdAt: now,
        });

        if (verification.reason === "INVALID_CREDENTIALS" && account.isActive) {
          const recentFailureCount = await this.countRecentFailedLoginAttempts(account.id, now);

          if (recentFailureCount >= ADMIN_ACCESS_FAILURE_THRESHOLD) {
            const lockedAccount = await this.lockAccountBaseline({
              adminAccountId: account.id,
              traceId: input.traceId,
              ipAddress: input.ipAddress,
              userAgent: input.userAgent,
              reason: "threshold_reached",
              now,
            });

            throw toLockedError(lockedAccount.lockedUntil ?? resolveAdminAccessLockoutUntil(now));
          }
        }
      }

      throw new AppError("INVALID_CREDENTIALS", "Login or password is invalid", 401);
    }

    const tokenPair = await dependencies.tokenFactory.createTokenPair();
    const session = await this.createSessionBaseline(
      {
        adminAccountId: verification.account.id,
        refreshToken: tokenPair.refreshToken,
        now,
      },
      dependencies.tokenHasher,
    );

    await this.recordAuditBaseline({
      adminAccountId: verification.account.id,
      action: "login_success",
      traceId: input.traceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: now,
    });

    return {
      adminAccountId: verification.account.id,
      role: verification.account.role,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      idleExpiresAt: session.idleExpiresAt,
    };
  }

  async refresh(
    input: RefreshAdminAccessInput,
    dependencies: {
      tokenHasher: AdminAccessTokenHasher;
      tokenFactory: AdminAccessTokenFactory;
    },
  ): Promise<RefreshAdminAccessResult> {
    const now = input.now ?? new Date();
    const session = await this.getActiveSessionByRefreshToken(input.refreshToken, dependencies.tokenHasher);

    if (session === null || session.revokedAt !== null) {
      throw toInvalidSessionError();
    }

    const expiryReason = resolveSessionExpiryReason(session, now);

    if (expiryReason !== null) {
      await this.revokeSessionIfNeeded(session, now);
      throw toExpiredSessionError(expiryReason);
    }

    const account = await this.repository.findAccountById(session.adminAccountId);

    if (account === null || !account.isActive) {
      await this.revokeSessionIfNeeded(session, now);
      throw toInvalidSessionError();
    }

    const tokenPair = await dependencies.tokenFactory.createTokenPair();
    const refreshTokenHash = await dependencies.tokenHasher.hash(tokenPair.refreshToken);
    const timeline = buildAdminAccessRefreshTimeline(now, session.refreshTokenExpiresAt);
    const refreshedSession = await this.repository.updateSession({
      sessionId: session.id,
      refreshTokenHash,
      accessTokenExpiresAt: timeline.accessTokenExpiresAt,
      refreshTokenExpiresAt: timeline.refreshTokenExpiresAt,
      idleExpiresAt: timeline.idleExpiresAt,
      lastActivityAt: timeline.lastActivityAt,
    });

    return {
      adminAccountId: account.id,
      role: account.role,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: refreshedSession.accessTokenExpiresAt,
      refreshTokenExpiresAt: refreshedSession.refreshTokenExpiresAt,
      idleExpiresAt: refreshedSession.idleExpiresAt,
    };
  }

  async logout(
    input: LogoutAdminAccessInput,
    dependencies: {
      tokenHasher: AdminAccessTokenHasher;
    },
  ): Promise<LogoutAdminAccessResult> {
    const now = input.now ?? new Date();
    const session = await this.getActiveSessionByRefreshToken(input.refreshToken, dependencies.tokenHasher);

    if (session === null) {
      return { loggedOut: false };
    }

    const expiryReason = resolveSessionExpiryReason(session, now);

    if (expiryReason !== null || session.revokedAt !== null) {
      await this.revokeSessionIfNeeded(session, now);

      return { loggedOut: false };
    }

    await this.repository.revokeSession({
      sessionId: session.id,
      revokedAt: now,
    });

    await this.recordAuditBaseline({
      adminAccountId: session.adminAccountId,
      action: "logout",
      traceId: input.traceId,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      createdAt: now,
    });

    return { loggedOut: true };
  }
}
