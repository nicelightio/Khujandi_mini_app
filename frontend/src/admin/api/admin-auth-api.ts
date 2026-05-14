export type AdminAuthRole = "boss" | "operator" | "admin";

export type AdminAuthSession = {
  adminAccountId: string;
  role: AdminAuthRole;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  idleExpiresAt: string;
};

export type AdminLoginInput = {
  login: string;
  password: string;
};

type AdminAuthErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  trace_id?: unknown;
};

export class AdminAuthApiError extends Error {
  readonly code: string;
  readonly traceId: string | null;
  readonly details: unknown;

  constructor(code: string, message: string, traceId: string | null = null, details: unknown = null) {
    super(traceId === null ? message : `${message} (trace: ${traceId})`);
    this.code = code;
    this.traceId = traceId;
    this.details = details;
  }
}

type AdminAuthHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type AdminAuthFetch = (input: string, init?: RequestInit) => Promise<AdminAuthHttpResponse>;

type AdminAuthApiOptions = {
  baseUrl?: string;
  fetch?: AdminAuthFetch;
};

export type AdminAuthApi = {
  login: (input: AdminLoginInput) => Promise<AdminAuthSession>;
  refresh: () => Promise<AdminAuthSession>;
  logout: () => Promise<{ loggedOut: boolean }>;
};

const defaultFetch: AdminAuthFetch = async (input, init) => {
  const response = await fetch(input, init);

  return {
    ok: response.ok,
    status: response.status,
    json: async () => {
      if (response.status === 204) {
        return null;
      }

      const text = await response.text();

      return text.length === 0 ? null : (JSON.parse(text) as unknown);
    },
  };
};

const ensureObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const readString = (record: Record<string, unknown> | null, key: string, fallbackKey?: string): string | null => {
  const directValue = record?.[key];

  if (typeof directValue === "string") {
    return directValue;
  }

  if (fallbackKey === undefined) {
    return null;
  }

  const fallbackValue = record?.[fallbackKey];

  return typeof fallbackValue === "string" ? fallbackValue : null;
};

const toSession = (value: unknown): AdminAuthSession => {
  const record = ensureObject(value);
  const sessionRecord = ensureObject(record?.session) ?? record;
  const adminAccountId = readString(sessionRecord, "adminAccountId", "admin_account_id");
  const role = sessionRecord?.role;
  const accessTokenExpiresAt = readString(sessionRecord, "accessTokenExpiresAt", "access_token_expires_at");
  const refreshTokenExpiresAt = readString(sessionRecord, "refreshTokenExpiresAt", "refresh_token_expires_at");
  const idleExpiresAt = readString(sessionRecord, "idleExpiresAt", "idle_expires_at");

  if (
    adminAccountId === null ||
    (role !== "boss" && role !== "operator" && role !== "admin") ||
    accessTokenExpiresAt === null ||
    refreshTokenExpiresAt === null ||
    idleExpiresAt === null
  ) {
    throw new Error("Некорректный payload админ-сессии.");
  }

  return {
    adminAccountId,
    role,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    idleExpiresAt,
  };
};

const toApiError = (payload: unknown, status: number, fallbackMessage: string): AdminAuthApiError => {
  const record = ensureObject(payload) as AdminAuthErrorPayload | null;
  const code = typeof record?.error?.code === "string" ? record.error.code : `HTTP_${status}`;
  const message = typeof record?.error?.message === "string" ? record.error.message : fallbackMessage;
  const traceId = typeof record?.trace_id === "string" ? record.trace_id : null;

  return new AdminAuthApiError(code, message, traceId, record?.error?.details ?? null);
};

export const createAdminAuthApi = (options: AdminAuthApiOptions = {}): AdminAuthApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    login: async (input) => {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/auth/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          login: input.login,
          password: input.password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status, "Вход в админку временно недоступен.");
      }

      return toSession(payload);
    },
    refresh: async () => {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status, "Обновление админ-сессии временно недоступно.");
      }

      return toSession(payload);
    },
    logout: async () => {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status, "Выход из админки временно недоступен.");
      }

      const record = ensureObject(payload);
      const loggedOut = record === null || typeof record.loggedOut !== "boolean" ? true : record.loggedOut;

      return {
        loggedOut,
      };
    },
  };
};
