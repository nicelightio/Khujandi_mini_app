import { createHash, randomBytes } from "node:crypto";
import { AppError } from "../../shared/errors/app-error";
import {
  ADMIN_ACCESS_ACCESS_TOKEN_TTL_MS,
  ADMIN_ACCESS_REFRESH_TOKEN_TTL_MS,
  type AdminAccessTokenHasher,
} from "../../slices/admin-access/domain/admin-access.types";
import { createMiniAppSessionToken, hashSessionToken } from "../../slices/checkout-payment/domain/telegram-auth";
import type { DevApiRouteHandler, DevApiRouteInput, RuntimeHttpResult } from "../dev-api-server.types";
import { json, readJsonBody, serializeCookie } from "../http-runtime";
import { isStagingTestHarnessEnabled, validateTestRuntimeToken } from "./test-runtime-guards";

type PersonaKey = "client_alina" | "seller_plov" | "admin_boss" | "operator" | "courier_7";

type PersonaMetadata = {
  key: PersonaKey;
  contour: "mini-app" | "admin-web" | "telegram-bot";
  role: "client" | "seller" | "admin" | "courier";
};

const supportedPersonas: PersonaMetadata[] = [
  { key: "client_alina", contour: "mini-app", role: "client" },
  { key: "seller_plov", contour: "mini-app", role: "seller" },
  { key: "admin_boss", contour: "admin-web", role: "admin" },
  { key: "courier_7", contour: "telegram-bot", role: "courier" },
];

const supportedPersonaKeys = new Set<PersonaKey>(supportedPersonas.map((persona) => persona.key));

const fixedPersonaUsers = {
  client_alina: {
    telegramId: "910001",
    role: "client" as const,
    name: "Alina",
    username: "client_alina",
    language: "ru",
    isActive: true,
  },
  seller_plov: {
    telegramId: "920001",
    role: "client" as const,
    name: "Seller Plov",
    username: "seller_plov",
    language: "ru",
    isActive: true,
  },
  courier_7: {
    id: "courier-7",
    telegramId: "70007",
    role: "courier" as const,
    name: "Courier 7",
    username: "courier7",
    language: "ru",
    isActive: true,
  },
};

const forbiddenIdentityFields = [
  "telegramId",
  "userId",
  "role",
  "shopId",
  "adminAccountId",
  "password",
];

const formatAllowlist = (values: readonly string[]): string => values.join(",");

const miniAppSessionTtlMs = 3 * 24 * 60 * 60 * 1000;
const miniAppSessionCookieName = "khujandi_mini_app_session";
const adminAccessCookieName = "khujandi_admin_access_token";
const adminRefreshCookieName = "khujandi_admin_refresh_token";

const tokenHasher: AdminAccessTokenHasher = {
  hash: async (secret) => createHash("sha256").update(secret).digest("hex"),
};

const isPersonaKey = (value: string): value is PersonaKey =>
  value === "client_alina" ||
  value === "seller_plov" ||
  value === "admin_boss" ||
  value === "operator" ||
  value === "courier_7";

const assertNoIdentityOverride = (body: Record<string, unknown>): void => {
  const rejectedFields = forbiddenIdentityFields.filter((field) => Object.prototype.hasOwnProperty.call(body, field));

  if (rejectedFields.length > 0) {
    throw new AppError("VALIDATION_ERROR", "Fixed persona session does not accept identity fields", 400, {
      rejectedFields: formatAllowlist(rejectedFields),
      rejectedFieldCount: rejectedFields.length,
    });
  }
};

const buildSessionPayload = (
  persona: PersonaMetadata,
  transport: "httpOnlyCookie" | "testMetadata",
  expiresAt: Date,
) => ({
  persona: persona.key,
  contour: persona.contour,
  role: persona.role,
  session: {
    transport,
    expiresAt: expiresAt.toISOString(),
  },
});

const createMiniAppPersonaSession = async (
  persona: Extract<PersonaKey, "client_alina" | "seller_plov">,
  input: DevApiRouteInput,
): Promise<RuntimeHttpResult> => {
  const metadata = supportedPersonas.find((candidate) => candidate.key === persona);

  if (metadata === undefined) {
    throw new AppError("VALIDATION_ERROR", "Persona is not supported by current runtime", 400, {
      persona,
    });
  }

  const now = input.context.options.now?.() ?? new Date();
  const sessionToken = createMiniAppSessionToken();
  const user = await input.context.checkoutPaymentModule.repository.upsertTelegramUser(fixedPersonaUsers[persona]);
  const sessionExpiresAt = new Date(now.getTime() + miniAppSessionTtlMs);
  await input.context.checkoutPaymentModule.repository.createMiniAppSession({
    userId: user.id,
    sessionTokenHash: hashSessionToken(sessionToken),
    expiresAt: sessionExpiresAt,
  });

  const response = json(200, buildSessionPayload(metadata, "httpOnlyCookie", sessionExpiresAt), "POST,OPTIONS");
  response.headers["set-cookie"] = [
    serializeCookie({
      name: miniAppSessionCookieName,
      value: sessionToken,
      path: "/",
      maxAgeSeconds: Math.floor(miniAppSessionTtlMs / 1000),
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    }),
  ];

  return response;
};

