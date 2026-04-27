import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import { AppError } from "../shared/errors/app-error";

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
  deleteCookie: (name: string) => void;
  setCookieValue: (name: string, value: string) => void;
};

export const json = (
  statusCode: number,
  payload: unknown,
  methods = "GET,POST,OPTIONS",
): { statusCode: number; headers: Record<string, string | string[]>; body: string } => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": methods,
    "access-control-allow-headers": "content-type",
  },
  body: JSON.stringify(payload),
});

export const notFound = (traceId = "trace-dev-runtime") =>
  json(404, new AppError("NOT_FOUND", "Route not found.", 404).toPayload(traceId));

export const readSingleHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

export const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  if (cookieHeader === undefined || cookieHeader.trim().length === 0) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, chunk) => {
    const [rawName, ...rawValueParts] = chunk.trim().split("=");

    if (rawName.length === 0) {
      return accumulator;
    }

    accumulator[rawName] = decodeURIComponent(rawValueParts.join("="));
    return accumulator;
  }, {});
};

export const serializeCookie = (input: {
  name: string;
  value: string;
  path: string;
  maxAgeSeconds: number;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
}): string => {
  const parts = [`${input.name}=${encodeURIComponent(input.value)}`, `Path=${input.path}`, `Max-Age=${input.maxAgeSeconds}`, `SameSite=${input.sameSite}`];

  if (input.httpOnly) {
    parts.push("HttpOnly");
  }

  if (input.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

export const readJsonBody = async (request: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (rawBody.length === 0) {
    return {};
  }

  const parsed = JSON.parse(rawBody) as unknown;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AppError("VALIDATION_ERROR", "Request body must be a valid JSON object", 400);
  }

  return parsed as Record<string, unknown>;
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
      const response = await request({
        path: input,
        method: init?.method ?? "GET",
        headers: Object.fromEntries(Object.entries(init?.headers ?? {}).map(([key, value]) => [key, String(value)])),
        body: typeof init?.body === "string" && init.body.length > 0 ? JSON.parse(init.body) : undefined,
      });

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.body,
      };
    },
    readCookieValue: (name) => jar.get(name) ?? null,
    deleteCookie: (name) => {
      jar.delete(name);
    },
    setCookieValue: (name, value) => {
      jar.set(name, value);
    },
  };
};
