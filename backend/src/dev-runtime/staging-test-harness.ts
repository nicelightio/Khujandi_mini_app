import { AppError } from "../shared/errors/app-error";
import type { AdminAccessRuntimeState } from "./admin-access-runtime";
import { createAdminAccessRuntimeState } from "./admin-access-runtime";
import type { CatalogRuntimeState } from "./catalog-runtime-state";
import { createCatalogRuntimeState } from "./catalog-runtime-state";
import type { CheckoutPaymentRuntimeState } from "./checkout-payment-runtime";

type OperationalRuntimeReset = {
  resetRuntimeState: () => void;
  seedOrderStatusHistory: (seeds: Array<{
    orderId: string;
    createdAtOffsetMs: number;
    updatedAtOffsetMs: number;
    assignedAtOffsetMs?: number | null;
    history: Array<{
      orderId: string;
      oldStatus: string;
      newStatus: string;
      changedByUserId: string;
      changedByRole?: string;
      changedByName?: string;
      changedAtOffsetMs: number;
    }>;
  }>) => void;
  getCurrentEventCursor: () => string;
  saveRuntimeState?: () => void;
};

type StagingTestHarnessDependencies = {
  adminAccessState: AdminAccessRuntimeState;
  saveAdminAccessState: (state: AdminAccessRuntimeState) => void;
  catalogState: CatalogRuntimeState;
  saveCatalogState: (state: CatalogRuntimeState) => void;
  checkoutPaymentState: CheckoutPaymentRuntimeState;
  operationalRuntime: OperationalRuntimeReset;
};

const formatAllowlist = (values: readonly string[]): string => values.join(",");

const seedUsers = {
  clientAlina: {
    id: "test-client-alina",
    telegramId: "910001",
    role: "client" as const,
    name: "Alina",
    username: "client_alina",
    language: "ru" as const,
    isActive: true,
  },
  sellerPlov: {
    id: "test-seller-plov",
    telegramId: "920001",
    role: "client" as const,
    name: "Seller Plov",
    username: "seller_plov",
    language: "ru" as const,
    isActive: true,
  },
  courier7: {
    id: "courier-7",
    telegramId: "70007",
    role: "courier" as const,
    name: "Courier 7",
    username: "courier7",
    language: "ru" as const,
    isActive: true,
  },
};

const resetCatalogState = (target: CatalogRuntimeState): void => {
  const baseline = createCatalogRuntimeState();
  target.shops.splice(0, target.shops.length, ...baseline.shops);
  target.menuPages.splice(0, target.menuPages.length, ...baseline.menuPages);
  target.products.splice(0, target.products.length, ...baseline.products);
  target.showcaseProducts.splice(0, target.showcaseProducts.length, ...(baseline.showcaseProducts ?? []));
  target.favoriteShops.splice(0, target.favoriteShops.length, ...(baseline.favoriteShops ?? []));
  target.bindings.splice(0, target.bindings.length, ...baseline.bindings);
  target.events.splice(0, target.events.length, ...baseline.events);
  target.nextShopId = baseline.nextShopId;
  target.nextMenuPageId = baseline.nextMenuPageId;
  target.nextProductId = baseline.nextProductId;
  target.nextShowcaseProductId = baseline.nextShowcaseProductId ?? 1;
  target.nextFavoriteShopId = baseline.nextFavoriteShopId ?? 1;
  target.nextBindingId = baseline.nextBindingId;
};

const resetAdminAccessState = (target: AdminAccessRuntimeState): void => {
  const baseline = createAdminAccessRuntimeState();
  target.account = baseline.account;
  target.operatorAccounts.splice(0, target.operatorAccounts.length);
  target.sessions.splice(0, target.sessions.length);
  target.audits.splice(0, target.audits.length);
  target.operatorStaffLifecycleEvents.splice(0, target.operatorStaffLifecycleEvents.length);
  target.operatorStaffRatingAdjustments.splice(0, target.operatorStaffRatingAdjustments.length);
};

