import { createServer, type IncomingHttpHeaders, type IncomingMessage, type Server } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { AppError } from "../shared/errors/app-error";
import { createAdminAccessModule } from "../slices/admin-access/presentation/admin-access.module";
import { createAdminAuthHttpHandler, resolveProtectedAdminRouteSession } from "../slices/admin-access/presentation/admin-auth-http";
import type { AdminAccessPrismaProvider } from "../slices/admin-access/infrastructure/prisma-admin-access.repository";
import { createCheckoutPaymentModule } from "../slices/checkout-payment/presentation/checkout-payment.module";
import type { CheckoutPaymentPrismaProvider } from "../slices/checkout-payment/infrastructure/prisma-checkout-payment.repository";
import { createCatalogModule } from "../slices/catalog/presentation/catalog.module";
import type {
  CatalogWriteResult,
  CatalogWriteEvent,
  CatalogRepository,
  CreateProvisionedShopInput,
  CreateSellerMenuPageInput,
  CreateSellerProductInput,
  CreateSellerShopBindingInput,
  ProvisionedSellerShop,
  ProvisionSellerShopInput,
  ProvisioningTemplateBlueprint,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  SellerShopBinding,
  ShopId,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../slices/catalog/domain/catalog.types";
import { createPrismaProvider, type EventRecord } from "../shared/db/prisma-client";
import type {
  CheckoutPaymentMiniAppSessionRecord,
  CheckoutPaymentOrderRecord,
  CheckoutPaymentReplayGuardRecord,
  CheckoutPaymentUserRecord,
} from "../slices/checkout-payment/domain/checkout-payment.types";
import { hashSessionToken } from "../slices/checkout-payment/domain/telegram-auth";

type AdminAccountRecord = {
  id: string;
  login: string;
  passwordHash: string;
  role: "BOSS" | "MANAGER" | "ADMIN";
  isActive: boolean;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AdminSessionRecord = {
  id: string;
  adminAccountId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  idleExpiresAt: Date;
  lastActivityAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AdminAuthAuditRecord = {
  id: bigint;
  adminAccountId: string;
  action: "LOGIN_SUCCESS" | "LOGIN_FAILED" | "LOCKED" | "LOGOUT";
  ipAddress: string | null;
  userAgent: string | null;
  traceId: string;
  reason: string | null;
  createdAt: Date;
};

type RuntimeJsonResponse = {
  status: number;
  headers: IncomingHttpHeaders;
  body: unknown;
  text: string;
};

export type RuntimeCookieSessionClient = {
  request: (input: {
    path: string;
    method?: string;
    origin?: string;
    referer?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }) => Promise<RuntimeJsonResponse>;
  fetch: (input: string, init?: RequestInit) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }>;
  readCookieValue: (name: string) => string | null;
  deleteCookie: (name: string) => void;
  setCookieValue: (name: string, value: string) => void;
};

type RuntimeServerOptions = {
  host?: string;
  port?: number;
  allowedOrigins?: string[];
  catalogDatabasePath?: string;
  passwordHasher?: {
    verify: (secret: string, secretHash: string) => Promise<boolean>;
  };
  now?: () => Date;
};

type CheckoutPaymentRuntimeSessionRecord = CheckoutPaymentMiniAppSessionRecord & {
  lastUsedAt: Date;
  createdAt: Date;
};

type CheckoutPaymentRuntimeState = {
  orders: CheckoutPaymentOrderRecord[];
  users: CheckoutPaymentUserRecord[];
  sessions: CheckoutPaymentRuntimeSessionRecord[];
  replayGuards: CheckoutPaymentReplayGuardRecord[];
  nextUserId: number;
  nextSessionId: number;
  nextOrderId: number;
};

type CatalogRuntimeState = {
  shops: SellerCatalogShop[];
  menuPages: SellerCatalogMenuPage[];
  products: SellerCatalogProduct[];
  bindings: SellerShopBinding[];
  events: CatalogWriteEvent[];
  nextShopId: number;
  nextMenuPageId: number;
  nextProductId: number;
  nextBindingId: number;
};

const cloneShop = (shop: SellerCatalogShop): SellerCatalogShop => ({ ...shop });
const cloneMenuPage = (page: SellerCatalogMenuPage): SellerCatalogMenuPage => ({ ...page });
const cloneProduct = (product: SellerCatalogProduct): SellerCatalogProduct => ({ ...product });
const cloneBinding = (binding: SellerShopBinding): SellerShopBinding => ({ ...binding });

const cloneCatalogState = (state: CatalogRuntimeState): CatalogRuntimeState => ({
  shops: state.shops.map(cloneShop),
  menuPages: state.menuPages.map(cloneMenuPage),
  products: state.products.map(cloneProduct),
  bindings: state.bindings.map(cloneBinding),
  events: state.events.map((event) => ({
    ...event,
    payload: { ...event.payload },
  })),
  nextShopId: state.nextShopId,
  nextMenuPageId: state.nextMenuPageId,
  nextProductId: state.nextProductId,
  nextBindingId: state.nextBindingId,
});

const catalogSeedBaselinePath = resolve(process.cwd(), "backend", "prisma", "seeds", "catalog-runtime-baseline.json");

let cachedCatalogSeedBaseline: CatalogRuntimeState | null = null;

const loadCatalogSeedBaseline = (): CatalogRuntimeState => {
  if (cachedCatalogSeedBaseline === null) {
    cachedCatalogSeedBaseline = JSON.parse(readFileSync(catalogSeedBaselinePath, "utf8")) as CatalogRuntimeState;
  }

  return cloneCatalogState(cachedCatalogSeedBaseline);
};

type CatalogStatePersistence = {
  databasePath: string;
  loadState: () => CatalogRuntimeState;
  saveState: (state: CatalogRuntimeState) => void;
  close: () => void;
  cleanup: () => void;
};

const createCatalogStatePersistence = (databasePath: string, cleanupDirectory: string | null): CatalogStatePersistence => {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new DatabaseSync(databasePath);
  database.exec(`
    CREATE TABLE IF NOT EXISTS catalog_runtime_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  const saveState = (state: CatalogRuntimeState): void => {
    database
      .prepare(
        `INSERT INTO catalog_runtime_state (id, payload, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
      )
      .run(JSON.stringify(state), new Date().toISOString());
  };

  const loadState = (): CatalogRuntimeState => {
    const row = database.prepare("SELECT payload FROM catalog_runtime_state WHERE id = 1").get() as { payload: string } | undefined;

    if (row === undefined) {
      const seededState = createCatalogRuntimeState();
      saveState(seededState);
      return seededState;
    }

    return JSON.parse(row.payload) as CatalogRuntimeState;
  };

  return {
    databasePath,
    loadState,
    saveState,
    close: () => {
      database.close();
    },
    cleanup: () => {
      if (cleanupDirectory !== null && existsSync(cleanupDirectory)) {
        rmSync(cleanupDirectory, { recursive: true, force: true });
      }
    },
  };
};

const resolveCatalogDatabasePersistence = (databasePath: string | undefined): CatalogStatePersistence => {
  if (databasePath !== undefined) {
    return createCatalogStatePersistence(databasePath, null);
  }

  const temporaryDirectory = mkdtempSync(join(tmpdir(), "khujandi-catalog-runtime-"));
  return createCatalogStatePersistence(join(temporaryDirectory, "catalog-runtime.sqlite"), temporaryDirectory);
};

const buildSellerStorefrontPayload = (
  shop: SellerCatalogShop,
  shopMenuPages: SellerCatalogMenuPage[],
  shopProducts: SellerCatalogProduct[],
) => {
  const shopMenuPageIds = new Set(shopMenuPages.map((page) => page.id));

  const menuPages = shopMenuPages
    .sort((left, right) => left.position - right.position)
    .map((page) => ({
      id: page.id,
      shopId: page.shopId,
      name: page.name,
      position: page.position,
      products: shopProducts
        .filter((product) => product.menuPageId === page.id)
        .map((product) => ({
          id: product.id,
          shopId: product.shopId,
          menuPageId: product.menuPageId,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          priceMinor: product.priceMinor,
        })),
    }));

  const unpagedProducts = shopProducts
    .filter((product) => product.menuPageId === null || !shopMenuPageIds.has(product.menuPageId))
    .map((product) => ({
      id: product.id,
      shopId: product.shopId,
      menuPageId: product.menuPageId,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceMinor: product.priceMinor,
    }));

  return {
    ...shop,
    menuPages,
    unpagedProducts,
  };
};

const createCatalogWriteEvent = (input: Omit<CatalogWriteEvent, "createdAt">): CatalogWriteEvent => ({
  ...input,
  createdAt: new Date().toISOString(),
});

export class InMemoryCatalogRepository implements CatalogRepository {
  constructor(private readonly state: CatalogRuntimeState) {}

  async listPublicShops() {
    return this.state.shops
      .filter((shop) => !shop.isDeleted && shop.status === "WORKING")
      .map((shop) => ({ id: shop.id, name: shop.name }));
  }

  async listPublicMenuPagesByShop(shopId: ShopId) {
    return this.state.menuPages
      .filter((page) => page.shopId === shopId && page.shopStatus === "WORKING")
      .sort((left, right) => left.position - right.position)
      .map((page) => ({
        id: page.id,
        shopId: page.shopId,
        name: page.name,
        position: page.position,
      }));
  }

  async listPublicProductsByShop(shopId: ShopId) {
    const shop = this.state.shops.find((candidate) => candidate.id === shopId);

    if (shop === undefined || shop.isDeleted || shop.status !== "WORKING") {
      return [];
    }

    return this.state.products
      .filter((product) => product.shopId === shopId && !product.isDeleted)
      .map((product) => ({
        id: product.id,
        shopId: product.shopId,
        menuPageId: product.menuPageId,
        name: product.name,
        priceMinor: product.priceMinor,
      }));
  }

  async listSellerBindingsByTelegramId(telegramId: string) {
    return this.state.bindings
      .filter((binding) => binding.telegramId === telegramId)
      .map(cloneBinding);
  }

  async listSellerMenuPagesByShop(shopId: ShopId) {
    return this.state.menuPages
      .filter((page) => page.shopId === shopId)
      .sort((left, right) => left.position - right.position)
      .map(cloneMenuPage);
  }

  async listSellerProductsByShop(shopId: ShopId) {
    return this.state.products
      .filter((product) => product.shopId === shopId && !product.isDeleted)
      .map(cloneProduct);
  }

  async findShopById(shopId: ShopId) {
    const shop = this.state.shops.find((candidate) => candidate.id === shopId) ?? null;
    return shop === null ? null : cloneShop(shop);
  }

  async createShop(input: CreateProvisionedShopInput) {
    if (this.state.shops.some((shop) => shop.sellerId === input.sellerId && shop.name === input.name)) {
      const error = new Error("Unique constraint failed");
      (error as Error & { code: string }).code = "P2002";
      throw error;
    }

    const shop: SellerCatalogShop = {
      id: `shop-runtime-${this.state.nextShopId++}`,
      sellerId: input.sellerId,
      name: input.name,
      description: input.description ?? null,
      headerImageUrl: input.headerImageUrl ?? null,
      backgroundImageUrl: input.backgroundImageUrl ?? null,
      status: input.status ?? "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    };
    this.state.shops.push(shop);
    return cloneShop(shop);
  }

  async updateShop(
    shopId: ShopId,
    input: UpdateSellerShopInput & Pick<SellerCatalogShop, "renameCount" | "requiresManualRenameReview">,
  ): Promise<CatalogWriteResult<SellerCatalogShop>> {
    const shop = this.state.shops.find((candidate) => candidate.id === shopId);

    if (shop === undefined) {
      throw new Error("Unknown shop id");
    }

    if (
      this.state.shops.some(
        (candidate) =>
          candidate.id !== shopId && candidate.sellerId === shop.sellerId && candidate.name === input.name,
      )
    ) {
      const error = new Error("Unique constraint failed");
      (error as Error & { code: string }).code = "P2002";
      throw error;
    }

    shop.name = input.name;
    if (input.description !== undefined) {
      shop.description = input.description;
    }

    if (input.headerImageUrl !== undefined) {
      shop.headerImageUrl = input.headerImageUrl;
    }

    if (input.backgroundImageUrl !== undefined) {
      shop.backgroundImageUrl = input.backgroundImageUrl;
    }

    if (input.status !== undefined) {
      shop.status = input.status;
    }

    shop.renameCount = input.renameCount;
    shop.requiresManualRenameReview = input.requiresManualRenameReview;
    const record = cloneShop(shop);
    const updatedAt = new Date().toISOString();
    const event = createCatalogWriteEvent({
      type: "catalog.shop.updated",
      entity: "shop",
      entityId: record.id,
      payload: {
        shopId: record.id,
        sellerId: record.sellerId,
        status: record.status,
        name: record.name,
        renameCount: record.renameCount,
        requiresManualRenameReview: record.requiresManualRenameReview,
        updatedAt,
      },
    });
    event.createdAt = updatedAt;
    this.state.events.push(event);

    return {
      record,
      event,
    };
  }

  async findMenuPageById(menuPageId: string) {
    const page = this.state.menuPages.find((candidate) => candidate.id === menuPageId) ?? null;
    return page === null ? null : cloneMenuPage(page);
  }

  async createMenuPage(input: CreateSellerMenuPageInput): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    const shop = this.state.shops.find((candidate) => candidate.id === input.shopId);

    if (shop === undefined) {
      throw new Error("Unknown shop id");
    }

    const page: SellerCatalogMenuPage = {
      id: `page-runtime-${this.state.nextMenuPageId++}`,
      shopId: input.shopId,
      name: input.name,
      position: input.position,
      sellerId: shop.sellerId,
      shopStatus: shop.status,
    };
    this.state.menuPages.push(page);
    const record = cloneMenuPage(page);
    const createdAt = new Date().toISOString();
    const event = createCatalogWriteEvent({
      type: "catalog.menu_page.created",
      entity: "menu_page",
      entityId: record.id,
      payload: {
        menuPageId: record.id,
        shopId: record.shopId,
        sellerId: record.sellerId,
        position: record.position,
        name: record.name,
        createdAt,
      },
    });
    event.createdAt = createdAt;
    this.state.events.push(event);

    return {
      record,
      event,
    };
  }

  async updateMenuPage(
    menuPageId: string,
    input: { shopId: ShopId; name: string },
  ): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    const page = this.state.menuPages.find((candidate) => candidate.id === menuPageId);

    if (page === undefined) {
      throw new Error("Unknown menu page id");
    }

    page.shopId = input.shopId;
    page.name = input.name;
    const record = cloneMenuPage(page);
    const updatedAt = new Date().toISOString();
    const event = createCatalogWriteEvent({
      type: "catalog.menu_page.updated",
      entity: "menu_page",
      entityId: record.id,
      payload: {
        menuPageId: record.id,
        shopId: record.shopId,
        sellerId: record.sellerId,
        position: record.position,
        name: record.name,
        updatedAt,
      },
    });
    event.createdAt = updatedAt;
    this.state.events.push(event);

    return {
      record,
      event,
    };
  }

  async findProductById(productId: string) {
    const product = this.state.products.find((candidate) => candidate.id === productId) ?? null;
    return product === null ? null : cloneProduct(product);
  }

  async createSellerShopBinding(input: CreateSellerShopBindingInput) {
    if (this.state.bindings.some((binding) => binding.shopId === input.shopId)) {
      throw new AppError("SHOP_PROVISIONING_CONFLICT", "Shop already has a seller binding", 409);
    }

    const binding: SellerShopBinding = {
      id: `binding-runtime-${this.state.nextBindingId++}`,
      shopId: input.shopId,
      sellerId: input.sellerId,
      telegramId: input.telegramId,
    };
    this.state.bindings.push(binding);
    return cloneBinding(binding);
  }

  async provisionSellerShop(input: ProvisionSellerShopInput & { blueprint: ProvisioningTemplateBlueprint }): Promise<ProvisionedSellerShop> {
    const duplicateShop = this.state.bindings.some((binding) => {
      if (binding.sellerId !== input.sellerId || binding.telegramId !== input.telegramId) {
        return false;
      }

      const shop = this.state.shops.find((candidate) => candidate.id === binding.shopId);
      return shop?.name === input.name;
    });

    if (duplicateShop) {
      throw new AppError(
        "SHOP_PROVISIONING_CONFLICT",
        "Shop provisioning conflicts with an existing seller binding or shop record",
        409,
      );
    }

    const draftState = cloneCatalogState(this.state);
    const draftRepository = new InMemoryCatalogRepository(draftState);
    const shop = await draftRepository.createShop({
      sellerId: input.sellerId,
      name: input.name,
      description: input.description,
      headerImageUrl: input.headerImageUrl,
      backgroundImageUrl: input.backgroundImageUrl,
      status: input.status ?? input.blueprint.shopStatus,
    });
    const binding = await draftRepository.createSellerShopBinding({
      shopId: shop.id,
      sellerId: shop.sellerId,
      telegramId: input.telegramId,
    });

    const menuPages: SellerCatalogMenuPage[] = [];
    const menuPageIdsByName = new Map<string, string>();

    for (const page of input.blueprint.menuPages) {
      const createdPage = await draftRepository.createMenuPage({
        shopId: shop.id,
        name: page.name,
        position: page.position,
      });
      menuPages.push(createdPage.record);
      menuPageIdsByName.set(page.name, createdPage.record.id);
    }

    const products: SellerCatalogProduct[] = [];

    for (const product of input.blueprint.products) {
      const createdProduct = await draftRepository.createProduct({
        shopId: shop.id,
        menuPageId: menuPageIdsByName.get(product.pageName) ?? null,
        name: product.name,
        description: product.description,
        priceMinor: product.priceMinor,
      });
      products.push(createdProduct.record);
    }

    Object.assign(this.state, draftState);

    return {
      shop,
      binding,
      menuPages,
      products,
    };
  }

  async createProduct(input: CreateSellerProductInput): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    const shop = this.state.shops.find((candidate) => candidate.id === input.shopId);

    if (shop === undefined) {
      throw new Error("Unknown shop id");
    }

    const product: SellerCatalogProduct = {
      id: `product-runtime-${this.state.nextProductId++}`,
      shopId: input.shopId,
      menuPageId: input.menuPageId ?? null,
      name: input.name,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      priceMinor: input.priceMinor,
      isDeleted: false,
      sellerId: shop.sellerId,
    };
    this.state.products.push(product);
    const record = cloneProduct(product);
    const createdAt = new Date().toISOString();
    const event = createCatalogWriteEvent({
      type: "catalog.product.created",
      entity: "product",
      entityId: record.id,
      payload: {
        productId: record.id,
        shopId: record.shopId,
        menuPageId: record.menuPageId,
        sellerId: record.sellerId,
        name: record.name,
        priceMinor: record.priceMinor,
        createdAt,
      },
    });
    event.createdAt = createdAt;
    this.state.events.push(event);

    return {
      record,
      event,
    };
  }

  async updateProduct(productId: string, input: UpdateSellerProductInput): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    const product = this.state.products.find((candidate) => candidate.id === productId);

    if (product === undefined) {
      throw new Error("Unknown product id");
    }

    product.shopId = input.shopId;
    product.menuPageId = input.menuPageId ?? null;
    product.name = input.name;
    product.description = input.description ?? null;
    product.imageUrl = input.imageUrl ?? null;
    product.priceMinor = input.priceMinor;
    const record = cloneProduct(product);
    const updatedAt = new Date().toISOString();
    const event = createCatalogWriteEvent({
      type: "catalog.product.updated",
      entity: "product",
      entityId: record.id,
      payload: {
        productId: record.id,
        shopId: record.shopId,
        menuPageId: record.menuPageId,
        sellerId: record.sellerId,
        name: record.name,
        priceMinor: record.priceMinor,
        updatedAt,
      },
    });
    event.createdAt = updatedAt;
    this.state.events.push(event);

    return {
      record,
      event,
    };
  }
}

