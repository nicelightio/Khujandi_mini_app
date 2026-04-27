import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createAdminAccessModule } from "../slices/admin-access/presentation/admin-access.module";
import {
  createAdminAuthHttpHandler,
  resolveProtectedAdminRouteSession,
} from "../slices/admin-access/presentation/admin-auth-http";
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
import type {
  CheckoutPaymentCompositionDraft,
  CheckoutPaymentStatus,
} from "../slices/checkout-payment/domain/checkout-payment.types";
import {
  createOperationalRuntimeModules,
  ensureOperationalRuntimeBaseline,
} from "./order-ops-runtime";
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
  isDebugEnabled?: boolean;
  passwordHasher?: {
    verify: (secret: string, secretHash: string) => Promise<boolean>;
  };
  now?: () => Date;
  checkoutPaymentProviderStatusResolver?: (context: {
    userId: string;
    composition: CheckoutPaymentCompositionDraft;
  }) => CheckoutPaymentStatus;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const summarizeMediaValue = (value: string | null | undefined) => {
  if (value === undefined) {
    return { state: "undefined" };
  }

  if (value === null) {
    return { state: "null" };
  }

  return {
    state: "set",
    length: value.length,
    prefix: value.slice(0, 48),
  };
};

const logStorefrontDebug = (isDebugEnabled: boolean, event: string, details: Record<string, unknown>) => {
  if (!isDebugEnabled) {
    return;
  }

  console.info(`[debug-storefront] ${event}`, details);
};

const toCheckoutPaymentCompositionDraft = (value: unknown): CheckoutPaymentCompositionDraft => {
  if (!isRecord(value)) {
    throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Checkout composition is required", 409, {
      reason: "composition_missing",
      repairAction: "repair_composition",
      orderCreated: false,
    });
  }

  const items = value.items;
  const previewTotal = value.preview_total;

  if (
    typeof value.shop_public_path !== "string" ||
    value.shop_public_path.trim().length === 0 ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !isRecord(previewTotal) ||
    typeof previewTotal.amount_minor !== "number" ||
    typeof previewTotal.currency !== "string"
  ) {
    throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Checkout composition is invalid", 409, {
      reason: "composition_invalid",
      repairAction: "repair_composition",
      orderCreated: false,
    });
  }

  for (const item of items) {
    if (
      !isRecord(item) ||
      typeof item.product_id !== "string" ||
      item.product_id.trim().length === 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      !isRecord(item.display_snapshot) ||
      typeof item.display_snapshot.product_name !== "string" ||
      typeof item.display_snapshot.unit_price_minor !== "number" ||
      typeof item.display_snapshot.currency !== "string"
    ) {
      throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Checkout composition is invalid", 409, {
        reason: "composition_invalid",
        repairAction: "repair_composition",
        orderCreated: false,
      });
    }
  }

  return value as CheckoutPaymentCompositionDraft;
};

