import type { IncomingMessage } from "node:http";
import { createAdminAccessModule } from "../../slices/admin-access/presentation/admin-access.module";
import {
  createAdminAuthHttpHandler,
  resolveProtectedAdminRouteSession,
} from "../../slices/admin-access/presentation/admin-auth-http";
import { createCatalogModule } from "../../slices/catalog/presentation/catalog.module";
import { createCheckoutPaymentModule } from "../../slices/checkout-payment/presentation/checkout-payment.module";
import {
  createAdminAccessRuntimePrisma,
  resolveAdminDatabasePersistence,
} from "../admin-access-runtime";
import {
  createInMemoryCatalogPrisma,
  resolveCatalogDatabasePersistence,
} from "../catalog-runtime";
import {
  createInMemoryCheckoutPaymentPrisma,
  resolveMiniAppAuthenticatedUser,
} from "../checkout-payment-runtime";
import type { RuntimeServerOptions } from "../dev-api-server.types";
import {
  createOperationalRuntimeModules,
  ensureOperationalRuntimeBaseline,
} from "../order-ops-runtime";

export const createDevApiRuntime = (options: RuntimeServerOptions) => {
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
      authRequiredMessage: "Seller access requires an authenticated Telegram session",
      now: options.now,
    });
    const ownedShop = await catalogModule.controller.getSellerShop(user.telegramId, shopRef);

    return {
      shop: ownedShop,
      actorLabel: user.telegramId,
      bypassApplied: false,
    };
  };

  return {
    prisma,
    catalogModule,
    catalogDatabasePath: catalogPersistence.databasePath,
    catalogState,
    checkoutPaymentState,
    adminAuthHandler,
    routeContext: {
      options,
      allowedOrigins,
      adminAccessModule,
      catalogModule,
      checkoutPaymentModule,
      checkoutPaymentState,
      catalogState,
      operationalModules,
      isDebugEnabled,
      checkoutPaymentProviderName,
      checkoutPaymentProviderSecret,
      resolveProtectedAdminSession,
      resolveDebugStorefrontAccess,
    },
    dispose: () => {
      adminPersistence.close();
      adminPersistence.cleanup();
      catalogPersistence.close();
      catalogPersistence.cleanup();
    },
  };
};