export const createCatalogRuntimeState = (): CatalogRuntimeState => ({
  ...loadCatalogSeedBaseline(),
});

const createInMemoryCatalogPrisma = (
  state: CatalogRuntimeState,
  options: {
    persist?: (state: CatalogRuntimeState) => void;
  } = {},
) => {
  const persistCommittedState = (target: CatalogRuntimeState) => {
    if (target === state) {
      options.persist?.(state);
    }
  };

  const createEventRecord = (target: CatalogRuntimeState, input: {
    type: string;
    entity: string;
    entityId: string;
    payload: Record<string, unknown>;
  }): EventRecord => {
    const createdAt = new Date();
    const eventRecord: EventRecord = {
      id: BigInt(target.events.length + 1),
      type: input.type,
      entity: input.entity,
      entityId: input.entityId,
      payload: { ...input.payload },
      createdAt,
    };

    target.events.push({
      type: eventRecord.type,
      entity: eventRecord.entity as CatalogWriteEvent["entity"],
      entityId: eventRecord.entityId,
      payload: { ...input.payload },
      createdAt: createdAt.toISOString(),
    });

    return eventRecord;
  };

  const createClient = (target: CatalogRuntimeState) => ({
    shop: {
      findMany: async ({ where }: { where: { isDeleted: boolean; status?: "WORKING" | "NOT_WORKING" } }) =>
        target.shops
          .filter((shop) => shop.isDeleted === where.isDeleted)
          .filter((shop) => where.status === undefined || shop.status === where.status)
          .map((shop) => ({ id: shop.id, name: shop.name })),
      findUnique: async ({ where }: { where: { id: string } }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.id) ?? null;
        return shop === null ? null : { ...shop };
      },
      create: async ({ data }: { data: { sellerId: string; name: string; description?: string | null; headerImageUrl?: string | null; backgroundImageUrl?: string | null; status: "WORKING" | "NOT_WORKING" } }) => {
        if (target.shops.some((shop) => shop.sellerId === data.sellerId && shop.name === data.name)) {
          const error = new Error("Unique constraint failed");
          Object.assign(error, { code: "P2002" });
          throw error;
        }

        const shop: SellerCatalogShop = {
          id: `shop-runtime-${target.nextShopId++}`,
          sellerId: data.sellerId,
          name: data.name,
          description: data.description ?? null,
          headerImageUrl: data.headerImageUrl ?? null,
          backgroundImageUrl: data.backgroundImageUrl ?? null,
          status: data.status,
          renameCount: 0,
          requiresManualRenameReview: false,
          isDeleted: false,
        };
        target.shops.push(shop);
        persistCommittedState(target);
        return { ...shop };
      },
      update: async ({ where, data }: { where: { id: string }; data: { name: string; description?: string | null; headerImageUrl?: string | null; backgroundImageUrl?: string | null; status?: "WORKING" | "NOT_WORKING"; renameCount: number; requiresManualRenameReview: boolean } }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.id);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        if (
          target.shops.some(
            (candidate) =>
              candidate.id !== where.id && candidate.sellerId === shop.sellerId && candidate.name === data.name,
          )
        ) {
          const error = new Error("Unique constraint failed");
          Object.assign(error, { code: "P2002" });
          throw error;
        }

        shop.name = data.name;
        if (data.description !== undefined) {
          shop.description = data.description;
        }
        if (data.headerImageUrl !== undefined) {
          shop.headerImageUrl = data.headerImageUrl;
        }
        if (data.backgroundImageUrl !== undefined) {
          shop.backgroundImageUrl = data.backgroundImageUrl;
        }
        shop.status = data.status ?? shop.status;
        shop.renameCount = data.renameCount;
        shop.requiresManualRenameReview = data.requiresManualRenameReview;
        persistCommittedState(target);

        return {
          ...shop,
          updatedAt: new Date(),
        };
      },
    },
    menuPage: {
      findMany: async ({
        where,
        select,
      }: {
        where: { shopId: string; shop: { isDeleted: boolean; status?: "WORKING" | "NOT_WORKING" } };
        select?: { shop?: { select: { sellerId: boolean; isDeleted?: boolean; status?: boolean } } };
      }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.shopId);

        if (
          shop === undefined ||
          shop.isDeleted !== where.shop.isDeleted ||
          (where.shop.status !== undefined && shop.status !== where.shop.status)
        ) {
          return [];
        }

        return target.menuPages
          .filter((page) => page.shopId === where.shopId)
          .sort((left, right) => left.position - right.position)
          .map((page) => {
            if (select?.shop !== undefined) {
              return {
                id: page.id,
                shopId: page.shopId,
                name: page.name,
                position: page.position,
                shop: {
                  sellerId: shop.sellerId,
                  isDeleted: shop.isDeleted,
                  status: shop.status,
                },
              };
            }

            return {
              id: page.id,
              shopId: page.shopId,
              name: page.name,
              position: page.position,
            };
          });
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const page = target.menuPages.find((candidate) => candidate.id === where.id) ?? null;

        if (page === null) {
          return null;
        }

        const shop = target.shops.find((candidate) => candidate.id === page.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        return {
          ...page,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
            status: shop.status,
          },
        };
      },
      create: async ({ data }: { data: { shopId: string; name: string; position: number } }) => {
        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        const page: SellerCatalogMenuPage = {
          id: `menu-page-runtime-${target.nextMenuPageId++}`,
          shopId: data.shopId,
          name: data.name,
          position: data.position,
          sellerId: shop.sellerId,
          shopStatus: shop.status,
        };
        target.menuPages.push(page);
        persistCommittedState(target);

        return {
          id: page.id,
          shopId: page.shopId,
          name: page.name,
          position: page.position,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
            status: shop.status,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: { shopId: string; name: string } }) => {
        const page = target.menuPages.find((candidate) => candidate.id === where.id);

        if (page === undefined) {
          throw new Error("Unknown menu page id");
        }

        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        page.shopId = data.shopId;
        page.name = data.name;
        page.sellerId = shop.sellerId;
        page.shopStatus = shop.status;
        persistCommittedState(target);

        return {
          id: page.id,
          shopId: page.shopId,
          name: page.name,
          position: page.position,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
            status: shop.status,
          },
          updatedAt: new Date(),
        };
      },
    },
    product: {
      findMany: async ({
        where,
        select,
      }: {
        where: { shopId: string; isDeleted: boolean; shop: { isDeleted: boolean; status?: "WORKING" | "NOT_WORKING" } };
        select?: { shop?: { select: { sellerId: boolean; isDeleted?: boolean } } };
      }) => {
        const shop = target.shops.find((candidate) => candidate.id === where.shopId);

        if (
          shop === undefined ||
          shop.isDeleted !== where.shop.isDeleted ||
          (where.shop.status !== undefined && shop.status !== where.shop.status)
        ) {
          return [];
        }

        return target.products
          .filter((product) => product.shopId === where.shopId && product.isDeleted === where.isDeleted)
          .map((product) => {
            if (select?.shop !== undefined) {
              return {
                id: product.id,
                shopId: product.shopId,
                menuPageId: product.menuPageId,
                name: product.name,
                description: product.description,
                imageUrl: product.imageUrl,
                priceMinor: product.priceMinor,
                isDeleted: product.isDeleted,
                shop: {
                  sellerId: shop.sellerId,
                  isDeleted: shop.isDeleted,
                },
              };
            }

            return {
              id: product.id,
              shopId: product.shopId,
              menuPageId: product.menuPageId,
              name: product.name,
              priceMinor: product.priceMinor,
            };
          });
      },
      findUnique: async ({ where }: { where: { id: string } }) => {
        const product = target.products.find((candidate) => candidate.id === where.id) ?? null;

        if (product === null) {
          return null;
        }

        const shop = target.shops.find((candidate) => candidate.id === product.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        return {
          ...product,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
          },
        };
      },
      create: async ({ data }: { data: { shopId: string; menuPageId?: string | null; name: string; description?: string | null; imageUrl?: string | null; priceMinor: number } }) => {
        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        const product: SellerCatalogProduct = {
          id: `product-runtime-${target.nextProductId++}`,
          shopId: data.shopId,
          menuPageId: data.menuPageId ?? null,
          name: data.name,
          description: data.description ?? null,
          imageUrl: data.imageUrl ?? null,
          priceMinor: data.priceMinor,
          isDeleted: false,
          sellerId: shop.sellerId,
        };
        target.products.push(product);
        persistCommittedState(target);

        return {
          ...product,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
      update: async ({ where, data }: { where: { id: string }; data: { shopId: string; menuPageId?: string | null; name: string; description?: string | null; imageUrl?: string | null; priceMinor: number } }) => {
        const product = target.products.find((candidate) => candidate.id === where.id);

        if (product === undefined) {
          throw new Error("Unknown product id");
        }

        const shop = target.shops.find((candidate) => candidate.id === data.shopId);

        if (shop === undefined) {
          throw new Error("Unknown shop id");
        }

        product.shopId = data.shopId;
        product.menuPageId = data.menuPageId ?? null;
        product.name = data.name;
        product.description = data.description ?? null;
        product.imageUrl = data.imageUrl ?? null;
        product.priceMinor = data.priceMinor;
        product.sellerId = shop.sellerId;
        persistCommittedState(target);

        return {
          ...product,
          shop: {
            sellerId: shop.sellerId,
            isDeleted: shop.isDeleted,
          },
          updatedAt: new Date(),
        };
      },
    },
    sellerShopBinding: {
      findMany: async ({ where }: { where: { telegramId: string } }) =>
        target.bindings
          .filter((binding) => binding.telegramId === where.telegramId)
          .map((binding) => ({ ...binding })),
      create: async ({ data }: { data: { shopId: string; sellerId: string; telegramId: string } }) => {
        if (target.bindings.some((binding) => binding.sellerId === data.sellerId || binding.telegramId === data.telegramId)) {
          const error = new Error("duplicate binding");
          Object.assign(error, { code: "P2002" });
          throw error;
        }

        const binding: SellerShopBinding = {
          id: `binding-runtime-${target.nextBindingId++}`,
          shopId: data.shopId,
          sellerId: data.sellerId,
          telegramId: data.telegramId,
        };
        target.bindings.push(binding);
        persistCommittedState(target);
        return { ...binding };
      },
    },
    event: {
      create: async ({ data }: { data: { type: string; entity: string; entityId: string; payload: Record<string, unknown> } }) => {
        const event = createEventRecord(target, data);
        persistCommittedState(target);
        return event;
      },
    },
  });

  const client = createClient(state) as ReturnType<typeof createClient> & {
    $transaction<T>(callback: (transactionClient: ReturnType<typeof createClient>) => Promise<T>): Promise<T>;
  };

  client.$transaction = async (callback) => {
    const draftState = cloneCatalogState(state);
    const result = await callback(createClient(draftState));
    Object.assign(state, draftState);
    options.persist?.(state);
    return result;
  };

  return createPrismaProvider(client as never);
};

