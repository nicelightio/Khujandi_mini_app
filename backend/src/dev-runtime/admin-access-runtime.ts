import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AppError } from "../shared/errors/app-error";
import { resolveProtectedAdminRouteSession } from "../slices/admin-access/presentation/admin-auth-http";
import type { AdminAccessController } from "../slices/admin-access/presentation/admin-access.controller";
import type { AdminAccessPrismaProvider } from "../slices/admin-access/infrastructure/prisma-admin-access.repository";

type AdminAccountRecord = {
  id: string;
  login: string;
  passwordHash: string;
  role: "BOSS" | "OPERATOR" | "ADMIN";
  nickname: string | null;
  isActive: boolean;
  lockedUntil: Date | null;
  staffCreatedAt: Date | null;
  staffCreatedByAdminAccountId: string | null;
  staffDeactivatedAt: Date | null;
  staffDeactivatedByAdminAccountId: string | null;
  staffReactivatedAt: Date | null;
  staffReactivatedByAdminAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AdminSessionRecord = {
  id: string;
  adminAccountId: string;
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

type AdminAuthAuditRecord = {
  id: bigint;
  adminAccountId: string;
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOCKED" | "LOGOUT";
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string;
  reason: string | null;
  createdAt: Date;
};

type OperatorStaffLifecycleEventRecord = {
  id: bigint;
  operatorAdminAccountId: string;
  actorAdminAccountId: string;
  action: "CREATED" | "DEACTIVATED" | "REACTIVATED" | "NICKNAME_UPDATED";
  previousNickname: string | null;
  newNickname: string | null;
  reason: string | null;
  createdAt: Date;
};

type OperatorStaffRatingAdjustmentRecord = {
  id: bigint;
  operatorAdminAccountId: string;
  actorAdminAccountId: string;
  delta: -1 | 1;
  reason: string | null;
  createdAt: Date;
};

export type AdminAccessRuntimeState = {
  account: AdminAccountRecord;
  operatorAccounts: AdminAccountRecord[];
  sessions: AdminSessionRecord[];
  audits: AdminAuthAuditRecord[];
  operatorStaffLifecycleEvents: OperatorStaffLifecycleEventRecord[];
  operatorStaffRatingAdjustments: OperatorStaffRatingAdjustmentRecord[];
};

const SEEDED_BOSS_DEV_PASSWORD = "super-secret-01";
const SEEDED_BOSS_DEV_PASSWORD_HASH = "stored-hash";

const createDevRuntimeAdminPasswordHash = (secret: string): string =>
  createHash("sha256").update(secret).digest("hex");

export const devRuntimeAdminPasswordHashing = {
  hash: async (secret: string): Promise<string> => createDevRuntimeAdminPasswordHash(secret),
  verify: async (secret: string, secretHash: string): Promise<boolean> =>
    secretHash === createDevRuntimeAdminPasswordHash(secret) ||
    (secret === SEEDED_BOSS_DEV_PASSWORD && secretHash === SEEDED_BOSS_DEV_PASSWORD_HASH),
};

type AdminAccessStatePersistence = {
  databasePath: string;
  loadState: () => AdminAccessRuntimeState;
  saveState: (state: AdminAccessRuntimeState) => void;
  close: () => void;
  cleanup: () => void;
};

export const createAdminAccessRuntimeState = (): AdminAccessRuntimeState => ({
  account: {
    id: "admin-account-1",
    login: "boss@example.com",
    passwordHash: "stored-hash",
    role: "BOSS",
    nickname: "Boss",
    isActive: true,
    lockedUntil: null,
    staffCreatedAt: null,
    staffCreatedByAdminAccountId: null,
    staffDeactivatedAt: null,
    staffDeactivatedByAdminAccountId: null,
    staffReactivatedAt: null,
    staffReactivatedByAdminAccountId: null,
    createdAt: new Date("2026-04-06T08:00:00.000Z"),
    updatedAt: new Date("2026-04-06T08:00:00.000Z"),
  },
  operatorAccounts: [],
  sessions: [],
  audits: [],
  operatorStaffLifecycleEvents: [],
  operatorStaffRatingAdjustments: [],
});

const cloneDate = (value: Date | null): Date | null => (value === null ? null : new Date(value));

const toAccountRecord = (account: AdminAccountRecord) => ({
  ...account,
  lockedUntil: cloneDate(account.lockedUntil),
  staffCreatedAt: cloneDate(account.staffCreatedAt),
  staffDeactivatedAt: cloneDate(account.staffDeactivatedAt),
  staffReactivatedAt: cloneDate(account.staffReactivatedAt),
  createdAt: new Date(account.createdAt),
  updatedAt: new Date(account.updatedAt),
});

const toSessionRecord = (session: AdminSessionRecord) => ({
  ...session,
  accessTokenExpiresAt: new Date(session.accessTokenExpiresAt),
  refreshTokenExpiresAt: new Date(session.refreshTokenExpiresAt),
  idleExpiresAt: new Date(session.idleExpiresAt),
  lastActivityAt: new Date(session.lastActivityAt),
  revokedAt: cloneDate(session.revokedAt),
  createdAt: new Date(session.createdAt),
  updatedAt: new Date(session.updatedAt),
});

const toAuditRecord = (audit: AdminAuthAuditRecord) => ({
  ...audit,
  id: BigInt(audit.id),
  createdAt: new Date(audit.createdAt),
});

const toLifecycleEventRecord = (
  event: OperatorStaffLifecycleEventRecord,
): OperatorStaffLifecycleEventRecord => ({
  ...event,
  id: BigInt(event.id),
  createdAt: new Date(event.createdAt),
});

const toRatingAdjustmentRecord = (
  adjustment: OperatorStaffRatingAdjustmentRecord,
): OperatorStaffRatingAdjustmentRecord => ({
  ...adjustment,
  id: BigInt(adjustment.id),
  createdAt: new Date(adjustment.createdAt),
});

const cloneAdminAccessState = (state: AdminAccessRuntimeState): AdminAccessRuntimeState => ({
  account: toAccountRecord(state.account),
  operatorAccounts: (state.operatorAccounts ?? []).map(toAccountRecord),
  sessions: state.sessions.map(toSessionRecord),
  audits: state.audits.map(toAuditRecord),
  operatorStaffLifecycleEvents: (state.operatorStaffLifecycleEvents ?? []).map(toLifecycleEventRecord),
  operatorStaffRatingAdjustments: (state.operatorStaffRatingAdjustments ?? []).map(toRatingAdjustmentRecord),
});

const createAdminAccessStatePersistence = (
  databasePath: string,
  cleanupDirectory: string | null,
): AdminAccessStatePersistence => {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS admin_access_runtime_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const saveState = (state: AdminAccessRuntimeState): void => {
    const serializedState = JSON.stringify(state, (key, value) => (typeof value === "bigint" ? value.toString() : value));

    database
      .prepare(
        `INSERT INTO admin_access_runtime_state (id, payload, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .run(serializedState, new Date().toISOString());
  };

  const loadState = (): AdminAccessRuntimeState => {
    const row = database
      .prepare("SELECT payload FROM admin_access_runtime_state WHERE id = 1")
      .get() as { payload: string } | undefined;

    if (row === undefined) {
      const seededState = createAdminAccessRuntimeState();
      saveState(seededState);
      return seededState;
    }

    const parsed = JSON.parse(row.payload) as AdminAccessRuntimeState;

    return {
      account: toAccountRecord(parsed.account),
      operatorAccounts: (parsed.operatorAccounts ?? []).map(toAccountRecord),
      sessions: parsed.sessions.map(toSessionRecord),
      audits: parsed.audits.map(toAuditRecord),
      operatorStaffLifecycleEvents: (parsed.operatorStaffLifecycleEvents ?? []).map(toLifecycleEventRecord),
      operatorStaffRatingAdjustments: (parsed.operatorStaffRatingAdjustments ?? []).map(toRatingAdjustmentRecord),
    };
  };

  return {
    databasePath,
    loadState,
    saveState,
    close: () => {
      database.close();
    },
    cleanup: () => {
      if (cleanupDirectory !== null && existsSync(cleanupDirectory)) {
        rmSync(cleanupDirectory, { recursive: true, force: true });
      }
    },
  };
};

export const resolveAdminDatabasePersistence = (databasePath: string | undefined): AdminAccessStatePersistence => {
  if (databasePath !== undefined) {
    return createAdminAccessStatePersistence(databasePath, null);
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "khujandi-admin-access-runtime-"));
  return createAdminAccessStatePersistence(join(temporaryDirectory, "admin-access-runtime.sqlite"), temporaryDirectory);
};

export const createAdminAccessRuntimePrisma = (
  initialState: AdminAccessRuntimeState,
  options: { persist?: (state: AdminAccessRuntimeState) => void } = {},
): AdminAccessPrismaProvider & {
  state: AdminAccessRuntimeState;
} => {
  const state = cloneAdminAccessState(initialState);
  const persistState = (): void => {
    options.persist?.(cloneAdminAccessState(state));
  };
  const accounts = (): AdminAccountRecord[] => [state.account, ...state.operatorAccounts];
  const findAccount = (where: { login?: string; id?: string }): AdminAccountRecord | null => {
    if (where.login !== undefined) {
      return accounts().find((candidate) => candidate.login === where.login) ?? null;
    }

    if (where.id !== undefined) {
      return accounts().find((candidate) => candidate.id === where.id) ?? null;
    }

    return null;
  };
  const updateAccount = (
    where: { id: string },
    data: Partial<AdminAccountRecord>,
  ): AdminAccountRecord => {
    const account = findAccount(where);

    if (account === null) {
      throw new Error("Unknown account id");
    }

    Object.assign(account, data, {
      updatedAt:
        data.lockedUntil ??
        data.staffDeactivatedAt ??
        data.staffReactivatedAt ??
        new Date(),
    });
    persistState();

    return toAccountRecord(account);
  };

  return {
    state,
    client: {
      adminAccount: {
        findUnique: async ({ where }) => {
          const account = findAccount(where);

          return account === null ? null : toAccountRecord(account);
        },
        findMany: async ({ where }) => {
          if (where.role !== "OPERATOR") {
            return [];
          }

          return state.operatorAccounts
            .filter((account) => account.role === "OPERATOR")
            .map(toAccountRecord);
        },
        create: async ({ data }) => {
          const createdAt = new Date(data.staffCreatedAt);
          const account: AdminAccountRecord = {
            id: `operator-account-${state.operatorAccounts.length + 1}`,
            login: data.login,
            passwordHash: data.passwordHash,
            role: data.role,
            nickname: data.nickname,
            isActive: data.isActive,
            lockedUntil: data.lockedUntil,
            staffCreatedAt: new Date(data.staffCreatedAt),
            staffCreatedByAdminAccountId: data.staffCreatedByAdminAccountId,
            staffDeactivatedAt: data.staffDeactivatedAt,
            staffDeactivatedByAdminAccountId: data.staffDeactivatedByAdminAccountId,
            staffReactivatedAt: data.staffReactivatedAt,
            staffReactivatedByAdminAccountId: data.staffReactivatedByAdminAccountId,
            createdAt,
            updatedAt: createdAt,
          };
          state.operatorAccounts.push(account);
          persistState();

          return toAccountRecord(account);
        },
        update: async ({ where, data }) => {
          return updateAccount(where, data);
        },
      },
      adminSession: {
        create: async ({ data }) => {
          const createdAt = new Date(data.lastActivityAt);
          const session: AdminSessionRecord = {
            id: `session-${state.sessions.length + 1}`,
            adminAccountId: data.adminAccountId,
            accessTokenHash: data.accessTokenHash,
            refreshTokenHash: data.refreshTokenHash,
            accessTokenExpiresAt: new Date(data.accessTokenExpiresAt),
            refreshTokenExpiresAt: new Date(data.refreshTokenExpiresAt),
            idleExpiresAt: new Date(data.idleExpiresAt),
            lastActivityAt: new Date(data.lastActivityAt),
            revokedAt: null,
            createdAt,
            updatedAt: createdAt,
          };
          state.sessions.push(session);
          persistState();
          return toSessionRecord(session);
        },
        findUnique: async ({ where }) => {
          const session = state.sessions.find((candidate) => candidate.refreshTokenHash === where.refreshTokenHash) ?? null;
          return session === null ? null : toSessionRecord(session);
        },
        update: async ({ where, data }) => {
          const session = state.sessions.find((candidate) => candidate.id === where.id);

          if (session === undefined) {
            throw new Error("Unknown session id");
          }

          if (data.refreshTokenHash !== undefined) {
            session.refreshTokenHash = data.refreshTokenHash;
          }
          if (data.accessTokenHash !== undefined) {
            session.accessTokenHash = data.accessTokenHash;
          }
          if (data.accessTokenExpiresAt !== undefined) {
            session.accessTokenExpiresAt = new Date(data.accessTokenExpiresAt);
          }
          if (data.refreshTokenExpiresAt !== undefined) {
            session.refreshTokenExpiresAt = new Date(data.refreshTokenExpiresAt);
          }
          if (data.idleExpiresAt !== undefined) {
            session.idleExpiresAt = new Date(data.idleExpiresAt);
          }
          if (data.lastActivityAt !== undefined) {
            session.lastActivityAt = new Date(data.lastActivityAt);
          }
          if (data.revokedAt !== undefined) {
            session.revokedAt = new Date(data.revokedAt);
          }
          session.updatedAt = new Date(session.lastActivityAt);
          persistState();

          return toSessionRecord(session);
        },
        updateMany: async ({ where, data }) => {
          let count = 0;

          state.sessions.forEach((session) => {
            if (session.adminAccountId === where.adminAccountId && session.revokedAt === where.revokedAt) {
              session.revokedAt = new Date(data.revokedAt);
              session.updatedAt = new Date(data.revokedAt);
              count += 1;
            }
          });

          if (count > 0) {
            persistState();
          }

          return { count };
        },
      },
      adminAuthAudit: {
        create: async ({ data }) => {
          const record: AdminAuthAuditRecord = {
            id: BigInt(state.audits.length + 1),
            adminAccountId: data.adminAccountId,
            action: data.action,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            traceId: data.traceId,
            reason: data.reason,
            createdAt: new Date(data.createdAt),
          };
          state.audits.push(record);
          persistState();
          return { ...record };
        },
        count: async ({ where }) =>
          state.audits.filter(
            (audit) =>
              audit.adminAccountId === where.adminAccountId &&
              audit.action === where.action &&
              audit.createdAt.getTime() >= where.createdAt.gte.getTime(),
          ).length,
      },
      operatorStaffLifecycleEvent: {
        create: async ({ data }) => {
          const record: OperatorStaffLifecycleEventRecord = {
            id: BigInt(state.operatorStaffLifecycleEvents.length + 1),
            operatorAdminAccountId: data.operatorAdminAccountId,
            actorAdminAccountId: data.actorAdminAccountId,
            action: data.action,
            previousNickname: data.previousNickname,
            newNickname: data.newNickname,
            reason: data.reason,
            createdAt: new Date(data.createdAt),
          };
          state.operatorStaffLifecycleEvents.push(record);
          persistState();

          return toLifecycleEventRecord(record);
        },
        findMany: async ({ where }) =>
          state.operatorStaffLifecycleEvents
            .filter((event) => where.operatorAdminAccountId.in.includes(event.operatorAdminAccountId))
            .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
            .map(toLifecycleEventRecord),
      },
      operatorStaffRatingAdjustment: {
        create: async ({ data }) => {
          const record: OperatorStaffRatingAdjustmentRecord = {
            id: BigInt(state.operatorStaffRatingAdjustments.length + 1),
            operatorAdminAccountId: data.operatorAdminAccountId,
            actorAdminAccountId: data.actorAdminAccountId,
            delta: data.delta,
            reason: data.reason,
            createdAt: new Date(data.createdAt),
          };
          state.operatorStaffRatingAdjustments.push(record);
          persistState();

          return toRatingAdjustmentRecord(record);
        },
        findMany: async ({ where }) =>
          state.operatorStaffRatingAdjustments
            .filter((adjustment) => where.operatorAdminAccountId.in.includes(adjustment.operatorAdminAccountId))
            .map(toRatingAdjustmentRecord),
      },
    },
  };
};

export const resolveAdminProvisioningSession = async (
  request: IncomingMessage,
  dependencies: {
    controller: AdminAccessController;
    allowedOrigins: string[];
    now?: () => Date;
  },
): Promise<void> => {
  const session = await resolveProtectedAdminRouteSession(request, {
    controller: dependencies.controller,
    allowedOrigins: dependencies.allowedOrigins,
    authRequiredMessage: "Provisioning requires an authenticated admin",
    now: dependencies.now,
  });

  if (session.role !== "admin" && session.role !== "boss") {
    throw new AppError("FORBIDDEN", "User role cannot provision seller shops", 403, {
      role: session.role,
    });
  }
};

export const resolveCatalogCurationAdminSession = async (
  request: IncomingMessage,
  dependencies: {
    controller: AdminAccessController;
    allowedOrigins: string[];
    now?: () => Date;
  },
): Promise<void> => {
  const session = await resolveProtectedAdminRouteSession(request, {
    controller: dependencies.controller,
    allowedOrigins: dependencies.allowedOrigins,
    authRequiredMessage: "Catalog showcase curation requires an authenticated admin",
    now: dependencies.now,
  });

  if (session.role !== "admin" && session.role !== "boss") {
    throw new AppError("FORBIDDEN", "User role cannot curate catalog showcase", 403, {
      role: session.role,
    });
  }
};
