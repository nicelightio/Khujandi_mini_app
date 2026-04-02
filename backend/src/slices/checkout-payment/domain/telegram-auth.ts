import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const TELEGRAM_INIT_DATA_TTL_MS = 10 * 60 * 1000;

export type ParsedTelegramUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  languageCode: string | null;
};

export type ParsedTelegramInitData = {
  authDate: number;
  hash: string;
  user: ParsedTelegramUser;
};

const isNonEmptyString = (value: string | null): value is string =>
  value !== null && value.trim().length > 0;

export const parseTelegramInitData = (initData: string): ParsedTelegramInitData => {
  if (!isNonEmptyString(initData)) {
    throw new Error("Telegram initData is empty");
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const authDateRaw = params.get("auth_date");
  const userRaw = params.get("user");

  if (!isNonEmptyString(hash)) {
    throw new Error("Telegram initData hash is missing");
  }

  if (!isNonEmptyString(authDateRaw)) {
    throw new Error("Telegram auth_date is missing");
  }

  if (!isNonEmptyString(userRaw)) {
    throw new Error("Telegram user payload is missing");
  }

  const authDate = Number.parseInt(authDateRaw, 10);

  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new Error("Telegram auth_date is invalid");
  }

  let userPayload: Record<string, unknown>;

  try {
    userPayload = JSON.parse(userRaw) as Record<string, unknown>;
  } catch {
    throw new Error("Telegram user payload is invalid");
  }

  const userId = userPayload.id;

  if (typeof userId !== "number" && typeof userId !== "string") {
    throw new Error("Telegram user id is missing");
  }

  return {
    authDate,
    hash,
    user: {
      id: String(userId),
      firstName: typeof userPayload.first_name === "string" ? userPayload.first_name : null,
      lastName: typeof userPayload.last_name === "string" ? userPayload.last_name : null,
      username: typeof userPayload.username === "string" ? userPayload.username : null,
      languageCode:
        typeof userPayload.language_code === "string" ? userPayload.language_code : null,
    },
  };
};

export const buildTelegramDataCheckString = (initData: string): string => {
  const params = new URLSearchParams(initData);
  const pairs: string[] = [];

  params.forEach((value, key) => {
    if (key !== "hash") {
      pairs.push(`${key}=${value}`);
    }
  });

  return pairs.sort((left, right) => left.localeCompare(right)).join("\n");
};

export const deriveTelegramSecretKey = (botToken: string): Buffer =>
  createHmac("sha256", "WebAppData").update(botToken).digest();

export const calculateTelegramInitDataHash = (initData: string, botToken: string): string =>
  createHmac("sha256", deriveTelegramSecretKey(botToken))
    .update(buildTelegramDataCheckString(initData))
    .digest("hex");

export const validateTelegramInitDataSignature = (initData: string, botToken: string): boolean => {
  try {
    const parsed = parseTelegramInitData(initData);
    const actual = Buffer.from(calculateTelegramInitDataHash(initData, botToken), "hex");
    const expected = Buffer.from(parsed.hash, "hex");

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
};

export const isTelegramAuthDateFresh = (
  authDate: number,
  nowMs: number,
  ttlMs = TELEGRAM_INIT_DATA_TTL_MS,
): boolean => nowMs - authDate * 1000 <= ttlMs;

export const hashTelegramReplayKey = (initData: string): string =>
  createHash("sha256").update(initData).digest("hex");

export const hashSessionToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const createMiniAppSessionToken = (): string => randomBytes(32).toString("hex");

export const buildTelegramDisplayName = (user: ParsedTelegramUser): string => {
  const parts = [user.firstName, user.lastName].filter(
    (value): value is string => value !== null && value.trim().length > 0,
  );

  if (parts.length > 0) {
    return parts.join(" ");
  }

  if (user.username !== null && user.username.trim().length > 0) {
    return user.username;
  }

  return `telegram:${user.id}`;
};