const createCheckoutPaymentRuntimeState = (): CheckoutPaymentRuntimeState => ({
  orders: [],
  users: [],
  sessions: [],
  replayGuards: [],
  nextUserId: 1,
  nextSessionId: 1,
  nextOrderId: 1,
});

const cloneDate = (value: Date | null): Date | null => (value === null ? null : new Date(value));

const toAccountRecord = (account: AdminAccountRecord) => ({
  ...account,
  lockedUntil: cloneDate(account.lockedUntil),
  createdAt: new Date(account.createdAt),
  updatedAt: new Date(account.updatedAt),
});

const toSessionRecord = (session: AdminSessionRecord) => ({
  ...session,
  accessTokenExpiresAt: new Date(session.accessTokenExpiresAt),
  refreshTokenExpiresAt: new Date(session.refreshTokenExpiresAt),
  idleExpiresAt: new Date(session.idleExpiresAt),
  lastActivityAt: new Date(session.lastActivityAt),
  revokedAt: cloneDate(session.revokedAt),
  createdAt: new Date(session.createdAt),
  updatedAt: new Date(session.updatedAt),
});

const createInMemoryAdminAccessPrisma = (): AdminAccessPrismaProvider & {
  state: {
    account: AdminAccountRecord;
    sessions: AdminSessionRecord[];
    audits: AdminAuthAuditRecord[];
  };
} => {
  const state: {
    account: AdminAccountRecord;
    sessions: AdminSessionRecord[];
    audits: AdminAuthAuditRecord[];
  } = {
    account: {
      id: "admin-account-1",
      login: "boss@example.com",
      passwordHash: "stored-hash",
      role: "BOSS" as const,
      isActive: true,
      lockedUntil: null,
      createdAt: new Date("2026-04-06T08:00:00.000Z"),
      updatedAt: new Date("2026-04-06T08:00:00.000Z"),
    },
    sessions: [] as AdminSessionRecord[],
    audits: [] as AdminAuthAuditRecord[],
  };

  return {
    state,
    client: {
      adminAccount: {
        findUnique: async ({ where }) => {
          if (where.login !== undefined && where.login === state.account.login) {
            return toAccountRecord(state.account);
          }

          if (where.id !== undefined && where.id === state.account.id) {
            return toAccountRecord(state.account);
          }

          return null;
        },
        update: async ({ where, data }) => {
          if (where.id !== state.account.id) {
            throw new Error("Unknown account id");
          }

          const lockedUntil = new Date(data.lockedUntil);
          state.account = {
            ...state.account,
            lockedUntil,
            updatedAt: lockedUntil,
          };

          return toAccountRecord(state.account);
        },
      },
      adminSession: {
        create: async ({ data }) => {
          const createdAt = new Date(data.lastActivityAt);
          const session: AdminSessionRecord = {
            id: `session-${state.sessions.length + 1}`,
            adminAccountId: data.adminAccountId,
            accessTokenHash: data.accessTokenHash,
            refreshTokenHash: data.refreshTokenHash,
            accessTokenExpiresAt: new Date(data.accessTokenExpiresAt),
            refreshTokenExpiresAt: new Date(data.refreshTokenExpiresAt),
            idleExpiresAt: new Date(data.idleExpiresAt),
            lastActivityAt: new Date(data.lastActivityAt),
            revokedAt: null,
            createdAt,
            updatedAt: createdAt,
          };
          state.sessions.push(session);
          return toSessionRecord(session);
        },
        findUnique: async ({ where }) => {
          const session = state.sessions.find((candidate) => candidate.refreshTokenHash === where.refreshTokenHash) ?? null;
          return session === null ? null : toSessionRecord(session);
        },
        update: async ({ where, data }) => {
          const session = state.sessions.find((candidate) => candidate.id === where.id);

          if (session === undefined) {
            throw new Error("Unknown session id");
          }

          if (data.refreshTokenHash !== undefined) {
            session.refreshTokenHash = data.refreshTokenHash;
          }
          if (data.accessTokenHash !== undefined) {
            session.accessTokenHash = data.accessTokenHash;
          }
          if (data.accessTokenExpiresAt !== undefined) {
            session.accessTokenExpiresAt = new Date(data.accessTokenExpiresAt);
          }
          if (data.refreshTokenExpiresAt !== undefined) {
            session.refreshTokenExpiresAt = new Date(data.refreshTokenExpiresAt);
          }
          if (data.idleExpiresAt !== undefined) {
            session.idleExpiresAt = new Date(data.idleExpiresAt);
          }
          if (data.lastActivityAt !== undefined) {
            session.lastActivityAt = new Date(data.lastActivityAt);
          }
          if (data.revokedAt !== undefined) {
            session.revokedAt = new Date(data.revokedAt);
          }
          session.updatedAt = new Date(session.lastActivityAt);

          return toSessionRecord(session);
        },
        updateMany: async ({ where, data }) => {
          let count = 0;

          state.sessions.forEach((session) => {
            if (session.adminAccountId === where.adminAccountId && session.revokedAt === where.revokedAt) {
              session.revokedAt = new Date(data.revokedAt);
              session.updatedAt = new Date(data.revokedAt);
              count += 1;
            }
          });

          return { count };
        },
      },
      adminAuthAudit: {
        create: async ({ data }) => {
          const record: AdminAuthAuditRecord = {
            id: BigInt(state.audits.length + 1),
            adminAccountId: data.adminAccountId,
            action: data.action,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            traceId: data.traceId,
            reason: data.reason,
            createdAt: new Date(data.createdAt),
          };
          state.audits.push(record);
          return { ...record };
        },
        count: async ({ where }) =>
          state.audits.filter(
            (audit) =>
              audit.adminAccountId === where.adminAccountId &&
              audit.action === where.action &&
              audit.createdAt.getTime() >= where.createdAt.gte.getTime(),
          ).length,
      },
    },
  };
};