const resetCheckoutPaymentState = (target: CheckoutPaymentRuntimeState): void => {
  target.orders.splice(0, target.orders.length);
  target.users.splice(0, target.users.length);
  target.sessions.splice(0, target.sessions.length);
  target.replayGuards.splice(0, target.replayGuards.length);
  target.nextUserId = 1;
  target.nextSessionId = 1;
  target.nextOrderId = 1;
};

const ensureCatalogShowcase = (catalogState: CatalogRuntimeState): void => {
  catalogState.showcaseProducts.splice(
    0,
    catalogState.showcaseProducts.length,
    { id: "showcase-product-1", productId: "product-1", sortOrder: 1, isActive: true },
    { id: "showcase-product-2", productId: "product-3", sortOrder: 2, isActive: true },
  );
  catalogState.favoriteShops.splice(
    0,
    catalogState.favoriteShops.length,
    { id: "favorite-shop-1", shopId: "shop-1", sortOrder: 1, isActive: true },
    { id: "favorite-shop-2", shopId: "shop-2", sortOrder: 2, isActive: true },
  );
  catalogState.nextShowcaseProductId = 3;
  catalogState.nextFavoriteShopId = 3;
};

const ensureSellerBinding = (catalogState: CatalogRuntimeState): void => {
  catalogState.bindings.splice(0, catalogState.bindings.length, {
    id: "binding-seller-plov-shop-1",
    shopId: "shop-1",
    sellerId: "seller-runtime-1",
    telegramId: seedUsers.sellerPlov.telegramId,
  });
  catalogState.nextBindingId = 2;
};

const ensureUser = (
  checkoutPaymentState: CheckoutPaymentRuntimeState,
  user: CheckoutPaymentRuntimeState["users"][number],
): void => {
  if (!checkoutPaymentState.users.some((candidate) => candidate.id === user.id)) {
    checkoutPaymentState.users.push({ ...user });
  }
};

const seedOperatorOrders = (dependencies: StagingTestHarnessDependencies): void => {
  ensureUser(dependencies.checkoutPaymentState, seedUsers.clientAlina);
  ensureUser(dependencies.checkoutPaymentState, seedUsers.courier7);
  dependencies.checkoutPaymentState.orders.splice(
    0,
    dependencies.checkoutPaymentState.orders.length,
    {
      id: "test-order-created-1001",
      shopId: "shop-1",
      shopNameSnapshot: "Плов в парке Сомони",
      sellerId: "seller-runtime-1",
      clientId: seedUsers.clientAlina.id,
      courierId: null,
      status: "CREATED",
      itemsTotalMinor: 4500,
      deliveryFeeMinor: 0,
      totalAmountMinor: 4500,
      paymentProvider: "mock",
      paymentProviderTxId: "test-payment-created-1001",
      telegramPaymentChargeId: null,
      providerPaymentChargeId: null,
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      isDeleted: false,
    },
    {
      id: "test-order-delivered-2001",
      shopId: "shop-1",
      shopNameSnapshot: "Плов в парке Сомони",
      sellerId: "seller-runtime-1",
      clientId: seedUsers.clientAlina.id,
      courierId: seedUsers.courier7.id,
      status: "DELIVERED",
      itemsTotalMinor: 8300,
      deliveryFeeMinor: 0,
      totalAmountMinor: 8300,
      paymentProvider: "mock",
      paymentProviderTxId: "test-payment-delivered-2001",
      telegramPaymentChargeId: null,
      providerPaymentChargeId: null,
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      isDeleted: false,
    },
    {
      id: "test-order-cancellable-3001",
      shopId: "shop-1",
      shopNameSnapshot: "Плов в парке Сомони",
      sellerId: "seller-runtime-1",
      clientId: seedUsers.clientAlina.id,
      courierId: seedUsers.courier7.id,
      status: "IN_PROGRESS",
      itemsTotalMinor: 6100,
      deliveryFeeMinor: 0,
      totalAmountMinor: 6100,
      paymentProvider: "mock",
      paymentProviderTxId: "test-payment-cancellable-3001",
      telegramPaymentChargeId: null,
      providerPaymentChargeId: null,
      paymentStatus: "PAID",
      refundStatus: "NOT_REQUIRED",
      refundNote: null,
      isDeleted: false,
    },
  );
  dependencies.checkoutPaymentState.nextOrderId = 4;
};

