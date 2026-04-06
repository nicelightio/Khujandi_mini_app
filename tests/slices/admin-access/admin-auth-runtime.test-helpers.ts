import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { IncomingHttpHeaders } from "node:http";
import { createAdminAccessModule } from "../../../backend/src/slices/admin-access/presentation/admin-access.module";
import { createAdminAuthHttpHandler } from "../../../backend/src/slices/admin-access/presentation/admin-auth-http";
import type { AdminAccessPrismaProvider } from "../../../backend/src/slices/admin-access/infrastructure/prisma-admin-access.repository";

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

type RuntimeServerOptions = {
  allowedOrigins?: string[];
  passwordHasher?: {
    verify: (secret: string, secretHash: string) => Promise<boolean>;
  };
};

type RuntimeJsonResponse = {
  status: number;
  headers: IncomingHttpHeaders;
  body: unknown;
  text: string;
};

export type RuntimeCookieSessionClient = {
  request: (input: {
    path: string;
    method?: string;
    origin?: string;
    referer?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }) => Promise<RuntimeJsonResponse>;
  fetch: (input: string, init?: RequestInit) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }>;
  readCookieValue: (name: string) => string | null;
};

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

const createInMemoryAdminAccessPrisma = (): AdminAccessPrismaProvider & {
  state: {
    account: AdminAccountRecord;
    sessions: AdminSessionRecord[];
    audits: AdminAuthAuditRecord[];
  };
} => {
  const state: {
    account: AdminAccountRecord;
    sessions: AdminSessionRecord[];
    audits: AdminAuthAuditRecord[];
  } = {
    account: {
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS" as const,
      isActive: true,
      lockedUntil: null,
      createdAt: new Date("2026-04-06T08:00:00.000Z"),
      updatedAt: new Date("2026-04-06T08:00:00.000Z"),
    },
    sessions: [] as AdminSessionRecord[],
    audits: [] as AdminAuthAuditRecord[],
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

          return toAccountRecord(state.account);
        },
      },
      adminSession: {
        create: async ({ data }) => {
          const createdAt = new Date(data.lastActivityAt);
          const session: AdminSessionRecord = {
            id: `session-${state.sessions.length + 1}`,
            adminAccountId: data.adminAccountId,
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

const updateCookieJar = (jar: Map<string, string>, setCookieHeader: string | string[] | undefined): void => {
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader === undefined ? [] : [setCookieHeader];

  cookies.forEach((cookie) => {
    const [pair] = cookie.split(";", 1);
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex <= 0) {
      return;
    }

    const name = pair.slice(0, separatorIndex);
    const value = decodeURIComponent(pair.slice(separatorIndex + 1));

    if (value.length === 0) {
      jar.delete(name);
      return;
    }

    jar.set(name, value);
  });
};

const buildCookieHeader = (jar: Map<string, string>): string | undefined => {
  if (jar.size === 0) {
    return undefined;
  }

  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
};

const toRuntimeResponseBody = (text: string): unknown => {
  if (text.length === 0) {
    return null;
  }

  return JSON.parse(text) as unknown;
};

export const createRuntimeCookieSessionClient = (baseUrl: string): RuntimeCookieSessionClient => {
  const jar = new Map<string, string>();
  const request: RuntimeCookieSessionClient["request"] = async ({
    path,
    method = "POST",
    origin,
    referer,
    body,
    headers = {},
  }) => {
    const url = new URL(path, baseUrl);
    const requestHeaders: Record<string, string> = { ...headers };
    const cookieHeader = buildCookieHeader(jar);

    if (cookieHeader !== undefined) {
      requestHeaders.cookie = cookieHeader;
    }

    if (origin !== undefined) {
      requestHeaders.origin = origin;
    }

    if (referer !== undefined) {
      requestHeaders.referer = referer;
    }

    let serializedBody: string | undefined;

    if (body !== undefined) {
      serializedBody = JSON.stringify(body);
      requestHeaders["content-type"] = requestHeaders["content-type"] ?? "application/json";
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: serializedBody,
    });
    const text = await response.text();
    const setCookieHeader =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie");
    const setCookie =
      setCookieHeader === null || setCookieHeader === undefined
        ? undefined
        : Array.isArray(setCookieHeader)
          ? setCookieHeader
          : [setCookieHeader];

    updateCookieJar(jar, setCookie);

    return {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "set-cookie": setCookie,
      },
      body: toRuntimeResponseBody(text),
      text,
    };
  };

  return {
    request,
    fetch: async (input, init) => {
      const response = (await request({
        path: input,
        method: init?.method ?? "GET",
        headers: Object.fromEntries(
          Object.entries(init?.headers ?? {}).map(([key, value]) => [key, String(value)]),
        ),
        body: typeof init?.body === "string" && init.body.length > 0 ? JSON.parse(init.body) : undefined,
      })) as RuntimeJsonResponse;

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.body,
      };
    },
    readCookieValue: (name) => jar.get(name) ?? null,
  };
};

export const startAdminAuthRuntimeServer = async (options: RuntimeServerOptions = {}) => {
  const prisma = createInMemoryAdminAccessPrisma();
  const module = createAdminAccessModule(prisma);
  const handler = createAdminAuthHttpHandler({
    controller: module.controller,
    passwordHasher:
      options.passwordHasher ?? {
        verify: async (secret, secretHash) => secret === "super-secret-01" && secretHash === "stored-hash",
      },
    allowedOrigins: options.allowedOrigins ?? ["https://admin.example"],
    traceIdFactory: () => "trace-admin-runtime",
  });

  const server = createServer(async (request, response) => {
    const handled = await handler(request, response);

    if (!handled) {
      response.writeHead(404, {
        "content-type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ error: { code: "NOT_FOUND", message: "Route not found." } }));
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    baseUrl,
    prisma,
    createClient: () => createRuntimeCookieSessionClient(baseUrl),
    stop: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error !== undefined && error !== null) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
};