const json = (
  statusCode: number,
  payload: unknown,
  methods = "GET,POST,OPTIONS",
): { statusCode: number; headers: Record<string, string | string[]>; body: string } => ({
  statusCode,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": methods,
    "access-control-allow-headers": "content-type",
  },
  body: JSON.stringify(payload),
});

const notFound = () => json(404, { error: { code: "NOT_FOUND", message: "Route not found." } });

const readSingleHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  if (cookieHeader === undefined || cookieHeader.trim().length === 0) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((accumulator, chunk) => {
    const [rawName, ...rawValueParts] = chunk.trim().split("=");

    if (rawName.length === 0) {
      return accumulator;
    }

    accumulator[rawName] = decodeURIComponent(rawValueParts.join("="));
    return accumulator;
  }, {});
};

const serializeCookie = (input: {
  name: string;
  value: string;
  path: string;
  maxAgeSeconds: number;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
}): string => {
  const parts = [`${input.name}=${encodeURIComponent(input.value)}`, `Path=${input.path}`, `Max-Age=${input.maxAgeSeconds}`, `SameSite=${input.sameSite}`];

  if (input.httpOnly) {
    parts.push("HttpOnly");
  }

  if (input.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const readJsonBody = async (request: IncomingMessage): Promise<Record<string, unknown>> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();

  if (rawBody.length === 0) {
    return {};
  }

  const parsed = JSON.parse(rawBody) as unknown;

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new AppError("VALIDATION_ERROR", "Request body must be a valid JSON object", 400);
  }

  return parsed as Record<string, unknown>;
};

