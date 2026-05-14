import type { IncomingMessage } from "node:http";
import { createAdminAccessModule } from "../../slices/admin-access/presentation/admin-access.module";
import { PrismaAdminAccessOperatorStaffMetricsReader } from "../../slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader";
import {
  createAdminAuthHttpHandler,
  resolveProtectedAdminRouteSession,
} from "../../slices/admin-access/presentation/admin-auth-http";
import { createCatalogModule } from "../../slices/catalog/presentation/catalog.module";
import { createCheckoutPaymentModule } from "../../slices/checkout-payment/presentation/checkout-payment.module";
import {
  createAdminAccessRuntimePrisma,
  devRuntimeAdminPasswordHashing,
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
import { resolveRuntimeCheckoutPaymentProvider } from "../payment-provider-runtime";
import { parseRuntimeBooleanFlag, resolveRuntimeMode } from "../runtime-mode";
import { createStagingTestHarness } from "../staging-test-harness";

export const createDevApiRuntime = (options: RuntimeServerOptions) => {
  const allowedOrigins = options.allowedOrigins ?? ["https://admin.example", "http://127.0.0.1:5173", "http://localhost:5173"];
  const runtimeMode = resolveRuntimeMode({
    paymentProvider: options.paymentProvider ?? process.env.PAYMENT_PROVIDER,
    nodeEnv: options.nodeEnv ?? process.env.NODE_ENV,
    appEnv: options.appEnv ?? process.env.APP_ENV,
    e2eTestMode: options.isE2eTestModeEnabled ?? parseRuntimeBooleanFlag(process.env.E2E_TEST_MODE),
    debug: options.isDebugEnabled ?? parseRuntimeBooleanFlag(process.env.DEBUG),
  });
  const checkoutPaymentProvider = resolveRuntimeCheckoutPaymentProvider({
    paymentProvider: options.paymentProvider ?? process.env.PAYMENT_PROVIDER,
    nodeEnv: runtimeMode.nodeEnv,
    appEnv: options.appEnv ?? process.env.APP_ENV,
    e2eTestMode: runtimeMode.e2eTestMode,
  });
  const adminPersistence = resolveAdminDatabasePersistence(options.adminDatabasePath);
  const prisma = createAdminAccessRuntimePrisma(adminPersistence.loadState(), {
    persist: (nextState) => {
      adminPersistence.saveState(nextState);
    },
  });
  const checkoutPaymentPrisma = createInMemoryCheckoutPaymentPrisma();
  const adminAccessModule = createAdminAccessModule(prisma);
  const adminAccessOperatorStaffMetricsReader = new PrismaAdminAccessOperatorStaffMetricsReader(prisma as never);
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
  const isDebugEnabled = runtimeMode.debug;
  const checkoutPaymentModule = createCheckoutPaymentModule(
    checkoutPaymentPrisma,
    {
      botToken: options.telegramBotToken ?? "test-bot-token",
      allowedOrigins,
      secureCookies: false,
      paymentProviderName: checkoutPaymentProvider.enabled ? checkoutPaymentProvider.providerName : undefined,
      paymentSecretToken: checkoutPaymentProvider.enabled ? checkoutPaymentProvider.secretToken : undefined,
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
    passwordHasher: options.passwordHasher ?? devRuntimeAdminPasswordHashing,
    allowedOrigins,
    traceIdFactory: () => "trace-admin-runtime",
    now: options.now,
  });
  const operationalModules = createOperationalRuntimeModules(checkoutPaymentState, {
    now: options.now,
  });
  const stagingTestHarness = createStagingTestHarness({
    adminAccessState: prisma.state,
    saveAdminAccessState: adminPersistence.saveState,
    catalogState,
    saveCatalogState: catalogPersistence.saveState,
    checkoutPaymentState,
    operationalRuntime: operationalModules,
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
      staffPanelReaders: {
        adminAccessOperatorStaffMetricsReader,
        courierStaffMetricsReader: operationalModules.staffMetrics.courierStaffMetricsReader,
        operatorStaffMetricsReader: operationalModules.staffMetrics.operatorStaffMetricsReader,
        reviewsFeedbackStaffMetricsReader: operationalModules.staffMetrics.reviewsFeedbackStaffMetricsReader,
      },
      isDebugEnabled,
      runtimeMode,
      checkoutPaymentProvider,
      stagingTestHarness,
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
