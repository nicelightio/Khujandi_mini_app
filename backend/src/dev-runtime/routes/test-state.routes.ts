import { AppError } from "../../shared/errors/app-error";
import type { DevApiRouteHandler } from "../dev-api-server.types";
import { json, readJsonBody } from "../http-runtime";
import { isStagingTestHarnessEnabled, validateTestRuntimeToken } from "./test-runtime-guards";

const testStatePaths = new Set(["/api/v1/test/reset", "/api/v1/test/seed"]);

export const handleTestStateRoutes: DevApiRouteHandler = async ({ request, url, method, context }) => {
  if (!testStatePaths.has(url.pathname) || method !== "POST") {
    return undefined;
  }

  if (!isStagingTestHarnessEnabled(context)) {
    return undefined;
  }

  const tokenError = validateTestRuntimeToken(context, request.headers, "POST,OPTIONS");
  if (tokenError !== null) {
    return tokenError;
  }

  try {
    const body = await readJsonBody(request);

    if (url.pathname === "/api/v1/test/reset") {
      return json(
        200,
        context.stagingTestHarness.reset({
          scope: typeof body.scope === "string" ? body.scope : undefined,
        }),
        "POST,OPTIONS",
      );
    }

    return json(
      200,
      context.stagingTestHarness.seed({
        scenario: String(body.scenario ?? ""),
      }),
      "POST,OPTIONS",
    );
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
      new AppError("INTERNAL_ERROR", "Test runtime is temporarily unavailable", 500).toPayload("trace-test-runtime"),
      "POST,OPTIONS",
    );
  }
};