const resolveAdminProvisioningSession = async (
  request: IncomingMessage,
  dependencies: {
    prisma: AdminAccessPrismaProvider;
    allowedOrigins: string[];
    now?: () => Date;
  },
): Promise<void> => {
  const session = await resolveProtectedAdminRouteSession(request, {
    prisma: dependencies.prisma,
    allowedOrigins: dependencies.allowedOrigins,
    authRequiredMessage: "Provisioning requires an authenticated admin",
    now: dependencies.now,
  });

  if (session.role !== "admin" && session.role !== "boss") {
    throw new AppError("FORBIDDEN", "User role cannot provision seller shops", 403, {
      role: session.role,
    });
  }
};

const createInMemoryCheckoutPaymentPrisma = (): CheckoutPaymentPrismaProvider & {
  state: CheckoutPaymentRuntimeState;
} => {
  const state = createCheckoutPaymentRuntimeState();

  const client: CheckoutPaymentPrismaProvider["client"] = {
    order: {
      findUnique: async ({ where }) =>
        state.orders.find((candidate) => candidate.paymentProviderTxId === where.paymentProviderTxId) ?? null,
      create: async ({ data }) => {
        const order: CheckoutPaymentOrderRecord = {
          id: `order-runtime-${state.nextOrderId++}`,
          ...data,
        };
        state.orders.push(order);
        return { ...order };
      },
    },
    user: {
      upsert: async ({ where, update, create }) => {
        const existingUser = state.users.find((candidate) => candidate.telegramId === where.telegramId);

        if (existingUser !== undefined) {
          existingUser.name = update.name;
          existingUser.username = update.username;
          existingUser.language = update.language;
          existingUser.isActive = update.isActive;
          return { ...existingUser };
        }

        const user: CheckoutPaymentUserRecord = {
          id: `mini-app-user-${state.nextUserId++}`,
          telegramId: create.telegramId,
          role: "client",
          name: create.name,
          username: create.username,
          language: create.language,
          isActive: create.isActive,
        };
        state.users.push(user);
        return { ...user };
      },
      update: async ({ where, data }) => {
        const user = state.users.find((candidate) => candidate.telegramId === where.telegramId);

        if (user === undefined) {
          throw new Error("unknown telegram user");
        }

        user.language = data.language;
        return { ...user };
      },
    },
    telegramAuthReplay: {
      findUnique: async ({ where }) =>
        state.replayGuards.find((candidate) => candidate.initDataHash === where.initDataHash) ?? null,
      create: async ({ data }) => {
        if (state.replayGuards.some((candidate) => candidate.initDataHash === data.initDataHash)) {
          const error = new Error("Unique constraint failed");
          (error as Error & { code: string }).code = "P2002";
          throw error;
        }

        const replay = {
          initDataHash: data.initDataHash,
          expiresAt: new Date(data.expiresAt),
        };
        state.replayGuards.push(replay);
        return replay;
      },
    },
    miniAppSession: {
      create: async ({ data }) => {
        const session: CheckoutPaymentRuntimeSessionRecord = {
          id: `mini-app-session-${state.nextSessionId++}`,
          userId: data.userId,
          sessionTokenHash: data.sessionTokenHash,
          expiresAt: new Date(data.expiresAt),
          revokedAt: null,
          lastUsedAt: new Date(),
          createdAt: new Date(),
        };
        state.sessions.push(session);
        return {
          id: session.id,
          userId: session.userId,
          sessionTokenHash: session.sessionTokenHash,
          expiresAt: new Date(session.expiresAt),
          revokedAt: session.revokedAt,
        };
      },
    },
    $transaction: async (callback) => callback(client),
  };

  return {
    state,
    client,
  };
};