const buildRuntimePaymentProviderTxId = (userId: string, composition: CheckoutPaymentCompositionDraft): string => {
  const source = JSON.stringify({
    userId,
    compositionId: composition.composition_id ?? null,
    shopPublicPath: composition.shop_public_path,
    items: composition.items,
    previewTotal: composition.preview_total,
  });
  const digest = createHash("sha256").update(source).digest("hex").slice(0, 24);

  return `local-runtime-checkout-${digest}`;
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
  ensureOperationalRuntimeBaseline(checkoutPaymentState);
  const isDebugEnabled = options.isDebugEnabled === true;
  const checkoutPaymentProviderName = "local-runtime-provider";
  const checkoutPaymentProviderSecret = "local-runtime-provider-secret";
  const checkoutPaymentModule = createCheckoutPaymentModule(
    checkoutPaymentPrisma,
    {
      botToken: options.telegramBotToken ?? "test-bot-token",
      allowedOrigins,
      secureCookies: false,
      paymentProviderName: checkoutPaymentProviderName,
      paymentSecretToken: checkoutPaymentProviderSecret,
      now: options.now,
    },
    {
      getCheckoutCompositionSnapshot: async (shopPublicPath) => {
        const shop = catalogState.shops.find(
          (candidate) =>
            candidate.primaryPublicPath === shopPublicPath || candidate.secondaryPublicPath === shopPublicPath,
        );

        if (shop === undefined) {
          return null;
        }

        return {
          shop: {
            id: shop.id,
            sellerId: shop.sellerId,
            name: shop.name,
            status: shop.status,
            isDeleted: shop.isDeleted,
          },
          products: catalogState.products
            .filter((product) => product.shopId === shop.id)
            .map((product) => ({
              id: product.id,
              shopId: product.shopId,
              name: product.name,
              priceMinor: product.priceMinor,
              currency: "TJS",
              isDeleted: product.isDeleted,
            })),
        };
      },
    },
  );
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
  const operationalModules = createOperationalRuntimeModules(checkoutPaymentState, {
    now: options.now,
  });

  const resolveProtectedAdminSession = (request: IncomingMessage, authRequiredMessage: string) =>
    resolveProtectedAdminRouteSession(request, {
      controller: adminAccessModule.controller,
      allowedOrigins,
      authRequiredMessage,
      now: options.now,
    });

  const resolveDebugStorefrontAccess = async (request: IncomingMessage, shopRef: string) => {
    const user = await resolveMiniAppAuthenticatedUser(request, {
      state: checkoutPaymentState,
      now: options.now,
    });
    const ownedShop = await catalogModule.controller.getSellerShop(user.telegramId, shopRef);

    return {
      shop: ownedShop,
      actorLabel: user.telegramId,
      bypassApplied: false,
    };
  };

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
    } else if (method === "POST" && url.pathname === "/api/v1/auth/telegram/language") {
      try {
        const user = await resolveMiniAppAuthenticatedUser(request, {
          state: checkoutPaymentState,
          now: options.now,
        });
        const body = await readJsonBody(request);
        const language = String(body.language ?? "");

        result = json(
          200,
          {
            user: await checkoutPaymentModule.controller.syncLanguagePreference({
              telegramId: user.telegramId,
              language: language as "ru" | "en" | "tj",
            }),
          },
          "POST,OPTIONS",
        );
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
    } else if (method === "POST" && url.pathname === "/api/v1/orders/checkout") {
      try {
        const user = await resolveMiniAppAuthenticatedUser(request, {
          state: checkoutPaymentState,
          now: options.now,
        });
        const body = await readJsonBody(request);

        const composition = toCheckoutPaymentCompositionDraft(body.composition);
        const shop = catalogState.shops.find(
          (candidate) =>
            candidate.primaryPublicPath === composition.shop_public_path ||
            candidate.secondaryPublicPath === composition.shop_public_path,
        );

        if (shop === undefined) {
          throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Shop is not available for checkout", 409, {
            reason: "shop_unavailable",
            repairAction: "repair_composition",
            orderCreated: false,
          });
        }

        const productsById = new Map(catalogState.products.map((product) => [product.id, product]));
        const itemsTotalMinor = composition.items.reduce((total, item) => {
          const product = productsById.get(item.product_id);

          return total + (product?.shopId === shop.id && product.isDeleted !== true ? product.priceMinor * item.quantity : 0);
        }, 0);
        const deliveryFeeMinor = 0;
        const order = await checkoutPaymentModule.controller.checkoutOrder({
          order: {
            shopId: shop.id,
            shopNameSnapshot: shop.name,
            sellerId: shop.sellerId,
            clientId: user.id,
            courierId: null,
            itemsTotalMinor,
            deliveryFeeMinor,
            totalAmountMinor: itemsTotalMinor + deliveryFeeMinor,
          },
          composition,
          payment: {
            provider: checkoutPaymentProviderName,
            paymentProviderTxId: buildRuntimePaymentProviderTxId(user.id, composition),
            telegramPaymentChargeId: null,
            providerPaymentChargeId: null,
            status: options.checkoutPaymentProviderStatusResolver?.({
              userId: user.id,
              composition,
            }) ?? "PAID",
            source: "provider_status",
            verificationToken: checkoutPaymentProviderSecret,
          },
        });
        const updatedAt = options.now?.() ?? new Date();

        result = json(200, {
          orderId: order.id,
          status: order.status,
          paymentStatus: order.paymentStatus,
          updated_at: updatedAt.toISOString(),
          revision: operationalModules.getCurrentEventCursor(),
          confirmationLabel: "Order paid and created.",
        });
      } catch (error) {
        if (error instanceof AppError) {
          result = json(error.statusCode, error.toPayload("trace-checkout-payment-runtime"), "POST,OPTIONS");
        } else if (error instanceof SyntaxError) {
          result = json(
            400,
            new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload("trace-checkout-payment-runtime"),
            "POST,OPTIONS",
          );
        } else {
          result = json(
            500,
            new AppError("INTERNAL_ERROR", "Checkout runtime is temporarily unavailable", 500).toPayload("trace-checkout-payment-runtime"),
            "POST,OPTIONS",
          );
        }
      }
    } else if (method === "GET" && url.pathname === "/api/v1/events") {
      try {
        const user = await resolveMiniAppAuthenticatedUser(request, {
          state: checkoutPaymentState,
          now: options.now,
        });
        const customerOrderIds = new Set(
          checkoutPaymentState.orders
            .filter((order) => order.clientId === user.id && order.isDeleted !== true)
            .map((order) => order.id),
        );
        const eventStream = await operationalModules.deliveryTrackingModule.controller.getEventsSince(
          url.searchParams.get("since") ?? undefined,
        );

        result = json(
          200,
          {
            events: eventStream.events.filter((event) => customerOrderIds.has(event.entityId)),
            next_cursor: eventStream.nextCursor,
          },
          "GET,OPTIONS",
        );
      } catch (error) {
        if (error instanceof AppError) {
          result = json(error.statusCode, error.toPayload("trace-delivery-tracking-runtime"), "GET,OPTIONS");
        } else {
          result = json(
            500,
            new AppError("INTERNAL_ERROR", "Events runtime is temporarily unavailable", 500).toPayload(
              "trace-delivery-tracking-runtime",
            ),
            "GET,OPTIONS",
          );
        }
      }
    } else if (method === "GET" && url.pathname === "/api/v1/shops") {
      result = json(200, await catalogModule.controller.getShops(), "GET,OPTIONS");
    } else {
      const storefrontMatch = url.pathname.match(/^\/api\/v1\/shops\/([^/]+)$/u);
      const productsMatch = url.pathname.match(/^\/api\/v1\/shops\/([^/]+)\/products$/u);
      const sellerShopMatch = url.pathname.match(/^\/api\/v1\/seller\/shops\/([^/]+)$/u);
      const sellerMenuPageMatch = url.pathname.match(/^\/api\/v1\/seller\/menu-pages\/([^/]+)$/u);
      const sellerProductMatch = url.pathname.match(/^\/api\/v1\/seller\/products\/([^/]+)$/u);
      const adminAssignmentMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/assignment$/u);
      const adminCancellationMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/cancellation$/u);
      const adminRefundMatch = url.pathname.match(/^\/api\/v1\/admin\/orders\/([^/]+)\/refund$/u);

      if (method === "GET" && storefrontMatch !== null) {
        try {
          const publicPath = decodeURIComponent(storefrontMatch[1]);
          result = json(200, await catalogModule.controller.getStorefront(publicPath), "GET,OPTIONS");
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
      } else if (method === "GET" && productsMatch !== null) {
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
          const shopId = decodeURIComponent(sellerShopMatch[1]);
          const access = await resolveDebugStorefrontAccess(request, shopId);
          const shop = access.shop;
          const [menuPages, products] = await Promise.all([
            catalogModule.repository.listSellerMenuPagesByShop(shop.id),
            catalogModule.repository.listSellerProductsByShop(shop.id),
          ]);
          const payload = buildSellerStorefrontPayload(shop, menuPages, products);

          logStorefrontDebug(isDebugEnabled, "seller-storefront-read", {
            requestedShopRef: shopId,
            resolvedShopId: shop.id,
            actor: access.actorLabel,
            bypassApplied: access.bypassApplied,
            publicPath: payload.publicPath,
            headerImage: summarizeMediaValue(payload.headerImageUrl),
            backgroundImage: summarizeMediaValue(payload.backgroundImageUrl),
            menuPageCount: payload.menuPages.length,
            unpagedProductCount: payload.unpagedProducts.length,
          });

          result = json(200, payload, "GET,OPTIONS");
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
          const shopId = decodeURIComponent(sellerShopMatch[1]);
          const access = await resolveDebugStorefrontAccess(request, shopId);
          const ownedShop = access.shop;
          const body = await readJsonBody(request);
          const hasField = (field: string): boolean => Object.prototype.hasOwnProperty.call(body, field);
          const updateInput = {
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
          };

          logStorefrontDebug(isDebugEnabled, "seller-storefront-write-request", {
            requestedShopRef: shopId,
            resolvedShopId: ownedShop.id,
            actor: access.actorLabel,
            bypassApplied: access.bypassApplied,
            beforeHeaderImage: summarizeMediaValue(ownedShop.headerImageUrl),
            beforeBackgroundImage: summarizeMediaValue(ownedShop.backgroundImageUrl),
            input: {
              name: updateInput.name,
              descriptionLength: typeof updateInput.description === "string" ? updateInput.description.length : updateInput.description,
              headerImage: summarizeMediaValue(updateInput.headerImageUrl),
              backgroundImage: summarizeMediaValue(updateInput.backgroundImageUrl),
              status: updateInput.status ?? "unchanged",
            },
          });

          const updatedShop = await catalogModule.controller.updateShop(ownedShop.sellerId, shopId, updateInput);

          logStorefrontDebug(isDebugEnabled, "seller-storefront-write-result", {
            requestedShopRef: shopId,
            resolvedShopId: updatedShop.id,
            actor: access.actorLabel,
            bypassApplied: access.bypassApplied,
            afterHeaderImage: summarizeMediaValue(updatedShop.headerImageUrl),
            afterBackgroundImage: summarizeMediaValue(updatedShop.backgroundImageUrl),
            status: updatedShop.status,
          });

          result = json(
            200,
            updatedShop,
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
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const access = await resolveDebugStorefrontAccess(request, shopId);
          const ownedShop = access.shop;
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
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const access = await resolveDebugStorefrontAccess(request, shopId);
          const ownedShop = access.shop;
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
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const access = await resolveDebugStorefrontAccess(request, shopId);
          const ownedShop = access.shop;
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
          const body = await readJsonBody(request);
          const shopId = String(body.shopId ?? "");
          const access = await resolveDebugStorefrontAccess(request, shopId);
          const ownedShop = access.shop;
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
      } else if (method === "POST" && adminAssignmentMatch !== null) {
        try {
          const session = await resolveProtectedAdminSession(request, "Assignment requires an authenticated admin");
          const body = await readJsonBody(request);
          const orderId = decodeURIComponent(adminAssignmentMatch[1]);
          result = json(
            200,
            await operationalModules.deliveryAssignmentModule.controller.assignCourier({
              orderId,
              courierId: String(body.courierId ?? ""),
              actor: {
                userId: session.adminAccountId,
                role: session.role,
              },
            }),
            "POST,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-delivery-assignment-runtime"), "POST,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
                "trace-delivery-assignment-runtime",
              ),
              "POST,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Assignment runtime is temporarily unavailable", 500).toPayload(
                "trace-delivery-assignment-runtime",
              ),
              "POST,OPTIONS",
            );
          }
        }
      } else if (method === "POST" && adminCancellationMatch !== null) {
        try {
          const session = await resolveProtectedAdminSession(request, "Cancellation requires an authenticated operator");
          const body = await readJsonBody(request);
          const orderId = decodeURIComponent(adminCancellationMatch[1]);
          result = json(
            200,
            await operationalModules.orderCancellationModule.controller.cancelOrder({
              orderId,
              reasonCode: String(body.reasonCode ?? ""),
              actor: {
                userId: session.adminAccountId,
                role: session.role,
              },
            }),
            "POST,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-order-cancellation-runtime"), "POST,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
                "trace-order-cancellation-runtime",
              ),
              "POST,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Cancellation runtime is temporarily unavailable", 500).toPayload(
                "trace-order-cancellation-runtime",
              ),
              "POST,OPTIONS",
            );
          }
        }
      } else if (method === "POST" && adminRefundMatch !== null) {
        try {
          const session = await resolveProtectedAdminSession(request, "Refund tracking requires an authenticated operator");
          const body = await readJsonBody(request);
          const orderId = decodeURIComponent(adminRefundMatch[1]);
          if (body.refundStatus !== "DONE" && body.refundStatus !== "REJECTED") {
            throw new AppError("VALIDATION_ERROR", "Refund status must be DONE or REJECTED", 400, {
              field: "refundStatus",
            });
          }
          result = json(
            200,
            await operationalModules.orderCancellationModule.controller.recordRefundUpdate({
              orderId,
              refundStatus: body.refundStatus,
              refundNote: String(body.refundNote ?? ""),
              actor: {
                userId: session.adminAccountId,
                role: session.role,
              },
            }),
            "POST,OPTIONS",
          );
        } catch (error) {
          if (error instanceof AppError) {
            result = json(error.statusCode, error.toPayload("trace-order-cancellation-runtime"), "POST,OPTIONS");
          } else if (error instanceof SyntaxError) {
            result = json(
              400,
              new AppError("VALIDATION_ERROR", "Request body must be valid JSON", 400).toPayload(
                "trace-order-cancellation-runtime",
              ),
              "POST,OPTIONS",
            );
          } else {
            result = json(
              500,
              new AppError("INTERNAL_ERROR", "Refund runtime is temporarily unavailable", 500).toPayload(
                "trace-order-cancellation-runtime",
              ),
              "POST,OPTIONS",
            );
          }
        }
      } else if (method === "GET" && url.pathname === "/api/v1/admin/catalog/shops") {
        try {
          await resolveAdminProvisioningSession(request, {
            controller: adminAccessModule.controller,
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
            controller: adminAccessModule.controller,
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
