import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import {
  createRuntimeCookieSessionClient,
  json,
  notFound,
} from "./http-runtime";
import type { RuntimeServerOptions } from "./dev-api-server.types";
import { createDevApiRuntime } from "./modules/dev-api-runtime";
import { handleAdminOrderOperationRoutes } from "./routes/admin-order-operations.routes";
import { handleCatalogRoutes } from "./routes/catalog.routes";
import { handleHealthRoutes } from "./routes/health.routes";
import { handleMiniAppRoutes } from "./routes/mini-app.routes";
import { handleTestSessionRoutes } from "./routes/test-session.routes";
import { handleTestStateRoutes } from "./routes/test-state.routes";

export { createRuntimeCookieSessionClient };
export type { RuntimeCookieSessionClient } from "./http-runtime";

const resolvePreflightMethods = (pathname: string): string => {
  if (
    /^\/api\/v1\/admin\/catalog\/showcase\/products\/[^/]+$/u.test(pathname) ||
    /^\/api\/v1\/admin\/catalog\/showcase\/shops\/[^/]+$/u.test(pathname)
  ) {
    return "POST,DELETE,OPTIONS";
  }

  return "GET,POST,OPTIONS";
};

export const startDevApiServer = async (options: RuntimeServerOptions = {}) => {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 3001;
  const runtime = createDevApiRuntime(options);

  const server: Server = createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (method === "OPTIONS") {
      const result = json(204, null, resolvePreflightMethods(url.pathname));
      response.writeHead(result.statusCode, result.headers);
      response.end();
      return;
    }

    if (await runtime.adminAuthHandler(request, response)) {
      return;
    }

    const routeInput = { request, url, method, context: runtime.routeContext };
    const result =
      (await handleHealthRoutes(routeInput)) ??
      (await handleTestStateRoutes(routeInput)) ??
      (await handleTestSessionRoutes(routeInput)) ??
      (await handleMiniAppRoutes(routeInput)) ??
      (await handleCatalogRoutes(routeInput)) ??
      (await handleAdminOrderOperationRoutes(routeInput)) ??
      notFound();

    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  });

  await new Promise<void>((resolve) => {
    server.listen(port, host, () => resolve());
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://${host}:${address.port}`;

  return {
    baseUrl,
    prisma: runtime.prisma,
    catalogModule: runtime.catalogModule,
    operationalModules: runtime.routeContext.operationalModules,
    catalogDatabasePath: runtime.catalogDatabasePath,
    catalogState: runtime.catalogState,
    checkoutPaymentState: runtime.checkoutPaymentState,
    createClient: () => createRuntimeCookieSessionClient(baseUrl),
    stop: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error !== undefined && error !== null) {
            reject(error);
            return;
          }

          resolve();
        });
      });
      runtime.dispose();
    },
  };
};