const seedOperatorOrderStatusHistory = (dependencies: StagingTestHarnessDependencies): void => {
  dependencies.operationalRuntime.seedOrderStatusHistory([
    {
      orderId: "test-order-created-1001",
      createdAtOffsetMs: -8 * 60_000,
      updatedAtOffsetMs: -8 * 60_000,
      assignedAtOffsetMs: null,
      history: [
        {
          orderId: "test-order-created-1001",
          oldStatus: "CREATED",
          newStatus: "CREATED",
          changedByUserId: "staging-system",
          changedByRole: "system",
          changedByName: "Staging seed",
          changedAtOffsetMs: -8 * 60_000,
        },
      ],
    },
    {
      orderId: "test-order-delivered-2001",
      createdAtOffsetMs: -48 * 60_000,
      updatedAtOffsetMs: -8 * 60_000,
      assignedAtOffsetMs: -42 * 60_000,
      history: [
        {
          orderId: "test-order-delivered-2001",
          oldStatus: "CREATED",
          newStatus: "ASSIGNED",
          changedByUserId: seedUsers.courier7.id,
          changedByRole: "courier",
          changedByName: seedUsers.courier7.name,
          changedAtOffsetMs: -42 * 60_000,
        },
        {
          orderId: "test-order-delivered-2001",
          oldStatus: "ASSIGNED",
          newStatus: "PICKED_UP",
          changedByUserId: seedUsers.courier7.id,
          changedByRole: "courier",
          changedByName: seedUsers.courier7.name,
          changedAtOffsetMs: -35 * 60_000,
        },
        {
          orderId: "test-order-delivered-2001",
          oldStatus: "PICKED_UP",
          newStatus: "IN_PROGRESS",
          changedByUserId: seedUsers.courier7.id,
          changedByRole: "courier",
          changedByName: seedUsers.courier7.name,
          changedAtOffsetMs: -22 * 60_000,
        },
        {
          orderId: "test-order-delivered-2001",
          oldStatus: "IN_PROGRESS",
          newStatus: "DELIVERED",
          changedByUserId: seedUsers.courier7.id,
          changedByRole: "courier",
          changedByName: seedUsers.courier7.name,
          changedAtOffsetMs: -8 * 60_000,
        },
      ],
    },
    {
      orderId: "test-order-cancellable-3001",
      createdAtOffsetMs: -30 * 60_000,
      updatedAtOffsetMs: -10 * 60_000,
      assignedAtOffsetMs: -26 * 60_000,
      history: [
        {
          orderId: "test-order-cancellable-3001",
          oldStatus: "CREATED",
          newStatus: "ASSIGNED",
          changedByUserId: seedUsers.courier7.id,
          changedByRole: "courier",
          changedByName: seedUsers.courier7.name,
          changedAtOffsetMs: -26 * 60_000,
        },
        {
          orderId: "test-order-cancellable-3001",
          oldStatus: "ASSIGNED",
          newStatus: "PICKED_UP",
          changedByUserId: seedUsers.courier7.id,
          changedByRole: "courier",
          changedByName: seedUsers.courier7.name,
          changedAtOffsetMs: -18 * 60_000,
        },
        {
          orderId: "test-order-cancellable-3001",
          oldStatus: "PICKED_UP",
          newStatus: "IN_PROGRESS",
          changedByUserId: seedUsers.courier7.id,
          changedByRole: "courier",
          changedByName: seedUsers.courier7.name,
          changedAtOffsetMs: -10 * 60_000,
        },
      ],
    },
  ]);
};

