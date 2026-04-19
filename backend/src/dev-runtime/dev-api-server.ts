import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createAdminAccessModule } from "../slices/admin-access/presentation/admin-access.module";
import { createAdminAuthHttpHandler } from "../slices/admin-access/presentation/admin-auth-http";
import { createCheckoutPaymentModule } from "../slices/checkout-payment/presentation/checkout-payment.module";
import { createCatalogModule } from "../slices/catalog/presentation/catalog.module";
import { AppError } from "../shared/errors/app-error";
import {
  buildSellerStorefrontPayload,
  createInMemoryCatalogPrisma,
  resolveCatalogDatabasePersistence,
} from "./catalog-runtime";
import {
  createAdminAccessRuntimePrisma,
  resolveAdminDatabasePersistence,
  resolveAdminProvisioningSession,
} from "./admin-access-runtime";
import {
  createInMemoryCheckoutPaymentPrisma,
  resolveMiniAppAuthenticatedUser,
} from "./checkout-payment-runtime";
import {
  createRuntimeCookieSessionClient,
  json,
  notFound,
  readJsonBody,
  readSingleHeader,
  serializeCookie,
} from "./http-runtime";

export { createRuntimeCookieSessionClient };
export type { RuntimeCookieSessionClient } from "./http-runtime";

type RuntimeServerOptions = {
  host?: string;
  port?: number;
  allowedOrigins?: string[];
  adminDatabasePath?: string;
  catalogDatabasePath?: string;
  telegramBotToken?: string;
  passwordHasher?: {
    verify: (secret: string, secretHash: string) => Promise<boolean>;
  };
  now?: () => Date;
};

