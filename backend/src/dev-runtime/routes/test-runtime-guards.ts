import type { IncomingHttpHeaders } from "node:http";
import { AppError } from "../../shared/errors/app-error";
import type { DevApiRouteContext, RuntimeHttpResult } from "../dev-api-server.types";
import { json, readSingleHeader } from "../http-runtime";

export const isStagingTestHarnessEnabled = (context: DevApiRouteContext): boolean =>
  context.runtimeMode.e2eTestMode &&
  context.runtimeMode.nodeEnv !== "production" &&
  ["local", "staging", "test"].includes(context.runtimeMode.appEnv);

export const hasValidTestRuntimeToken = (
  expectedToken: string | undefined,
  actualToken: string | undefined,
): boolean =>
  typeof expectedToken === "string" &&
  expectedToken.trim().length > 0 &&
  typeof actualToken === "string" &&
  actualToken === expectedToken;

export const validateTestRuntimeToken = (
  context: DevApiRouteContext,
  requestHeaders: IncomingHttpHeaders,
  methods: string,
): RuntimeHttpResult | null => {
  const expectedToken = context.options.e2eTestToken ?? process.env.E2E_TEST_TOKEN;
  const actualToken = readSingleHeader(requestHeaders["x-e2e-test-token"]);

  if (hasValidTestRuntimeToken(expectedToken, actualToken)) {
    return null;
  }

  return json(
    403,
    new AppError("FORBIDDEN", "Test runtime token is required", 403).toPayload("trace-test-runtime"),
    methods,
  );
};
