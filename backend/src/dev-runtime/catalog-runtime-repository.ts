import { AppError } from "../shared/errors/app-error";
import type {
  AdminProvisionedShopSummary,
  CatalogFavoriteShopReference,
  CatalogShowcaseProductReference,
  CatalogWriteResult,
  CatalogWriteEvent,
  CatalogRepository,
  CreateProvisionedShopInput,
  CreateSellerMenuPageInput,
  CreateSellerProductInput,
  CreateSellerShopBindingInput,
  PersistProvisionSellerShopInput,
  ProvisionedSellerShop,
  ProvisioningTemplateBlueprint,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  SellerShopBinding,
  ShopId,
  StartShowcase,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../slices/catalog/domain/catalog.types";
import { buildUniqueShopPublicPaths, getPreferredPublicPath } from "../slices/catalog/domain/shop-public-paths";
import {
  cloneBinding,
  cloneCatalogState,
  cloneMenuPage,
  cloneProduct,
  cloneShop,
  type CatalogRuntimeState,
} from "./catalog-runtime-state";

const createCatalogWriteEvent = (input: Omit<CatalogWriteEvent, "createdAt">): CatalogWriteEvent => ({
  ...input,
  createdAt: new Date().toISOString(),
});

const createUniqueConstraintError = (): Error & { code: string } => {
  const error = new Error("Unique constraint failed") as Error & { code: string };
  error.code = "P2002";
  return error;
};

const hasSellerShopNameConflict = (
  shops: SellerCatalogShop[],
  input: { sellerId: string; name: string; exceptShopId?: ShopId },
): boolean =>
  shops.some(
    (shop) =>
      shop.id !== input.exceptShopId && shop.sellerId === input.sellerId && shop.name === input.name,
  );

const hasPublicPathConflict = (
  shops: SellerCatalogShop[],
  input: Pick<CreateProvisionedShopInput, "primaryPublicPath" | "secondaryPublicPath">,
): boolean =>
  shops.some(
    (shop) =>
      shop.primaryPublicPath === input.primaryPublicPath ||
      shop.secondaryPublicPath === input.primaryPublicPath ||
      shop.primaryPublicPath === input.secondaryPublicPath ||
      shop.secondaryPublicPath === input.secondaryPublicPath,
  );

export class InMemoryCatalogRepository implements CatalogRepository {
  constructor(private readonly state: CatalogRuntimeState) {}

  async listPublicShops() {
    return this.state.shops
      .filter((shop) => !shop.isDeleted && shop.status === "WORKING")
      .map((shop) => ({ id: shop.id, name: shop.name, publicPath: getPreferredPublicPath(shop) }));
  }

  async getStartShowcase(): Promise<StartShowcase> {
    const favoriteShops: StartShowcase["favoriteShops"] = [];

    for (const reference of (this.state.favoriteShops ?? [])
      .filter((reference) => reference.isActive)
      .sort((left, right) => left.sortOrder - right.sortOrder)) {
      const shop = this.state.shops.find((candidate) => candidate.id === reference.shopId);

      if (shop === undefined || shop.isDeleted || shop.status !== "WORKING") {
        continue;
      }

      favoriteShops.push({
        id: shop.id,
        name: shop.name,
        publicPath: getPreferredPublicPath(shop),
        description: shop.description,
        headerImageUrl: shop.headerImageUrl,
        backgroundImageUrl: shop.backgroundImageUrl,
        status: shop.status,
        sortOrder: reference.sortOrder,
      });

      if (favoriteShops.length >= 3) {
        break;
      }
    }

    const popularTodayProducts: StartShowcase["popularTodayProducts"] = (this.state.showcaseProducts ?? [])
      .filter((reference) => reference.isActive)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((reference) => {
        const product = this.state.products.find((candidate) => candidate.id === reference.productId);
        const shop = product === undefined
          ? undefined
          : this.state.shops.find((candidate) => candidate.id === product.shopId);

        if (
          product === undefined ||
          shop === undefined ||
          product.isDeleted ||
          shop.isDeleted ||
          shop.status !== "WORKING"
        ) {
          return null;
        }

        return {
          id: product.id,
          shopId: product.shopId,
          menuPageId: product.menuPageId,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          priceMinor: product.priceMinor,
          shopPublicPath: getPreferredPublicPath(shop),
          shopName: shop.name,
          sortOrder: reference.sortOrder,
        };
      })
      .filter((product): product is StartShowcase["popularTodayProducts"][number] => product !== null);

    return {
      favoriteShops,
      allKhujandLink: {
        label: "весь Худжанд",
        target: "/shops",
      },
      popularTodayProducts,
    };
  }

  async listAllPublicPaths() {
    return this.state.shops.flatMap((shop) => [shop.primaryPublicPath, shop.secondaryPublicPath]);
  }

  async listSellerPrimaryPublicPaths(sellerId: string) {
    return this.state.shops
      .filter((shop) => shop.sellerId === sellerId)
      .map((shop) => shop.primaryPublicPath);
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
        description: product.description,
        imageUrl: product.imageUrl,
        priceMinor: product.priceMinor,
      }));
  }

  async listAdminProvisionedShops(): Promise<AdminProvisionedShopSummary[]> {
    return this.state.shops
      .filter((shop) => !shop.isDeleted)
      .map((shop) => ({
        shopId: shop.id,
        shopName: shop.name,
        status: shop.status,
        sellerId: shop.sellerId,
        primaryPublicPath: shop.primaryPublicPath,
        secondaryPublicPath: shop.secondaryPublicPath,
        telegramId:
          this.state.bindings.find((binding) => binding.shopId === shop.id)?.telegramId ?? null,
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

  async findShopByPublicPath(publicPath: string) {
    const normalizedPublicPath = publicPath.toLowerCase();
    const shop =
      this.state.shops.find(
        (candidate) =>
          candidate.primaryPublicPath.toLowerCase() === normalizedPublicPath ||
          candidate.secondaryPublicPath.toLowerCase() === normalizedPublicPath,
      ) ?? null;
    return shop === null ? null : cloneShop(shop);
  }

  async createShop(input: CreateProvisionedShopInput) {
    if (hasSellerShopNameConflict(this.state.shops, input)) {
      throw createUniqueConstraintError();
    }

    const publicPaths =
      typeof input.primaryPublicPath === "string" &&
      input.primaryPublicPath.length > 0 &&
      typeof input.secondaryPublicPath === "string" &&
      input.secondaryPublicPath.length > 0
        ? {
            primaryPublicPath: input.primaryPublicPath,
            secondaryPublicPath: input.secondaryPublicPath,
          }
        : buildUniqueShopPublicPaths({
            sellerId: input.sellerId,
            shopName: input.name,
            existingPublicPaths: await this.listAllPublicPaths(),
            existingSellerPrimaryPublicPaths: await this.listSellerPrimaryPublicPaths(input.sellerId),
          });

    if (hasPublicPathConflict(this.state.shops, publicPaths)) {
      throw createUniqueConstraintError();
    }

    const shop: SellerCatalogShop = {
      id: `shop-runtime-${this.state.nextShopId++}`,
      sellerId: input.sellerId,
      name: input.name,
      primaryPublicPath: publicPaths.primaryPublicPath,
      secondaryPublicPath: publicPaths.secondaryPublicPath,
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
      hasSellerShopNameConflict(this.state.shops, {
        sellerId: shop.sellerId,
        name: input.name,
        exceptShopId: shopId,
      })
    ) {
      throw createUniqueConstraintError();
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

  async provisionSellerShop(
    input: PersistProvisionSellerShopInput & { blueprint: ProvisioningTemplateBlueprint },
  ): Promise<ProvisionedSellerShop> {
    const duplicateShop = hasSellerShopNameConflict(this.state.shops, input);

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
      primaryPublicPath: input.primaryPublicPath,
      secondaryPublicPath: input.secondaryPublicPath,
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

  async addShowcaseProduct(productId: string): Promise<void> {
    const existing = (this.state.showcaseProducts ?? []).find((reference) => reference.productId === productId);

    if (existing !== undefined) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.sortOrder = this.nextShowcaseProductSortOrder();
      }
      return;
    }

    const reference: CatalogShowcaseProductReference = {
      id: `showcase-product-runtime-${this.state.nextShowcaseProductId++}`,
      productId,
      sortOrder: this.nextShowcaseProductSortOrder(),
      isActive: true,
    };
    this.state.showcaseProducts.push(reference);
  }

  async unlinkShowcaseProduct(productId: string): Promise<void> {
    const existing = (this.state.showcaseProducts ?? []).find((reference) => reference.productId === productId);

    if (existing !== undefined) {
      existing.isActive = false;
    }
  }

  async favoriteShop(shopId: string): Promise<void> {
    const existing = (this.state.favoriteShops ?? []).find((reference) => reference.shopId === shopId);

    if (existing?.isActive === true) {
      return;
    }

    const visibleFavoriteCount = (this.state.favoriteShops ?? []).filter((reference) => {
      const shop = this.state.shops.find((candidate) => candidate.id === reference.shopId);

      return reference.isActive && shop !== undefined && !shop.isDeleted && shop.status === "WORKING";
    }).length;

    if (visibleFavoriteCount >= 3) {
      throw new AppError(
        "SHOWCASE_FAVORITE_LIMIT",
        "Start showcase can have at most 3 favorite shops",
        409,
        { limit: 3 },
      );
    }

    if (existing !== undefined) {
      existing.isActive = true;
      existing.sortOrder = this.nextFavoriteShopSortOrder();
      return;
    }

    const reference: CatalogFavoriteShopReference = {
      id: `favorite-shop-runtime-${this.state.nextFavoriteShopId++}`,
      shopId,
      sortOrder: this.nextFavoriteShopSortOrder(),
      isActive: true,
    };
    this.state.favoriteShops.push(reference);
  }

  async unfavoriteShop(shopId: string): Promise<void> {
    const existing = (this.state.favoriteShops ?? []).find((reference) => reference.shopId === shopId);

    if (existing !== undefined) {
      existing.isActive = false;
    }
  }

  private nextShowcaseProductSortOrder(): number {
    return Math.max(0, ...(this.state.showcaseProducts ?? []).filter((reference) => reference.isActive).map((reference) => reference.sortOrder)) + 1;
  }

  private nextFavoriteShopSortOrder(): number {
    return Math.max(0, ...(this.state.favoriteShops ?? []).filter((reference) => reference.isActive).map((reference) => reference.sortOrder)) + 1;
  }
}
