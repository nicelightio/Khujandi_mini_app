import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { AppError } from "../../../shared/errors/app-error";
import { PrismaAdminAccessRepository } from "../infrastructure/prisma-admin-access.repository";
import type { AdminAccessPrismaProvider } from "../infrastructure/prisma-admin-access.repository";
import type {
  AdminAccessRole,
  AdminAccessPasswordHasher,
  AdminAccessTokenFactory,
  AdminAccessTokenHasher,
} from "../domain/admin-access.types";
import { AdminAccessController } from "./admin-access.controller";

type AdminAuthRoute = "login" | "refresh" | "logout";

type AdminAuthCookieDescriptor = {
  name: string;
  value: string;
  maxAgeSeconds: number;
};

type AdminAuthHttpRuntimeConfig = {
  controller: AdminAccessController;
  passwordHasher: AdminAccessPasswordHasher;
  tokenHasher?: AdminAccessTokenHasher;
  tokenFactory?: AdminAccessTokenFactory;
  allowedOrigins: string[];
  secureCookies?: boolean;
  accessCookieName?: string;
  refreshCookieName?: string;
  now?: () => Date;
  traceIdFactory?: () => string;
};

type AdminAuthJsonResponse = {
  ok: boolean;
  statusCode: number;
  payload: unknown;
  cookies?: string[];
};

type ProtectedAdminRouteSession = {
  adminAccountId: string;
  role: AdminAccessRole;
};

type ProtectedAdminRouteRuntimeConfig = {
  prisma: AdminAccessPrismaProvider;
  allowedOrigins: string[];
  accessCookieName?: string;
  refreshCookieName?: string;
  authRequiredMessage?: string;
  now?: () => Date;
};

const DEFAULT_ACCESS_COOKIE_NAME = "khujandi_admin_access_token";
const DEFAULT_REFRESH_COOKIE_NAME = "khujandi_admin_refresh_token";

const createDefaultTokenHasher = (): AdminAccessTokenHasher => ({
  hash: async (secret) => createHash("sha256").update(secret).digest("hex"),
});

const createDefaultTokenFactory = (): AdminAccessTokenFactory => ({
  createTokenPair: async () => ({
    accessToken: randomBytes(32).toString("hex"),
    refreshToken: randomBytes(32).toString("hex"),
  }),
});

const createDefaultTraceId = (): string => randomBytes(8).toString("hex");

const sendJson = (response: ServerResponse, result: AdminAuthJsonResponse): void => {
  const headers: Record<string, string | string[]> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };

  if (result.cookies !== undefined && result.cookies.length > 0) {
    headers["Set-Cookie"] = result.cookies;
  }

  response.writeHead(result.statusCode, headers);
  response.end(JSON.stringify(result.payload));
};

const sendError = (response: ServerResponse, traceId: string, error: unknown): void => {
  if (error instanceof AppError) {
    sendJson(response, {
      ok: false,
      statusCode: error.statusCode,
      payload: error.toPayload(traceId),
    });
    return;
  }

  const fallback = new AppError("INTERNAL_ERROR", "Admin auth runtime is temporarily unavailable", 500);
  sendJson(response, {
    ok: false,
    statusCode: fallback.statusCode,
    payload: fallback.toPayload(traceId),
  });
};

const readBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const parseJsonObject = (rawBody: string): Record<string, unknown> => {
  if (rawBody.trim().length === 0) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;

    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("invalid json object");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new AppError("VALIDATION_ERROR", "Request body must be a valid JSON object", 400);
  }
};

