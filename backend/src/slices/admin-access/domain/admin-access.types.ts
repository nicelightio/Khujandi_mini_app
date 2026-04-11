export type AdminAccessAccountId = string;
export type AdminAccessSessionId = string;
export type AdminAccessRevision = string;
export type AdminAccessRole = "boss" | "manager" | "admin";
export type AdminAccessAuditAction = "login_success" | "login_failed" | "locked" | "logout";

export const ADMIN_ACCESS_PASSWORD_MIN_LENGTH = 12;
export const ADMIN_ACCESS_FAILURE_THRESHOLD = 5;
export const ADMIN_ACCESS_FAILURE_WINDOW_MS = 15 * 60 * 1000;
export const ADMIN_ACCESS_LOCKOUT_MS = 30 * 60 * 1000;
export const ADMIN_ACCESS_ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const ADMIN_ACCESS_REFRESH_TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const ADMIN_ACCESS_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export type AdminAccessAccountRecord = {
  id: AdminAccessAccountId;
  login: string;
  passwordHash: string;
  role: AdminAccessRole;
  isActive: boolean;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminAccessSessionRecord = {
  id: AdminAccessSessionId;
  adminAccountId: AdminAccessAccountId;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
  lastActivityAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminAccessAuditRecord = {
  id: bigint;
  adminAccountId: AdminAccessAccountId;
  action: AdminAccessAuditAction;
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string;
  reason: string | null;
  createdAt: Date;
};

export type VerifyAdminCredentialsInput = {
  login: string;
  password: string;
  now?: Date;
};

export type LoginAdminAccessInput = {
  login: string;
  password: string;
  traceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  now?: Date;
};

export type LoginAdminAccessResult = {
  adminAccountId: AdminAccessAccountId;
  role: AdminAccessRole;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
};

export type RefreshAdminAccessInput = {
  refreshToken: string;
  traceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  now?: Date;
};

export type RefreshAdminAccessResult = {
  adminAccountId: AdminAccessAccountId;
  role: AdminAccessRole;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
};

export type LogoutAdminAccessInput = {
  refreshToken: string;
  traceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  now?: Date;
};

export type LogoutAdminAccessResult = {
  loggedOut: boolean;
};

export type AdminAccessCredentialVerificationResult =
  | {
      ok: true;
      account: AdminAccessAccountRecord;
    }
  | {
      ok: false;
      reason: "INVALID_CREDENTIALS" | "ACCOUNT_INACTIVE" | "ACCOUNT_LOCKED";
      lockedUntil?: Date;
    };

export type CreateAdminAccessSessionInput = {
  adminAccountId: AdminAccessAccountId;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
  lastActivityAt: Date;
};

export type CreateAdminAccessAuditInput = {
  adminAccountId: AdminAccessAccountId;
  action: AdminAccessAuditAction;
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string;
  reason: string | null;
  createdAt: Date;
};

export type CountRecentFailedLoginInput = {
  adminAccountId: AdminAccessAccountId;
  since: Date;
};

export type UpdateAdminLockoutInput = {
  adminAccountId: AdminAccessAccountId;
  lockedUntil: Date;
};

export type UpdateAdminAccessSessionInput = {
  sessionId: AdminAccessSessionId;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
  lastActivityAt: Date;
};

export type RevokeAdminAccessSessionInput = {
  sessionId: AdminAccessSessionId;
  revokedAt: Date;
};

export type RevokeAdminAccessSessionsByAccountInput = {
  adminAccountId: AdminAccessAccountId;
  revokedAt: Date;
};

export type CreateAdminSessionBaselineInput = {
  adminAccountId: AdminAccessAccountId;
  accessToken: string;
  refreshToken: string;
  now?: Date;
};

export type RecordAdminAuditBaselineInput = {
  adminAccountId: AdminAccessAccountId;
  action: AdminAccessAuditAction;
  traceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  createdAt?: Date;
};

export type LockAdminAccountBaselineInput = {
  adminAccountId: AdminAccessAccountId;
  traceId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  reason?: string | null;
  now?: Date;
};

export type AdminAccessSessionTimeline = {
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
  lastActivityAt: Date;
};

export interface AdminAccessPasswordHasher {
  verify(secret: string, secretHash: string): Promise<boolean>;
}

export interface AdminAccessTokenHasher {
  hash(secret: string): Promise<string>;
}

export interface AdminAccessTokenFactory {
  createTokenPair(): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}

export interface AdminAccessRepository {
  findAccountByLogin(login: string): Promise<AdminAccessAccountRecord | null>;
  findAccountById(adminAccountId: string): Promise<AdminAccessAccountRecord | null>;
  createSession(input: CreateAdminAccessSessionInput): Promise<AdminAccessSessionRecord>;
  findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AdminAccessSessionRecord | null>;
  updateSession(input: UpdateAdminAccessSessionInput): Promise<AdminAccessSessionRecord>;
  revokeSession(input: RevokeAdminAccessSessionInput): Promise<AdminAccessSessionRecord>;
  revokeSessionsByAccount(input: RevokeAdminAccessSessionsByAccountInput): Promise<number>;
  recordAudit(input: CreateAdminAccessAuditInput): Promise<AdminAccessAuditRecord>;
  countFailedLoginAuditsSince(input: CountRecentFailedLoginInput): Promise<number>;
  setAccountLockout(input: UpdateAdminLockoutInput): Promise<AdminAccessAccountRecord>;
}