const resolveMiniAppAuthenticatedUser = async (
  request: IncomingMessage,
  dependencies: {
    state: CheckoutPaymentRuntimeState;
    now?: () => Date;
  },
): Promise<CheckoutPaymentUserRecord> => {
  const cookies = parseCookies(readSingleHeader(request.headers.cookie));
  const sessionToken = cookies.khujandi_mini_app_session ?? "";

  if (sessionToken.length === 0) {
    throw new AppError("AUTH_REQUIRED", "Seller access requires an authenticated Telegram session", 401);
  }

  const now = dependencies.now?.() ?? new Date();
  const sessionTokenHash = hashSessionToken(sessionToken);
  const session = dependencies.state.sessions.find(
    (candidate) =>
      candidate.sessionTokenHash === sessionTokenHash &&
      candidate.revokedAt === null &&
      candidate.expiresAt.getTime() > now.getTime(),
  );

  if (session === undefined) {
    throw new AppError("AUTH_REQUIRED", "Seller access requires an authenticated Telegram session", 401);
  }

  const user = dependencies.state.users.find((candidate) => candidate.id === session.userId && candidate.isActive);

  if (user === undefined) {
    throw new AppError("AUTH_REQUIRED", "Seller access requires an authenticated Telegram session", 401);
  }

  session.lastUsedAt = now;
  return { ...user };
};