const serializeCookie = (
  descriptor: AdminAuthCookieDescriptor,
  secureCookies: boolean,
): string => {
  const parts = [
    `${descriptor.name}=${encodeURIComponent(descriptor.value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, descriptor.maxAgeSeconds)}`,
  ];

  if (secureCookies) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const serializeExpiredCookie = (name: string, secureCookies: boolean): string => {
  const parts = [
    `${name}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];

  if (secureCookies) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  if (cookieHeader === undefined || cookieHeader.trim().length === 0) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, chunk) => {
    const separatorIndex = chunk.indexOf("=");

    if (separatorIndex <= 0) {
      return accumulator;
    }

    const name = chunk.slice(0, separatorIndex).trim();
    const value = chunk.slice(separatorIndex + 1).trim();

    if (name.length > 0) {
      accumulator[name] = decodeURIComponent(value);
    }

    return accumulator;
  }, {});
};

const resolveIpAddress = (request: IncomingMessage): string | null => {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return request.socket.remoteAddress ?? null;
};

const resolveTraceId = (request: IncomingMessage, traceIdFactory: () => string): string => {
  const traceHeader = request.headers["x-trace-id"];

  return typeof traceHeader === "string" && traceHeader.trim().length > 0 ? traceHeader : traceIdFactory();
};

const resolveRoute = (pathname: string): AdminAuthRoute | null => {
  switch (pathname) {
    case "/api/v1/admin/auth/login":
      return "login";
    case "/api/v1/admin/auth/refresh":
      return "refresh";
    case "/api/v1/admin/auth/logout":
      return "logout";
    default:
      return null;
  }
};

const assertAllowedOrigin = (request: IncomingMessage, allowedOrigins: string[]): void => {
  const origin = request.headers.origin;
  const referer = request.headers.referer;

  const matchesAllowedOrigin = (candidate: string | undefined): boolean =>
    typeof candidate === "string" && allowedOrigins.some((allowedOrigin) => allowedOrigin === candidate);

  if (matchesAllowedOrigin(origin)) {
    return;
  }

  if (typeof referer === "string" && referer.length > 0) {
    try {
      if (matchesAllowedOrigin(new URL(referer).origin)) {
        return;
      }
    } catch {
      throw new AppError("FORBIDDEN", "Referer header is invalid", 403);
    }
  }

  throw new AppError("FORBIDDEN", "Origin or Referer is not allowed", 403);
};

const toSessionPayload = (result: {
  adminAccountId: string;
  role: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
}) => ({
  session: {
    adminAccountId: result.adminAccountId,
    role: result.role,
    accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
    refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
    idleExpiresAt: result.idleExpiresAt.toISOString(),
  },
});

const buildSessionCookies = (
  input: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
  },
  now: Date,
  names: {
    accessCookieName: string;
    refreshCookieName: string;
  },
  secureCookies: boolean,
): string[] => [
  serializeCookie(
    {
      name: names.accessCookieName,
      value: input.accessToken,
      maxAgeSeconds: Math.max(0, Math.floor((input.accessTokenExpiresAt.getTime() - now.getTime()) / 1000)),
    },
    secureCookies,
  ),
  serializeCookie(
    {
      name: names.refreshCookieName,
      value: input.refreshToken,
      maxAgeSeconds: Math.max(0, Math.floor((input.refreshTokenExpiresAt.getTime() - now.getTime()) / 1000)),
    },
    secureCookies,
  ),
];

export const resolveProtectedAdminRouteSession = async (
  request: IncomingMessage,
  config: ProtectedAdminRouteRuntimeConfig,
): Promise<ProtectedAdminRouteSession> => {
  assertAllowedOrigin(request, config.allowedOrigins);

  const accessCookieName = config.accessCookieName ?? DEFAULT_ACCESS_COOKIE_NAME;
  const refreshCookieName = config.refreshCookieName ?? DEFAULT_REFRESH_COOKIE_NAME;
  const authRequiredMessage = config.authRequiredMessage ?? "Protected admin route requires an authenticated admin";
  const cookies = parseCookies(request.headers.cookie);
  const accessToken = cookies[accessCookieName] ?? "";
  const refreshToken = cookies[refreshCookieName] ?? "";

  if (accessToken.length === 0 || refreshToken.length === 0) {
    throw new AppError("AUTH_REQUIRED", authRequiredMessage, 401);
  }

  const repository = new PrismaAdminAccessRepository(config.prisma);
  const accessTokenHash = createHash("sha256").update(accessToken).digest("hex");
  const refreshTokenHash = createHash("sha256").update(refreshToken).digest("hex");
  const session = await repository.findSessionByRefreshTokenHash(refreshTokenHash);
  const now = (config.now ?? (() => new Date()))();

  if (
    session === null ||
    session.accessTokenHash !== accessTokenHash ||
    session.revokedAt !== null ||
    session.accessTokenExpiresAt.getTime() <= now.getTime() ||
    session.refreshTokenExpiresAt.getTime() <= now.getTime() ||
    session.idleExpiresAt.getTime() <= now.getTime()
  ) {
    throw new AppError("AUTH_REQUIRED", authRequiredMessage, 401);
  }

  const account = await repository.findAccountById(session.adminAccountId);

  if (account === null || !account.isActive) {
    throw new AppError("AUTH_REQUIRED", authRequiredMessage, 401);
  }

  return {
    adminAccountId: account.id,
    role: account.role,
  };
};

export const createAdminAuthHttpHandler = (config: AdminAuthHttpRuntimeConfig) => {
  if (config.allowedOrigins.length === 0) {
    throw new Error("Admin auth HTTP runtime requires at least one allowed origin.");
  }

  const tokenHasher = config.tokenHasher ?? createDefaultTokenHasher();
  const tokenFactory = config.tokenFactory ?? createDefaultTokenFactory();
  const secureCookies = config.secureCookies ?? true;
  const accessCookieName = config.accessCookieName ?? DEFAULT_ACCESS_COOKIE_NAME;
  const refreshCookieName = config.refreshCookieName ?? DEFAULT_REFRESH_COOKIE_NAME;
  const nowFactory = config.now ?? (() => new Date());
  const traceIdFactory = config.traceIdFactory ?? createDefaultTraceId;

  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const route = resolveRoute(url.pathname);

    if (route === null) {
      return false;
    }

    const traceId = resolveTraceId(request, traceIdFactory);

    if ((request.method ?? "GET") !== "POST") {
      sendJson(response, {
        ok: false,
        statusCode: 405,
        payload: new AppError("METHOD_NOT_ALLOWED", "Method is not allowed", 405).toPayload(traceId),
      });
      return true;
    }

    try {
      assertAllowedOrigin(request, config.allowedOrigins);
      const now = nowFactory();
      const ipAddress = resolveIpAddress(request);
      const userAgent = typeof request.headers["user-agent"] === "string" ? request.headers["user-agent"] : null;
      const cookies = parseCookies(request.headers.cookie);

      if (route === "login") {
        const body = parseJsonObject(await readBody(request));
        const login = typeof body.login === "string" ? body.login : "";
        const password = typeof body.password === "string" ? body.password : "";
        const result = await config.controller.login(
          {
            login,
            password,
            traceId,
            ipAddress,
            userAgent,
            now,
          },
          {
            passwordHasher: config.passwordHasher,
            tokenHasher,
            tokenFactory,
          },
        );

        sendJson(response, {
          ok: true,
          statusCode: 200,
          payload: toSessionPayload(result),
          cookies: buildSessionCookies(
            {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              accessTokenExpiresAt: result.accessTokenExpiresAt,
              refreshTokenExpiresAt: result.refreshTokenExpiresAt,
            },
            now,
            {
              accessCookieName,
              refreshCookieName,
            },
            secureCookies,
          ),
        });

        return true;
      }

      const refreshToken = cookies[refreshCookieName] ?? "";

      if (route === "refresh") {
        const result = await config.controller.refresh(
          {
            refreshToken,
            traceId,
            ipAddress,
            userAgent,
            now,
          },
          {
            tokenHasher,
            tokenFactory,
          },
        );

        sendJson(response, {
          ok: true,
          statusCode: 200,
          payload: toSessionPayload(result),
          cookies: buildSessionCookies(
            {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              accessTokenExpiresAt: result.accessTokenExpiresAt,
              refreshTokenExpiresAt: result.refreshTokenExpiresAt,
            },
            now,
            {
              accessCookieName,
              refreshCookieName,
            },
            secureCookies,
          ),
        });

        return true;
      }

      const result = await config.controller.logout(
        {
          refreshToken,
          traceId,
          ipAddress,
          userAgent,
          now,
        },
        {
          tokenHasher,
        },
      );

      sendJson(response, {
        ok: true,
        statusCode: 200,
        payload: result,
        cookies: [
          serializeExpiredCookie(accessCookieName, secureCookies),
          serializeExpiredCookie(refreshCookieName, secureCookies),
        ],
      });

      return true;
    } catch (error) {
      sendError(response, traceId, error);
      return true;
    }
  };
};
