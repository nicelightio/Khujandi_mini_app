import type {
  AdminAccessCredentialVerificationResult,
  AdminAccessOperatorStaffRecord,
  AdminAccessOperatorStaffRepository,
  AdminAccessPasswordHashing,
  AdminAccessPasswordHasher,
  AdminAccessRepository,
  AdminAccessSessionRecord,
  AdminAccessSessionTimeline,
  AdminAccessTokenFactory,
  AdminAccessTokenHasher,
  AdjustAdminAccessOperatorStaffRatingCommandInput,
  AdjustAdminAccessOperatorStaffRatingCommandResult,
  CreateAdminSessionBaselineInput,
  CreateAdminAccessOperatorStaffAccountInput,
  CreateAdminAccessOperatorStaffAccountResult,
  DeactivateAdminAccessOperatorStaffCommandInput,
  DeactivateAdminAccessOperatorStaffCommandResult,
  LoginAdminAccessInput,
  LoginAdminAccessResult,
  LockAdminAccountBaselineInput,
  LogoutAdminAccessInput,
  LogoutAdminAccessResult,
  RefreshAdminAccessInput,
  RefreshAdminAccessResult,
  RecordAdminAuditBaselineInput,
  ReactivateAdminAccessOperatorStaffCommandInput,
  ReactivateAdminAccessOperatorStaffCommandResult,
  ResolveProtectedAdminSessionInput,
  ResolveProtectedAdminSessionResult,
  ResetAdminAccessOperatorStaffPasswordInput,
  ResetAdminAccessOperatorStaffPasswordResult,
  UpdateAdminAccessOperatorStaffNicknameCommandInput,
  UpdateAdminAccessOperatorStaffNicknameCommandResult,
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

const normalizeNickname = (nickname: string): string => nickname.trim();

const OPERATOR_PASSWORD_RESET_LIFECYCLE_REASON = "password_reset";

const isStaffPanelActorRole = (role: string): boolean => role === "admin" || role === "boss";

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

const toForbiddenStaffPanelError = (): AppError =>
  new AppError("FORBIDDEN", "Staff panel requires admin or boss access", 403);

const toBossOnlyError = (): AppError =>
  new AppError("FORBIDDEN", "This operator staff action requires boss access", 403);

const assertStrongAdminPassword = (password: string): void => {
  if (password.length < ADMIN_ACCESS_PASSWORD_MIN_LENGTH) {
    throw new AppError("WEAK_PASSWORD", "Operator password does not meet admin auth policy", 400, {
      min_length: ADMIN_ACCESS_PASSWORD_MIN_LENGTH,
    });
  }
};

const assertValidOperatorNickname = (nickname: string): void => {
  if (nickname.length === 0) {
    throw new AppError("VALIDATION_ERROR", "Operator nickname is required", 400);
  }
};

const normalizeOptionalReason = (reason?: string | null): string | null => {
  const normalized = reason?.trim() ?? "";

  return normalized.length === 0 ? null : normalized;
};

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
  constructor(
    private readonly repository: AdminAccessRepository,
    private readonly operatorStaffRepository?: AdminAccessOperatorStaffRepository,
  ) {}

  private getOperatorStaffRepository(): AdminAccessOperatorStaffRepository {
    if (this.operatorStaffRepository === undefined) {
      throw new Error("AdminAccessService requires an operator staff repository for staff commands.");
    }

    return this.operatorStaffRepository;
  }

  private async requireStaffPanelActor(actorAdminAccountId: string) {
    const actor = await this.repository.findAccountById(actorAdminAccountId);

    if (actor === null || !actor.isActive || !isStaffPanelActorRole(actor.role)) {
      throw toForbiddenStaffPanelError();
    }

    return actor;
  }

  private async requireBossActor(actorAdminAccountId: string) {
    const actor = await this.repository.findAccountById(actorAdminAccountId);

    if (actor === null || !actor.isActive) {
      throw toForbiddenStaffPanelError();
    }

    if (actor.role !== "boss") {
      throw toBossOnlyError();
    }

    return actor;
  }

  private async requireActiveOperatorStaff(
    operatorAdminAccountId: string,
  ): Promise<AdminAccessOperatorStaffRecord> {
    const operator = await this.requireOperatorStaffTarget(operatorAdminAccountId);

    if (!operator.authActive || operator.lifecycle.staffDeactivatedAt !== null) {
      throw new AppError("OPERATOR_INACTIVE", "Operator staff account is inactive", 409);
    }

    return operator;
  }

  private async requireOperatorStaffTarget(
    operatorAdminAccountId: string,
  ): Promise<AdminAccessOperatorStaffRecord> {
    const operator = await this.getOperatorStaffRepository().findOperatorStaffById(operatorAdminAccountId);

    if (operator === null) {
      throw new AppError("OPERATOR_NOT_FOUND", "Operator staff account was not found", 404);
    }

    return operator;
  }

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
    const accessTokenHash = await tokenHasher.hash(input.accessToken);
    const refreshTokenHash = await tokenHasher.hash(input.refreshToken);
    const timeline = buildAdminAccessSessionTimeline(now);

    return this.repository.createSession({
      adminAccountId: input.adminAccountId,
      accessTokenHash,
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

  async createOperatorStaffAccount(
    input: CreateAdminAccessOperatorStaffAccountInput,
    dependencies: {
      passwordHashing: AdminAccessPasswordHashing;
    },
  ): Promise<CreateAdminAccessOperatorStaffAccountResult> {
    const now = input.now ?? new Date();
    const role = input.role ?? "operator";

    await this.requireStaffPanelActor(input.actorAdminAccountId);

    if (role !== "operator") {
      throw new AppError("INVALID_OPERATOR_ROLE", "Staff panel can create only operator accounts", 400, {
        requested_role: role,
      });
    }

    const login = normalizeLogin(input.login);
    const nickname = normalizeNickname(input.nickname);

    if (login.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Operator login is required", 400);
    }

    assertValidOperatorNickname(nickname);
    assertStrongAdminPassword(input.password);

    const existingAccount = await this.repository.findAccountByLogin(login);

    if (existingAccount !== null) {
      throw new AppError("DUPLICATE_LOGIN", "Operator login already exists", 409);
    }

    const passwordHash = await dependencies.passwordHashing.hash(input.password);
    const operatorStaffRepository = this.getOperatorStaffRepository();
    const operator = await operatorStaffRepository.createOperatorStaff({
      login,
      nickname,
      passwordHash,
      actorAdminAccountId: input.actorAdminAccountId,
      createdAt: now,
    });

    await operatorStaffRepository.recordOperatorStaffLifecycleEvent({
      operatorAdminAccountId: operator.id,
      actorAdminAccountId: input.actorAdminAccountId,
      action: "created",
      previousNickname: null,
      newNickname: nickname,
      reason: null,
      createdAt: now,
    });

    return {
      operator,
      oneTimePassword: input.password,
    };
  }

  async deactivateOperatorStaff(
    input: DeactivateAdminAccessOperatorStaffCommandInput,
  ): Promise<DeactivateAdminAccessOperatorStaffCommandResult> {
    const now = input.now ?? new Date();

    await this.requireStaffPanelActor(input.actorAdminAccountId);
    const target = await this.requireOperatorStaffTarget(input.operatorAdminAccountId);

    if (target.lifecycle.staffDeactivatedAt !== null || !target.authActive) {
      throw new AppError("OPERATOR_INACTIVE", "Operator staff account is already inactive", 409, {
        operatorAdminAccountId: target.id,
      });
    }

    const operatorStaffRepository = this.getOperatorStaffRepository();
    const operator = await operatorStaffRepository.deactivateOperatorStaff({
      operatorAdminAccountId: target.id,
      actorAdminAccountId: input.actorAdminAccountId,
      deactivatedAt: now,
    });
    const revokedSessionCount = await this.repository.revokeSessionsByAccount({
      adminAccountId: target.id,
      revokedAt: now,
    });

    await operatorStaffRepository.recordOperatorStaffLifecycleEvent({
      operatorAdminAccountId: target.id,
      actorAdminAccountId: input.actorAdminAccountId,
      action: "deactivated",
      previousNickname: target.nickname,
      newNickname: target.nickname,
      reason: normalizeOptionalReason(input.reason),
      createdAt: now,
    });

    return {
      operator,
      revokedSessionCount,
    };
  }

  async reactivateOperatorStaff(
    input: ReactivateAdminAccessOperatorStaffCommandInput,
  ): Promise<ReactivateAdminAccessOperatorStaffCommandResult> {
    const now = input.now ?? new Date();

    await this.requireBossActor(input.actorAdminAccountId);
    const target = await this.requireOperatorStaffTarget(input.operatorAdminAccountId);

    if (target.lifecycle.staffDeactivatedAt === null && target.authActive) {
      throw new AppError("OPERATOR_ACTIVE", "Operator staff account is already active", 409, {
        operatorAdminAccountId: target.id,
      });
    }

    const operatorStaffRepository = this.getOperatorStaffRepository();
    const operator = await operatorStaffRepository.reactivateOperatorStaff({
      operatorAdminAccountId: target.id,
      actorAdminAccountId: input.actorAdminAccountId,
      reactivatedAt: now,
    });

    await operatorStaffRepository.recordOperatorStaffLifecycleEvent({
      operatorAdminAccountId: target.id,
      actorAdminAccountId: input.actorAdminAccountId,
      action: "reactivated",
      previousNickname: target.nickname,
      newNickname: target.nickname,
      reason: normalizeOptionalReason(input.reason),
      createdAt: now,
    });

    return {
      operator,
    };
  }

  async adjustOperatorStaffRating(
    input: AdjustAdminAccessOperatorStaffRatingCommandInput,
  ): Promise<AdjustAdminAccessOperatorStaffRatingCommandResult> {
    const now = input.now ?? new Date();

    await this.requireStaffPanelActor(input.actorAdminAccountId);
    const target = await this.requireActiveOperatorStaff(input.operatorAdminAccountId);

    if (input.delta !== 1 && input.delta !== -1) {
      throw new AppError("VALIDATION_ERROR", "Operator staff rating adjustment must be +1 or -1", 400, {
        delta: input.delta,
      });
    }

    const adjustment = await this.getOperatorStaffRepository().recordOperatorStaffRatingAdjustment({
      operatorAdminAccountId: target.id,
      actorAdminAccountId: input.actorAdminAccountId,
      delta: input.delta,
      reason: normalizeOptionalReason(input.reason),
      createdAt: now,
    });

    return {
      adjustment,
    };
  }

  async resetOperatorStaffPassword(
    input: ResetAdminAccessOperatorStaffPasswordInput,
    dependencies: {
      passwordHashing: AdminAccessPasswordHashing;
    },
  ): Promise<ResetAdminAccessOperatorStaffPasswordResult> {
    const now = input.now ?? new Date();

    await this.requireBossActor(input.actorAdminAccountId);
    const target = await this.requireActiveOperatorStaff(input.operatorAdminAccountId);
    assertStrongAdminPassword(input.password);

    const passwordHash = await dependencies.passwordHashing.hash(input.password);
    const operatorStaffRepository = this.getOperatorStaffRepository();
    const operator = await operatorStaffRepository.updateOperatorStaffPassword({
      operatorAdminAccountId: target.id,
      passwordHash,
    });
    const revokedSessionCount = await this.repository.revokeSessionsByAccount({
      adminAccountId: target.id,
      revokedAt: now,
    });
    // TASK-FT019-01 has no PASSWORD_RESET action; reason carries reset type.
    await operatorStaffRepository.recordOperatorStaffLifecycleEvent({
      operatorAdminAccountId: target.id,
      actorAdminAccountId: input.actorAdminAccountId,
      action: "nickname_updated",
      previousNickname: target.nickname,
      newNickname: target.nickname,
      reason: OPERATOR_PASSWORD_RESET_LIFECYCLE_REASON,
      createdAt: now,
    });

    return {
      operator,
      revokedSessionCount,
      oneTimePassword: input.password,
    };
  }

  async updateOperatorStaffNickname(
    input: UpdateAdminAccessOperatorStaffNicknameCommandInput,
  ): Promise<UpdateAdminAccessOperatorStaffNicknameCommandResult> {
    const now = input.now ?? new Date();
    const nickname = normalizeNickname(input.nickname);

    await this.requireBossActor(input.actorAdminAccountId);
    assertValidOperatorNickname(nickname);

    const target = await this.requireActiveOperatorStaff(input.operatorAdminAccountId);
    const operatorStaffRepository = this.getOperatorStaffRepository();
    const operator = await operatorStaffRepository.updateOperatorStaffNickname({
      operatorAdminAccountId: target.id,
      nickname,
    });

    await operatorStaffRepository.recordOperatorStaffLifecycleEvent({
      operatorAdminAccountId: target.id,
      actorAdminAccountId: input.actorAdminAccountId,
      action: "nickname_updated",
      previousNickname: target.nickname,
      newNickname: nickname,
      reason: null,
      createdAt: now,
    });

    return {
      operator,
    };
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
        accessToken: tokenPair.accessToken,
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
    const accessTokenHash = await dependencies.tokenHasher.hash(tokenPair.accessToken);
    const refreshTokenHash = await dependencies.tokenHasher.hash(tokenPair.refreshToken);
    const timeline = buildAdminAccessRefreshTimeline(now, session.refreshTokenExpiresAt);
    const refreshedSession = await this.repository.updateSession({
      sessionId: session.id,
      accessTokenHash,
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

  async resolveProtectedSession(
    input: ResolveProtectedAdminSessionInput,
    dependencies: {
      tokenHasher: AdminAccessTokenHasher;
    },
  ): Promise<ResolveProtectedAdminSessionResult> {
    if (input.accessToken.length === 0 || input.refreshToken.length === 0) {
      throw new AppError("AUTH_REQUIRED", "Protected admin route requires an authenticated admin", 401);
    }

    const now = input.now ?? new Date();
    const accessTokenHash = await dependencies.tokenHasher.hash(input.accessToken);
    const refreshTokenHash = await dependencies.tokenHasher.hash(input.refreshToken);
    const session = await this.repository.findSessionByRefreshTokenHash(refreshTokenHash);

    if (
      session === null ||
      session.accessTokenHash !== accessTokenHash ||
      session.revokedAt !== null ||
      session.accessTokenExpiresAt.getTime() <= now.getTime() ||
      session.refreshTokenExpiresAt.getTime() <= now.getTime() ||
      session.idleExpiresAt.getTime() <= now.getTime()
    ) {
      throw new AppError("AUTH_REQUIRED", "Protected admin route requires an authenticated admin", 401);
    }

    const account = await this.repository.findAccountById(session.adminAccountId);

    if (account === null || !account.isActive) {
      throw new AppError("AUTH_REQUIRED", "Protected admin route requires an authenticated admin", 401);
    }

    return {
      adminAccountId: account.id,
      role: account.role,
    };
  }
}