const updateCookieJar = (jar: Map<string, string>, setCookieHeader: string | string[] | undefined): void => {
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader === undefined ? [] : [setCookieHeader];

  cookies.forEach((cookie) => {
    const [pair] = cookie.split(";", 1);
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex <= 0) {
      return;
    }

    const name = pair.slice(0, separatorIndex);
    const value = decodeURIComponent(pair.slice(separatorIndex + 1));

    if (value.length === 0) {
      jar.delete(name);
      return;
    }

    jar.set(name, value);
  });
};

const buildCookieHeader = (jar: Map<string, string>): string | undefined => {
  if (jar.size === 0) {
    return undefined;
  }

  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");
};

const toRuntimeResponseBody = (text: string): unknown => {
  if (text.length === 0) {
    return null;
  }

  return JSON.parse(text) as unknown;
};

export const createRuntimeCookieSessionClient = (baseUrl: string): RuntimeCookieSessionClient => {
  const jar = new Map<string, string>();
  const request: RuntimeCookieSessionClient["request"] = async ({
    path,
    method = "POST",
    origin,
    referer,
    body,
    headers = {},
  }) => {
    const url = new URL(path, baseUrl);
    const requestHeaders: Record<string, string> = { ...headers };
    const cookieHeader = buildCookieHeader(jar);

    if (cookieHeader !== undefined) {
      requestHeaders.cookie = cookieHeader;
    }

    if (origin !== undefined) {
      requestHeaders.origin = origin;
    }

    if (referer !== undefined) {
      requestHeaders.referer = referer;
    }

    let serializedBody: string | undefined;

    if (body !== undefined) {
      serializedBody = JSON.stringify(body);
      requestHeaders["content-type"] = requestHeaders["content-type"] ?? "application/json";
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: serializedBody,
    });
    const text = await response.text();
    const setCookieHeader =
      typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : response.headers.get("set-cookie");
    const setCookie =
      setCookieHeader === null || setCookieHeader === undefined
        ? undefined
        : Array.isArray(setCookieHeader)
          ? setCookieHeader
          : [setCookieHeader];

    updateCookieJar(jar, setCookie);

    return {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "set-cookie": setCookie,
      },
      body: toRuntimeResponseBody(text),
      text,
    };
  };

  return {
    request,
    fetch: async (input, init) => {
      const response = await request({
        path: input,
        method: init?.method ?? "GET",
        headers: Object.fromEntries(Object.entries(init?.headers ?? {}).map(([key, value]) => [key, String(value)])),
        body: typeof init?.body === "string" && init.body.length > 0 ? JSON.parse(init.body) : undefined,
      });

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.body,
      };
    },
    readCookieValue: (name) => jar.get(name) ?? null,
    deleteCookie: (name) => {
      jar.delete(name);
    },
    setCookieValue: (name, value) => {
      jar.set(name, value);
    },
  };
};

export const startDevApiServer = async (options: RuntimeServerOptions = {}) => {
  const host = options.host ?? "127.0.0.1";
  const port = options.port ?? 3001;
  const allowedOrigins = options.allowedOrigins ?? ["https://admin.example", "http://127.0.0.1:5173", "http://localhost:5173"];
  const prisma = createInMemoryAdminAccessPrisma();
  const checkoutPaymentPrisma = createInMemoryCheckoutPaymentPrisma();
  const module = createAdminAccessModule(prisma);
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
    botToken: "test-bot-token",
    allowedOrigins,
    secureCookies: false,
    now: options.now,
  });
  const adminAuthHandler = createAdminAuthHttpHandler({
    controller: module.controller,
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
      catalogPersistence.close();
      catalogPersistence.cleanup();
    },
  };
};
