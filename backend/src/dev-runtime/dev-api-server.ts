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
import { handleMiniAppRoutes } from "./routes/mini-app.routes";

export { createRuntimeCookieSessionClient };
export type { RuntimeCookieSessionClient } from "./http-runtime";

export const startDevApiServer = async (options: RuntimeServerOptions = {}) => {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 3001;
  const runtime = createDevApiRuntime(options);

  const server: Server = createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (method === "OPTIONS") {
      const result = json(204, null);
      response.writeHead(result.statusCode, result.headers);
      response.end();
      return;
    }

    if (await runtime.adminAuthHandler(request, response)) {
      return;
    }

    const routeInput = { request, url, method, context: runtime.routeContext };
    const result =
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