export const startDevApiServer = async (options: RuntimeServerOptions = {}) => {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 3001;
  const allowedOrigins = options.allowedOrigins ?? ["https://admin.example", "http://127.0.0.1:5173", "http://localhost:5173"];
  const adminPersistence = resolveAdminDatabasePersistence(options.adminDatabasePath);
  const prisma = createAdminAccessRuntimePrisma(adminPersistence.loadState(), {
    persist: (nextState) => {
      adminPersistence.saveState(nextState);
    },
  });
  const checkoutPaymentPrisma = createInMemoryCheckoutPaymentPrisma();
  const adminAccessModule = createAdminAccessModule(prisma);
  const catalogPersistence = resolveCatalogDatabasePersistence(options.catalogDatabasePath);
  const catalogState = catalogPersistence.loadState();
  const catalogPrisma = createInMemoryCatalogPrisma(catalogState, {
    persist: (nextState) => {
      catalogPersistence.saveState(nextState);
    },
  });
  const catalogModule = createCatalogModule(catalogPrisma);
  const checkoutPaymentState = checkoutPaymentPrisma.state;
  const checkoutPaymentModule = createCheckoutPaymentModule(checkoutPaymentPrisma, {
    botToken: options.telegramBotToken ?? "test-bot-token",
    allowedOrigins,
    secureCookies: false,
    now: options.now,
  });
  const adminAuthHandler = createAdminAuthHttpHandler({
    controller: adminAccessModule.controller,
    passwordHasher:
      options.passwordHasher ?? {
        verify: async (secret, secretHash) => secret === "super-secret-01" && secretHash === "stored-hash",
      },
    allowedOrigins,
    traceIdFactory: () => "trace-admin-runtime",
    now: options.now,
  });

  const server: Server = createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", `http://${host}:${port}`);

    if (method === "OPTIONS") {
      const result = json(204, null);
      response.writeHead(result.statusCode, result.headers);
      response.end();
      return;
    }

    if (await adminAuthHandler(request, response)) {
      return;
    }

    let result;

    if (method === "POST" && url.pathname === "/api/v1/auth/telegram") {
      try {
        const body = await readJsonBody(request);
        const authResult = await checkoutPaymentModule.controller.authenticateTelegram({
          initData: String(body.initData ?? ""),
          origin: readSingleHeader(request.headers.origin),
          referer: readSingleHeader(request.headers.referer),
        });

        result = json(
          200,
          {
            user: authResult.user,
            sellerCapabilities: (await catalogModule.repository.listSellerBindingsByTelegramId(authResult.user.telegramId)).length > 0,
          },
          "POST,OPTIONS",
        );
        result.headers["set-cookie"] = [
          serializeCookie(authResult.session.cookie),
        ];
      } catch (error) {
        if (error instanceof AppError) {
          result = json(error.statusCode, error.toPayload("trace-mini-app-auth-runtime"), "POST,OPTIONS");
        } else if (error instanceof SyntaxError) {
          result = json(
            400,
            new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-mini-app-auth-runtime"),
            "POST,OPTIONS",
          );
        } else {
          result = json(
            500,
            new AppError("INTERNAL_ERROR", "Mini App auth runtime is temporarily unavailable", 500).toPayload("trace-mini-app-auth-runtime"),
            "POST,OPTIONS",
          );
        }
      }
    } else if (method === "GET" && url.pathname === "/api/v1/shops") {
      result = json(200, await catalogModule.controller.getShops(), "GET,OPTIONS");
    } else {
      const productsMatch = url.pathname.match(/^\/api\/v1\/shops\/([^/]+)\/products$/u);
      const sellerShopMatch = url.pathname.match(/^\/api\/v1\/seller\/shops\/([^/]+)$/u);
      const sellerMenuPageMatch = url.pathname.match(/^\/api\/v1\/seller\/menu-pages\/([^/]+)$/u);
      const sellerProductMatch = url.pathname.match(/^\/api\/v1\/seller\/products\/([^/]+)$/u);

      if (method === "GET" && productsMatch !== null) {
        const shopId = decodeURIComponent(productsMatch[1]);
        result = json(200, await catalogModule.controller.getProducts(shopId), "GET,OPTIONS");
      } else if (method === "GET" && url.pathname === "/api/v1/seller/shops") {
        try {
          const user = await resolveMiniAppAuthenticatedUser(request, {
            state: checkoutPaymentState,
            now: options.now,
          });
          result = json(200, await catalogModule.controller.getSellerShops(user.telegramId), "GET,OPTIONS");
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "GET,OPTIONS",
            );
          }
        }
      } else if (method === "GET" && sellerShopMatch !== null) {
        try {
          const user = await resolveMiniAppAuthenticatedUser(request, {
            state: checkoutPaymentState,
            now: options.now,
          });
          const shopId = decodeURIComponent(sellerShopMatch[1]);
          const shop = await catalogModule.controller.getSellerShop(user.telegramId, shopId);
          const [menuPages, products] = await Promise.all([
            catalogModule.repository.listSellerMenuPagesByShop(shop.id),
            catalogModule.repository.listSellerProductsByShop(shop.id),
          ]);
          result = json(200, buildSellerStorefrontPayload(shop, menuPages, products), "GET,OPTIONS");
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "GET,OPTIONS",
            );
          }
        }
      } else if (method === "PUT" && sellerShopMatch !== null) {
        try {
          const user = await resolveMiniAppAuthenticatedUser(request, {
            state: checkoutPaymentState,
            now: options.now,
          });
          const shopId = decodeURIComponent(sellerShopMatch[1]);
          const ownedShop = await catalogModule.controller.getSellerShop(user.telegramId, shopId);
          const body = await readJsonBody(request);
          const hasField = (field: string): boolean => Object.prototype.hasOwnProperty.call(body, field);
          result = json(
            200,
            await catalogModule.controller.updateShop(ownedShop.sellerId, shopId, {
              name: hasField("name") ? String(body.name ?? "") : ownedShop.name,
              description: hasField("description")
                ? body.description == null
                  ? null
                  : String(body.description)
                : undefined,
              headerImageUrl: hasField("headerImageUrl")
                ? body.headerImageUrl == null
                  ? null
                  : String(body.headerImageUrl)
                : undefined,
              backgroundImageUrl: hasField("backgroundImageUrl")
                ? body.backgroundImageUrl == null
                  ? null
                  : String(body.backgroundImageUrl)
                : undefined,
              status:
                body.status === "WORKING" || body.status === "NOT_WORKING"
                  ? body.status
                  : undefined,
            }),
            "PUT,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "PUT,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
              "PUT,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "PUT,OPTIONS",
            );
          }
        }
      } else if (method === "POST" && url.pathname === "/api/v1/seller/menu-pages") {
        try {
          const user = await resolveMiniAppAuthenticatedUser(request, {
            state: checkoutPaymentState,
            now: options.now,
          });
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const ownedShop = await catalogModule.controller.getSellerShop(user.telegramId, shopId);
          result = json(
            201,
            await catalogModule.controller.createMenuPage(ownedShop.sellerId, {
              shopId,
              name: String(body.name ?? ""),
              position: Number(body.position ?? 0),
            }),
            "POST,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "POST,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
              "POST,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "POST,OPTIONS",
            );
          }
        }
      } else if (method === "PUT" && sellerMenuPageMatch !== null) {
        try {
          const user = await resolveMiniAppAuthenticatedUser(request, {
            state: checkoutPaymentState,
            now: options.now,
          });
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const ownedShop = await catalogModule.controller.getSellerShop(user.telegramId, shopId);
          const menuPageId = decodeURIComponent(sellerMenuPageMatch[1]);
          result = json(
            200,
            await catalogModule.controller.updateMenuPage(ownedShop.sellerId, menuPageId, {
              shopId,
              name: String(body.name ?? ""),
            }),
            "PUT,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "PUT,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
              "PUT,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "PUT,OPTIONS",
            );
          }
        }
      } else if (method === "POST" && url.pathname === "/api/v1/seller/products") {
        try {
          const user = await resolveMiniAppAuthenticatedUser(request, {
            state: checkoutPaymentState,
            now: options.now,
          });
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const ownedShop = await catalogModule.controller.getSellerShop(user.telegramId, shopId);
          result = json(
            201,
            await catalogModule.controller.createProduct(ownedShop.sellerId, {
              shopId,
              menuPageId: body.menuPageId == null ? null : String(body.menuPageId),
              name: String(body.name ?? ""),
              description: body.description == null ? null : String(body.description),
              imageUrl: body.imageUrl == null ? null : String(body.imageUrl),
              priceMinor: Number(body.priceMinor ?? 0),
            }),
            "POST,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "POST,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
              "POST,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "POST,OPTIONS",
            );
          }
        }
      } else if (method === "PUT" && sellerProductMatch !== null) {
        try {
          const user = await resolveMiniAppAuthenticatedUser(request, {
            state: checkoutPaymentState,
            now: options.now,
          });
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const ownedShop = await catalogModule.controller.getSellerShop(user.telegramId, shopId);
          const productId = decodeURIComponent(sellerProductMatch[1]);
          result = json(
            200,
            await catalogModule.controller.updateProduct(ownedShop.sellerId, productId, {
              shopId,
              menuPageId: body.menuPageId == null ? null : String(body.menuPageId),
              name: String(body.name ?? ""),
              description: body.description == null ? null : String(body.description),
              imageUrl: body.imageUrl == null ? null : String(body.imageUrl),
              priceMinor: Number(body.priceMinor ?? 0),
            }),
            "PUT,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "PUT,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
              "PUT,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "PUT,OPTIONS",
            );
          }
        }
      } else if (method === "GET" && url.pathname === "/api/v1/admin/catalog/shops") {
        try {
          await resolveAdminProvisioningSession(request, {
            prisma,
            allowedOrigins,
            now: options.now,
          });
          result = json(200, await catalogModule.controller.getAdminProvisionedShops(), "GET,OPTIONS");
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "GET,OPTIONS");
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "GET,OPTIONS",
            );
          }
        }
      } else if (method === "POST" && url.pathname === "/api/v1/admin/catalog/shops/provision") {
        try {
          await resolveAdminProvisioningSession(request, {
            prisma,
            allowedOrigins,
            now: options.now,
          });
          const body = await readJsonBody(request);
          const provisioned = await catalogModule.controller.provisionShop({
            sellerId: String(body.sellerId ?? ""),
            telegramId: String(body.telegramId ?? ""),
            name: String(body.name ?? ""),
            description: body.description == null ? undefined : String(body.description),
            headerImageUrl: body.headerImageUrl == null ? undefined : String(body.headerImageUrl),
            backgroundImageUrl: body.backgroundImageUrl == null ? undefined : String(body.backgroundImageUrl),
            status:
              body.status === "WORKING" || body.status === "NOT_WORKING"
                ? body.status
                : undefined,
          });
          result = json(201, provisioned, "POST,OPTIONS");
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-catalog-runtime"), "POST,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-catalog-runtime"),
              "POST,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Catalog runtime is temporarily unavailable", 500).toPayload("trace-catalog-runtime"),
              "POST,OPTIONS",
            );
          }
        }
      } else {
        result = notFound();
      }
    }

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
    prisma,
    catalogModule,
    catalogDatabasePath: catalogPersistence.databasePath,
    catalogState,
    checkoutPaymentState,
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
      adminPersistence.close();
      adminPersistence.cleanup();
      catalogPersistence.close();
      catalogPersistence.cleanup();
    },
  };
};
