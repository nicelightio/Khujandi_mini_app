import { AppError } from "../../shared/errors/app-error";
import { json, readJsonBody, readSingleHeader } from "../http-runtime";
import type { DevApiRouteHandler } from "../dev-api-server.types";
import type { TelegramBotApiUpdate } from "../telegram-bot-api";

const isTelegramBotUpdate = (value: Record<string, unknown>): value is TelegramBotApiUpdate =>
  typeof value.update_id === "number";

export const handleTelegramBotRoutes: DevApiRouteHandler = async ({ request, url, method, context }) => {
  if (method !== "POST" || url.pathname !== "/api/v1/telegram/webhook") {
    return undefined;
  }

  try {
    const configuredSecret = context.telegramWebhookSecret?.trim();
    const headerSecret = readSingleHeader(request.headers["x-telegram-bot-api-secret-token"]);

    if (configuredSecret !== undefined && configuredSecret.length > 0 && headerSecret !== configuredSecret) {
      throw new AppError("FORBIDDEN", "Telegram webhook secret is invalid", 403);
    }

    if (configuredSecret === undefined || configuredSecret.length === 0) {
      if (context.runtimeMode.nodeEnv === "production" || context.isTelegramBotApiEnabled) {
        throw new AppError("FORBIDDEN", "Telegram webhook secret is required for real Telegram bot runtime", 403);
      }
    }

    const body = await readJsonBody(request);

    if (!isTelegramBotUpdate(body)) {
      throw new AppError("VALIDATION_ERROR", "Telegram update payload is invalid", 400, {
        field: "update_id",
      });
    }

    return json(200, await context.telegramBotRuntime.handleUpdate(body), "POST,OPTIONS");
  } catch (error) {
    if (error instanceof AppError) {
      return json(error.statusCode, error.toPayload("trace-telegram-bot-runtime"), "POST,OPTIONS");
    }

    if (error instanceof SyntaxError) {
      return json(
        400,
        new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
          "trace-telegram-bot-runtime",
        ),
        "POST,OPTIONS",
      );
    }

    return json(
      500,
      new AppError("INTERNAL_ERROR", "Telegram bot runtime is temporarily unavailable", 500).toPayload(
        "trace-telegram-bot-runtime",
      ),
      "POST,OPTIONS",
    );
  }
};