const createAdminBossSession = async (
  input: DevApiRouteInput,
): Promise<RuntimeHttpResult> => {
  const metadata = supportedPersonas.find((candidate) => candidate.key === "admin_boss");
  const account = await input.context.adminAccessModule.controller.getAccountByLogin("boss@example.com");

  if (metadata === undefined || account === null || account.role !== "boss") {
    throw new AppError("VALIDATION_ERROR", "Persona is not supported by current runtime", 400, {
      persona: "admin_boss",
    });
  }

  const now = input.context.options.now?.() ?? new Date();
  const accessToken = randomBytes(32).toString("hex");
  const refreshToken = randomBytes(32).toString("hex");
  const session = await input.context.adminAccessModule.controller.createSessionBaseline(
    {
      adminAccountId: account.id,
      accessToken,
      refreshToken,
      now,
    },
    tokenHasher,
  );

  const response = json(200, buildSessionPayload(metadata, "httpOnlyCookie", session.refreshTokenExpiresAt), "POST,OPTIONS");
  response.headers["set-cookie"] = [
    serializeCookie({
      name: adminAccessCookieName,
      value: accessToken,
      path: "/",
      maxAgeSeconds: Math.floor(ADMIN_ACCESS_ACCESS_TOKEN_TTL_MS / 1000),
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    }),
    serializeCookie({
      name: adminRefreshCookieName,
      value: refreshToken,
      path: "/",
      maxAgeSeconds: Math.floor(ADMIN_ACCESS_REFRESH_TOKEN_TTL_MS / 1000),
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    }),
  ];

  return response;
};

const createCourierMetadataSession = async (
  input: DevApiRouteInput,
): Promise<RuntimeHttpResult> => {
  const metadata = supportedPersonas.find((candidate) => candidate.key === "courier_7");

  if (metadata === undefined) {
    throw new AppError("VALIDATION_ERROR", "Persona is not supported by current runtime", 400, {
      persona: "courier_7",
    });
  }

  const existingUser = input.context.checkoutPaymentState.users.find(
    (candidate) => candidate.telegramId === fixedPersonaUsers.courier_7.telegramId,
  );

  if (existingUser === undefined) {
    input.context.checkoutPaymentState.users.push({ ...fixedPersonaUsers.courier_7 });
    input.context.operationalModules.saveRuntimeState?.();
  }

  const now = input.context.options.now?.() ?? new Date();
  const expiresAt = new Date(now.getTime() + miniAppSessionTtlMs);

  return json(200, buildSessionPayload(metadata, "testMetadata", expiresAt), "POST,OPTIONS");
};

const createSessionForPersona = async (
  persona: PersonaKey,
  input: DevApiRouteInput,
): Promise<RuntimeHttpResult> => {
  if (!supportedPersonaKeys.has(persona)) {
    throw new AppError("VALIDATION_ERROR", "Persona is not supported by current runtime", 400, {
      persona,
      allowedPersonas: formatAllowlist(supportedPersonas.map((supportedPersona) => supportedPersona.key)),
      allowedPersonaCount: supportedPersonas.length,
    });
  }

  if (persona === "client_alina" || persona === "seller_plov") {
    return createMiniAppPersonaSession(persona, input);
  }

  if (persona === "admin_boss") {
    return createAdminBossSession(input);
  }

  return createCourierMetadataSession(input);
};

export const handleTestSessionRoutes: DevApiRouteHandler = async (input) => {
  const { request, url, method, context } = input;
  const isPersonasRoute = method === "GET" && url.pathname === "/api/v1/test/personas";
  const isSessionRoute = method === "POST" && url.pathname === "/api/v1/test/session";

  if (!isPersonasRoute && !isSessionRoute) {
    return undefined;
  }

  if (!isStagingTestHarnessEnabled(context)) {
    return undefined;
  }

  const tokenError = validateTestRuntimeToken(context, request.headers, isPersonasRoute ? "GET,OPTIONS" : "POST,OPTIONS");
  if (tokenError !== null) {
    return tokenError;
  }

  if (isPersonasRoute) {
    return json(200, { personas: supportedPersonas }, "GET,OPTIONS");
  }

  try {
    const body = await readJsonBody(request);
    assertNoIdentityOverride(body);

    const persona = typeof body.persona === "string" ? body.persona : "";
    if (!isPersonaKey(persona)) {
      throw new AppError("VALIDATION_ERROR", "Persona is invalid", 400, {
        persona,
        allowedPersonas: formatAllowlist(supportedPersonas.map((supportedPersona) => supportedPersona.key)),
        allowedPersonaCount: supportedPersonas.length,
      });
    }

    return await createSessionForPersona(persona, input);
  } catch (error) {
    if (error instanceof AppError) {
      return json(error.statusCode, error.toPayload("trace-test-runtime"), "POST,OPTIONS");
    }

    if (error instanceof SyntaxError) {
      return json(
        400,
        new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-test-runtime"),
        "POST,OPTIONS",
      );
    }

    return json(
      500,
      new AppError("INTERNAL_ERROR", "Test session runtime is temporarily unavailable", 500).toPayload("trace-test-runtime"),
      "POST,OPTIONS",
    );
  }
};