const summarizeReset = (dependencies: StagingTestHarnessDependencies) => ({
  ok: true as const,
  scope: "all" as const,
  catalog: {
    shops: dependencies.catalogState.shops.length,
    products: dependencies.catalogState.products.length,
    bindings: dependencies.catalogState.bindings.length,
  },
  checkoutPayment: {
    users: dependencies.checkoutPaymentState.users.length,
    orders: dependencies.checkoutPaymentState.orders.length,
    sessions: dependencies.checkoutPaymentState.sessions.length,
  },
});

const summarizeSeed = (dependencies: StagingTestHarnessDependencies, scenario: string) => ({
  ok: true as const,
  scenario,
  catalog: {
    shops: dependencies.catalogState.shops.length,
    products: dependencies.catalogState.products.length,
    bindings: dependencies.catalogState.bindings.length,
    showcaseProducts: dependencies.catalogState.showcaseProducts.length,
    favoriteShops: dependencies.catalogState.favoriteShops.length,
  },
  checkoutPayment: {
    users: dependencies.checkoutPaymentState.users.length,
    orders: dependencies.checkoutPaymentState.orders.length,
    sessions: dependencies.checkoutPaymentState.sessions.length,
  },
  operational: {
    eventCursor: dependencies.operationalRuntime.getCurrentEventCursor(),
  },
});

export const createStagingTestHarness = (dependencies: StagingTestHarnessDependencies) => {
  const reset = (input: { scope?: string } = {}) => {
    const scope = input.scope ?? "all";

    if (scope !== "all") {
      throw new AppError("VALIDATION_ERROR", "Reset scope is invalid", 400, {
        scope,
        allowedScopes: "all",
        allowedScopeCount: 1,
      });
    }

    resetCatalogState(dependencies.catalogState);
    resetAdminAccessState(dependencies.adminAccessState);
    resetCheckoutPaymentState(dependencies.checkoutPaymentState);
    dependencies.operationalRuntime.resetRuntimeState();
    dependencies.operationalRuntime.saveRuntimeState?.();
    dependencies.saveCatalogState(dependencies.catalogState);
    dependencies.saveAdminAccessState(dependencies.adminAccessState);

    return summarizeReset(dependencies);
  };

  const seed = (input: { scenario: string }) => {
    const scenario = input.scenario;
    const allowedScenarios = [
      "baseline_catalog",
      "checkout_happy",
      "seller_owned_shop",
      "operator_orders",
      "delivery_happy_path",
    ];

    if (!allowedScenarios.includes(scenario)) {
      throw new AppError("VALIDATION_ERROR", "Seed scenario is invalid", 400, {
        scenario,
        allowedScenarios: formatAllowlist(allowedScenarios),
        allowedScenarioCount: allowedScenarios.length,
      });
    }

    reset();
    ensureCatalogShowcase(dependencies.catalogState);

    if (scenario === "baseline_catalog") {
      dependencies.saveCatalogState(dependencies.catalogState);
      return summarizeSeed(dependencies, scenario);
    }

    if (
      scenario === "checkout_happy" ||
      scenario === "seller_owned_shop" ||
      scenario === "operator_orders" ||
      scenario === "delivery_happy_path"
    ) {
      ensureSellerBinding(dependencies.catalogState);
      ensureUser(dependencies.checkoutPaymentState, seedUsers.sellerPlov);
    }

    if (scenario === "checkout_happy") {
      ensureUser(dependencies.checkoutPaymentState, seedUsers.clientAlina);
    }

    const seedsOperatorOrders = scenario === "operator_orders" || scenario === "delivery_happy_path";

    if (seedsOperatorOrders) {
      seedOperatorOrders(dependencies);
    }

    dependencies.operationalRuntime.resetRuntimeState();
    if (seedsOperatorOrders) {
      seedOperatorOrderStatusHistory(dependencies);
    }
    dependencies.operationalRuntime.saveRuntimeState?.();
    dependencies.saveCatalogState(dependencies.catalogState);
    dependencies.saveAdminAccessState(dependencies.adminAccessState);

    return summarizeSeed(dependencies, scenario);
  };

  return {
    reset,
    seed,
  };
};
