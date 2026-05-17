import { resolve } from "node:path";
import { startDevApiServer } from "../backend/src/dev-runtime/dev-api-server";
import { parseRuntimeBooleanFlag } from "../backend/src/dev-runtime/runtime-mode";

const parsePort = (value: string | undefined): number | undefined => {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseAllowedOrigins = (value: string | undefined): string[] | undefined => {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const isStagingRuntime = process.env.APP_ENV?.trim().toLowerCase() === "staging";
const defaultRuntimeDirectory = isStagingRuntime
  ? resolve(process.cwd(), ".runtime", "staging")
  : resolve(process.cwd(), "backend", "prisma");

const runtime = await startDevApiServer({
  host: process.env.HOST,
  port: parsePort(process.env.PORT),
  allowedOrigins: parseAllowedOrigins(process.env.ADMIN_ALLOWED_ORIGINS),
  adminDatabasePath:
    process.env.ADMIN_DB_PATH ??
    resolve(defaultRuntimeDirectory, isStagingRuntime ? "admin-access-runtime.sqlite" : "dev-admin-access-runtime.sqlite"),
  catalogDatabasePath:
    process.env.CATALOG_DB_PATH ??
    resolve(defaultRuntimeDirectory, isStagingRuntime ? "catalog-runtime.sqlite" : "dev-catalog-runtime.sqlite"),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramBotPollingEnabled: parseRuntimeBooleanFlag(process.env.TELEGRAM_BOT_POLLING),
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
  paymentProvider: process.env.PAYMENT_PROVIDER,
  nodeEnv: process.env.NODE_ENV,
  appEnv: process.env.APP_ENV,
  isE2eTestModeEnabled: parseRuntimeBooleanFlag(process.env.E2E_TEST_MODE),
  e2eTestToken: process.env.E2E_TEST_TOKEN,
  isDebugEnabled: parseRuntimeBooleanFlag(process.env.DEBUG),
});

process.stdout.write(`Demo API listening on ${runtime.baseUrl}\n`);
