export type AdminAccessAccountId = string;
export type AdminAccessSessionId = string;
export type AdminAccessRevision = string;
export type AdminAccessRole = "boss" | "operator" | "admin";
export type AdminAccessAuditAction = "login_success" | "login_failed" | "locked" | "logout";
export type AdminAccessStaffLifecycleAction =
  | "created"
  | "deactivated"
  | "reactivated"
  | "nickname_updated";
export type AdminAccessStaffRatingAdjustmentDelta = -1 | 1;

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

export type AdminAccessStaffLifecycleMetadata = {
  staffCreatedAt: Date | null;
  staffCreatedByAdminAccountId: AdminAccessAccountId | null;
  staffDeactivatedAt: Date | null;
  staffDeactivatedByAdminAccountId: AdminAccessAccountId | null;
  staffReactivatedAt: Date | null;
  staffReactivatedByAdminAccountId: AdminAccessAccountId | null;
};

export type AdminAccessOperatorStaffRecord = {
  id: AdminAccessAccountId;
  login: string;
  nickname: string | null;
  role: Extract<AdminAccessRole, "operator">;
  authActive: boolean;
  lockedUntil: Date | null;
  lifecycle: AdminAccessStaffLifecycleMetadata;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminAccessOperatorStaffLifecycleEventRecord = {
  id: bigint;
  operatorAdminAccountId: AdminAccessAccountId;
  actorAdminAccountId: AdminAccessAccountId;
  action: AdminAccessStaffLifecycleAction;
  previousNickname: string | null;
  newNickname: string | null;
  reason: string | null;
  createdAt: Date;
};

export type AdminAccessOperatorStaffRatingAdjustmentRecord = {
  id: bigint;
  operatorAdminAccountId: AdminAccessAccountId;
  actorAdminAccountId: AdminAccessAccountId;
  delta: AdminAccessStaffRatingAdjustmentDelta;
  reason: string | null;
  createdAt: Date;
};

export type AdminAccessOperatorProcessedOrderMetricInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  processedOrdersCount: number;
};

export type AdminAccessOperatorStaffTableMetricRow = {
  operatorAdminAccountId: AdminAccessAccountId;
  nickname: string | null;
  email: string;
  activeStatus: "active" | "soft_deleted";
  authActive: boolean;
  processedOrdersCount: number;
  manualRatingAdjustment: number;
  operatorRating: number;
};

export type AdminAccessOperatorStaffCardLifecycleHistoryItem = {
  actorAdminAccountId: AdminAccessAccountId;
  action: AdminAccessStaffLifecycleAction;
  previousNickname: string | null;
  newNickname: string | null;
  reason: string | null;
  createdAt: Date;
};

export type AdminAccessOperatorStaffCardRatingAdjustmentHistoryItem = {
  actorAdminAccountId: AdminAccessAccountId;
  delta: AdminAccessStaffRatingAdjustmentDelta;
  reason: string | null;
  createdAt: Date;
};

export type AdminAccessOperatorStaffCardOrderProblemReason =
  | "future_failed"
  | "not_personally_completed";

export type AdminAccessOperatorStaffCardOrderInput = {
  orderId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastWriteAt: Date;
  actionTypes: string[];
  personallyCompleted: boolean;
  problemReasons: AdminAccessOperatorStaffCardOrderProblemReason[];
};

export type AdminAccessOperatorStaffCardOrderHistoryInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  lastProcessedOrders: AdminAccessOperatorStaffCardOrderInput[];
  problemOrders: AdminAccessOperatorStaffCardOrderInput[];
};

export type AdminAccessOperatorStaffCardReadModel = {
  operatorAdminAccountId: AdminAccessAccountId;
  nickname: string | null;
  email: string;
  activeStatus: "active" | "soft_deleted";
  authActive: boolean;
  addedByAdminAccountId: AdminAccessAccountId | null;
  addedAt: Date | null;
  deactivatedByAdminAccountId: AdminAccessAccountId | null;
  deactivatedAt: Date | null;
  reactivatedByAdminAccountId: AdminAccessAccountId | null;
  reactivatedAt: Date | null;
  lifecycleHistory: AdminAccessOperatorStaffCardLifecycleHistoryItem[];
  deactivationHistory: AdminAccessOperatorStaffCardLifecycleHistoryItem[];
  reactivationHistory: AdminAccessOperatorStaffCardLifecycleHistoryItem[];
  manualRatingAdjustmentHistory: AdminAccessOperatorStaffCardRatingAdjustmentHistoryItem[];
  processedOrdersCount: number;
  manualRatingAdjustment: number;
  operatorRating: number;
  lastProcessedOrders: AdminAccessOperatorStaffCardOrderInput[];
  problemOrders: AdminAccessOperatorStaffCardOrderInput[];
};

export type CreateAdminAccessOperatorStaffInput = {
  login: string;
  nickname: string;
  passwordHash: string;
  actorAdminAccountId: AdminAccessAccountId;
  createdAt: Date;
};

export type DeactivateAdminAccessOperatorStaffInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  actorAdminAccountId: AdminAccessAccountId;
  deactivatedAt: Date;
};

export type ReactivateAdminAccessOperatorStaffInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  actorAdminAccountId: AdminAccessAccountId;
  reactivatedAt: Date;
};

export type UpdateAdminAccessOperatorStaffPasswordInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  passwordHash: string;
};

export type UpdateAdminAccessOperatorStaffNicknameInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  nickname: string;
};

export type RecordAdminAccessOperatorStaffLifecycleEventInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  actorAdminAccountId: AdminAccessAccountId;
  action: AdminAccessStaffLifecycleAction;
  previousNickname?: string | null;
  newNickname?: string | null;
  reason?: string | null;
  createdAt: Date;
};

export type CreateAdminAccessOperatorStaffRatingAdjustmentInput = {
  operatorAdminAccountId: AdminAccessAccountId;
  actorAdminAccountId: AdminAccessAccountId;
  delta: AdminAccessStaffRatingAdjustmentDelta;
  reason?: string | null;
  createdAt: Date;
};

export type CreateAdminAccessOperatorStaffAccountInput = {
  actorAdminAccountId: AdminAccessAccountId;
  login: string;
  nickname: string;
  password: string;
  role?: AdminAccessRole;
  now?: Date;
};

export type CreateAdminAccessOperatorStaffAccountResult = {
  operator: AdminAccessOperatorStaffRecord;
  oneTimePassword: string;
};

export type DeactivateAdminAccessOperatorStaffCommandInput = {
  actorAdminAccountId: AdminAccessAccountId;
  operatorAdminAccountId: AdminAccessAccountId;
  reason?: string | null;
  now?: Date;
};

export type DeactivateAdminAccessOperatorStaffCommandResult = {
  operator: AdminAccessOperatorStaffRecord;
  revokedSessionCount: number;
};

export type ReactivateAdminAccessOperatorStaffCommandInput = {
  actorAdminAccountId: AdminAccessAccountId;
  operatorAdminAccountId: AdminAccessAccountId;
  reason?: string | null;
  now?: Date;
};

export type ReactivateAdminAccessOperatorStaffCommandResult = {
  operator: AdminAccessOperatorStaffRecord;
};

export type AdjustAdminAccessOperatorStaffRatingCommandInput = {
  actorAdminAccountId: AdminAccessAccountId;
  operatorAdminAccountId: AdminAccessAccountId;
  delta: AdminAccessStaffRatingAdjustmentDelta;
  reason?: string | null;
  now?: Date;
};

export type AdjustAdminAccessOperatorStaffRatingCommandResult = {
  adjustment: AdminAccessOperatorStaffRatingAdjustmentRecord;
};

export type ResetAdminAccessOperatorStaffPasswordInput = {
  actorAdminAccountId: AdminAccessAccountId;
  operatorAdminAccountId: AdminAccessAccountId;
  password: string;
  now?: Date;
};

export type ResetAdminAccessOperatorStaffPasswordResult = {
  operator: AdminAccessOperatorStaffRecord;
  revokedSessionCount: number;
  oneTimePassword: string;
};

export type UpdateAdminAccessOperatorStaffNicknameCommandInput = {
  actorAdminAccountId: AdminAccessAccountId;
  operatorAdminAccountId: AdminAccessAccountId;
  nickname: string;
  now?: Date;
};

export type UpdateAdminAccessOperatorStaffNicknameCommandResult = {
  operator: AdminAccessOperatorStaffRecord;
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

export type ResolveProtectedAdminSessionInput = {
  accessToken: string;
  refreshToken: string;
  now?: Date;
};

export type ResolveProtectedAdminSessionResult = {
  adminAccountId: AdminAccessAccountId;
  role: AdminAccessRole;
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

export interface AdminAccessPasswordHashing {
  hash(secret: string): Promise<string>;
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

export interface AdminAccessOperatorStaffRepository {
  findOperatorStaffById(adminAccountId: AdminAccessAccountId): Promise<AdminAccessOperatorStaffRecord | null>;
  createOperatorStaff(
    input: CreateAdminAccessOperatorStaffInput,
  ): Promise<AdminAccessOperatorStaffRecord>;
  deactivateOperatorStaff(
    input: DeactivateAdminAccessOperatorStaffInput,
  ): Promise<AdminAccessOperatorStaffRecord>;
  reactivateOperatorStaff(
    input: ReactivateAdminAccessOperatorStaffInput,
  ): Promise<AdminAccessOperatorStaffRecord>;
  updateOperatorStaffPassword(
    input: UpdateAdminAccessOperatorStaffPasswordInput,
  ): Promise<AdminAccessOperatorStaffRecord>;
  updateOperatorStaffNickname(
    input: UpdateAdminAccessOperatorStaffNicknameInput,
  ): Promise<AdminAccessOperatorStaffRecord>;
  recordOperatorStaffLifecycleEvent(
    input: RecordAdminAccessOperatorStaffLifecycleEventInput,
  ): Promise<AdminAccessOperatorStaffLifecycleEventRecord>;
  recordOperatorStaffRatingAdjustment(
    input: CreateAdminAccessOperatorStaffRatingAdjustmentInput,
  ): Promise<AdminAccessOperatorStaffRatingAdjustmentRecord>;
}
