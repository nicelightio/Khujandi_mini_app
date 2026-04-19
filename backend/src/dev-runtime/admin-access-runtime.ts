import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import type { IncomingMessage } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { AppError } from "../shared/errors/app-error";
import { resolveProtectedAdminRouteSession } from "../slices/admin-access/presentation/admin-auth-http";
import type { AdminAccessPrismaProvider } from "../slices/admin-access/infrastructure/prisma-admin-access.repository";

type AdminAccountRecord = {
  id: string;
  login: string;
  passwordHash: string;
  role: "BOSS" | "MANAGER" | "ADMIN";
  isActive: boolean;
  lockedUntil: Date | null;
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

type AdminAccessRuntimeState = {
  account: AdminAccountRecord;
  sessions: AdminSessionRecord[];
  audits: AdminAuthAuditRecord[];
};

type AdminAccessStatePersistence = {
  databasePath: string;
  loadState: () => AdminAccessRuntimeState;
  saveState: (state: AdminAccessRuntimeState) => void;
  close: () => void;
  cleanup: () => void;
};

const createAdminAccessRuntimeState = (): AdminAccessRuntimeState => ({
  account: {
    id: "admin-account-1",
    login: "boss@example.com",
    passwordHash: "stored-hash",
    role: "BOSS",
    isActive: true,
    lockedUntil: null,
    createdAt: new Date("2026-04-06T08:00:00.000Z"),
    updatedAt: new Date("2026-04-06T08:00:00.000Z"),
  },
  sessions: [],
  audits: [],
});

const cloneDate = (value: Date | null): Date | null => (value === null ? null : new Date(value));

const toAccountRecord = (account: AdminAccountRecord) => ({
  ...account,
  lockedUntil: cloneDate(account.lockedUntil),
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

const cloneAdminAccessState = (state: AdminAccessRuntimeState): AdminAccessRuntimeState => ({
  account: toAccountRecord(state.account),
  sessions: state.sessions.map(toSessionRecord),
  audits: state.audits.map(toAuditRecord),
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
      sessions: parsed.sessions.map(toSessionRecord),
      audits: parsed.audits.map(toAuditRecord),
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

  return {
    state,
    client: {
      adminAccount: {
        findUnique: async ({ where }) => {
          if (where.login !== undefined && where.login === state.account.login) {
            return toAccountRecord(state.account);
          }

          if (where.id !== undefined && where.id === state.account.id) {
            return toAccountRecord(state.account);
          }

          return null;
        },
        update: async ({ where, data }) => {
          if (where.id !== state.account.id) {
            throw new Error("Unknown account id");
          }

          const lockedUntil = new Date(data.lockedUntil);
          state.account = {
            ...state.account,
            lockedUntil,
            updatedAt: lockedUntil,
          };
          persistState();

          return toAccountRecord(state.account);
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
    },
  };
};

export const resolveAdminProvisioningSession = async (
  request: IncomingMessage,
  dependencies: {
    prisma: AdminAccessPrismaProvider;
    allowedOrigins: string[];
    now?: () => Date;
  },
): Promise<void> => {
  const session = await resolveProtectedAdminRouteSession(request, {
    prisma: dependencies.prisma,
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
