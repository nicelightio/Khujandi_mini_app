import type { DevApiRouteHandler } from "../dev-api-server.types";
import { json } from "../http-runtime";

export const handleHealthRoutes: DevApiRouteHandler = async ({ url, method, context }) => {
  if (method !== "GET" || url.pathname !== "/api/v1/health") {
    return undefined;
  }

  const mode = context.runtimeMode;

  return json(
    200,
    {
      ok: true,
      appEnv: mode.appEnv,
      nodeEnv: mode.nodeEnv,
      debug: mode.debug,
      paymentProvider: mode.paymentProvider,
      e2eTestMode: mode.e2eTestMode,
      version: mode.version,
    },
    "GET,OPTIONS",
  );
};
