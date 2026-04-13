import { resolve } from "node:path";
import { startDevApiServer } from "../backend/src/dev-runtime/dev-api-server";

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

const runtime = await startDevApiServer({
  host: process.env.HOST,
  port: parsePort(process.env.PORT),
  allowedOrigins: parseAllowedOrigins(process.env.ADMIN_ALLOWED_ORIGINS),
  catalogDatabasePath: process.env.CATALOG_DB_PATH ?? resolve(process.cwd(), "backend", "prisma", "dev-catalog-runtime.sqlite"),
});

process.stdout.write(`Demo API listening on ${runtime.baseUrl}\n`);
