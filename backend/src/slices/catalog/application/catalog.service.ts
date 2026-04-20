import {
  buildProvisioningTemplateBlueprint,
} from "../domain/catalog.types";
import { buildUniqueShopPublicPaths } from "../domain/shop-public-paths";
import type {
  AdminProvisionedShopSummary,
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  CreateSellerMenuPageInput,
  CreateSellerProductInput,
  MenuPageId,
  ProductId,
  ProvisionSellerShopInput,
  ProvisionedSellerShop,
  SellerCatalogMenuPage,
  SellerCatalogShop,
  SellerCatalogProduct,
  SellerId,
  ShopId,
  UpdateSellerMenuPageInput,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../domain/catalog.types";
import { AppError } from "../../../shared/errors/app-error";

const isUniqueConstraintError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const code = "code" in error ? error.code : undefined;
  return code === "P2002";
};

const createShopRenameConflictError = (): AppError =>
  new AppError(
    "SHOP_RENAME_CONFLICT",
    "Shop rename conflicts with another shop owned by this seller",
    409,
  );

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  listPublicShops(): Promise<CatalogShop[]> {
    return this.repository.listPublicShops();
  }

  listPublicProductsByShop(publicPath: string): Promise<CatalogProduct[]> {
    return this.listPublicProductsByShopPublicPath(publicPath);
  }

  async listPublicProductsByShopPublicPath(publicPath: string): Promise<CatalogProduct[]> {
    const shop = await this.repository.findShopByPublicPath(publicPath);

    if (shop === null) {
      return this.repository.listPublicProductsByShop(publicPath);
    }

    if (shop.isDeleted || shop.status !== "WORKING") {
      return [];
    }

    return this.repository.listPublicProductsByShop(shop.id);
  }

  listAdminProvisionedShops(): Promise<AdminProvisionedShopSummary[]> {
    return this.repository.listAdminProvisionedShops();
  }

  async listSellerShopsByTelegramId(telegramId: string): Promise<SellerCatalogShop[]> {
    const normalizedTelegramId = telegramId.trim();

    if (normalizedTelegramId.length === 0) {
      throw new AppError("AUTH_REQUIRED", "Seller access requires an authenticated Telegram session", 401);
    }

    const bindings = await this.repository.listSellerBindingsByTelegramId(normalizedTelegramId);

    if (bindings.length === 0) {
      throw new AppError("FORBIDDEN", "Seller access is not provisioned for this Telegram account", 403, {
        telegramId: normalizedTelegramId,
      });
    }

    const ownedShops = await Promise.all(
      bindings.map(async (binding) => {
        const shop = await this.repository.findShopById(binding.shopId);

        if (shop === null || shop.isDeleted || shop.sellerId !== binding.sellerId) {
          return null;
        }

        return shop;
      }),
    );

    const visibleOwnedShops = ownedShops.filter((shop): shop is SellerCatalogShop => shop !== null);

    if (visibleOwnedShops.length === 0) {
      throw new AppError("FORBIDDEN", "Seller access is not provisioned for this Telegram account", 403, {
        telegramId: normalizedTelegramId,
      });
    }

    return visibleOwnedShops;
  }

  async getSellerShopByTelegramId(telegramId: string, shopId: ShopId): Promise<SellerCatalogShop> {
    const shops = await this.listSellerShopsByTelegramId(telegramId);
    const ownedShop = shops.find(
      (shop) =>
        shop.id === shopId ||
        shop.primaryPublicPath.toLowerCase() === shopId.toLowerCase() ||
        shop.secondaryPublicPath.toLowerCase() === shopId.toLowerCase(),
    );

    if (ownedShop === undefined) {
      throw new AppError("FORBIDDEN", "Seller cannot access this shop", 403, {
        shopId,
      });
    }

    return ownedShop;
  }

  async provisionSellerShop(input: ProvisionSellerShopInput): Promise<ProvisionedSellerShop> {
    const sellerId = input.sellerId.trim();
    const telegramId = input.telegramId.trim();
    const name = input.name.trim();

    if (sellerId.length === 0 || telegramId.length === 0 || name.length === 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Provisioning requires sellerId, telegramId, and shop name",
        400,
      );
    }

    try {
      const [existingPublicPaths, existingSellerPrimaryPublicPaths] = await Promise.all([
        this.repository.listAllPublicPaths(),
        this.repository.listSellerPrimaryPublicPaths(sellerId),
      ]);
      const publicPaths = buildUniqueShopPublicPaths({
        sellerId,
        shopName: name,
        existingPublicPaths,
        existingSellerPrimaryPublicPaths,
      });

      return await this.repository.provisionSellerShop({
        sellerId,
        telegramId,
        name,
        primaryPublicPath: publicPaths.primaryPublicPath,
        secondaryPublicPath: publicPaths.secondaryPublicPath,
        description: input.description,
        headerImageUrl: input.headerImageUrl,
        backgroundImageUrl: input.backgroundImageUrl,
        status: input.status,
        blueprint: buildProvisioningTemplateBlueprint(),
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (isUniqueConstraintError(error)) {
        throw new AppError(
          "SHOP_PROVISIONING_CONFLICT",
          "Shop provisioning conflicts with an existing seller binding or shop record",
          409,
        );
      }

      throw error;
    }
  }

  async updateSellerShop(
    sellerId: SellerId,
    shopId: ShopId,
    input: UpdateSellerShopInput,
  ): Promise<SellerCatalogShop> {
    const shop = await this.repository.findShopById(shopId);

    if (shop === null || shop.isDeleted) {
      throw new AppError("SHOP_NOT_FOUND", "Shop was not found", 404, { shopId });
    }

    if (shop.sellerId !== sellerId) {
      throw new AppError("SHOP_FORBIDDEN", "Seller cannot modify this shop", 403, {
        sellerId,
        shopId,
      });
    }

    const isRename = shop.name !== input.name;
    const isStatusChange = input.status !== undefined && input.status !== shop.status;

    if (
      !isRename &&
      !isStatusChange &&
      input.description === undefined &&
      input.headerImageUrl === undefined &&
      input.backgroundImageUrl === undefined
    ) {
      return shop;
    }

    const renameCount = isRename ? shop.renameCount + 1 : shop.renameCount;

    let result;

    try {
      result = await this.repository.updateShop(shopId, {
        name: input.name,
        description: input.description,
        headerImageUrl: input.headerImageUrl,
        backgroundImageUrl: input.backgroundImageUrl,
        status: input.status,
        renameCount,
        requiresManualRenameReview: shop.requiresManualRenameReview || (isRename && shop.renameCount >= 1),
      });
    } catch (error) {
      if (isRename && isUniqueConstraintError(error)) {
        throw createShopRenameConflictError();
      }

      throw error;
    }

    return result.record;
  }

  async createSellerMenuPage(
    sellerId: SellerId,
    input: CreateSellerMenuPageInput,
  ): Promise<SellerCatalogMenuPage> {
    await this.assertOwnedActiveShop(sellerId, input.shopId);

    const result = await this.repository.createMenuPage(input);
    return result.record;
  }

  async updateSellerMenuPage(
    sellerId: SellerId,
    menuPageId: MenuPageId,
    input: UpdateSellerMenuPageInput,
  ): Promise<SellerCatalogMenuPage> {
    const menuPage = await this.assertRequiredOwnedMenuPage(sellerId, menuPageId, input.shopId);

    if (menuPage.name === input.name) {
      return menuPage;
    }

    const result = await this.repository.updateMenuPage(menuPageId, input);
    return result.record;
  }

  async createSellerProduct(
    sellerId: SellerId,
    input: CreateSellerProductInput,
  ): Promise<SellerCatalogProduct> {
    await this.assertOwnedActiveShop(sellerId, input.shopId);
    await this.assertOwnedMenuPage(sellerId, input.menuPageId, input.shopId);

    const result = await this.repository.createProduct(input);
    return result.record;
  }

  async updateSellerProduct(
    sellerId: SellerId,
    productId: ProductId,
    input: UpdateSellerProductInput,
  ): Promise<SellerCatalogProduct> {
    const product = await this.repository.findProductById(productId);

    if (product === null || product.isDeleted) {
      throw new AppError("PRODUCT_NOT_FOUND", "Product was not found", 404, { productId });
    }

    if (product.sellerId !== sellerId) {
      throw new AppError("PRODUCT_FORBIDDEN", "Seller cannot modify this product", 403, {
        sellerId,
        productId,
      });
    }

    await this.assertOwnedActiveShop(sellerId, input.shopId);
    await this.assertOwnedMenuPage(sellerId, input.menuPageId, input.shopId);

    const result = await this.repository.updateProduct(productId, input);
    return result.record;
  }

  private async assertOwnedActiveShop(sellerId: SellerId, shopId: ShopId): Promise<SellerCatalogShop> {
    const shop = await this.repository.findShopById(shopId);

    if (shop === null || shop.isDeleted) {
      throw new AppError("SHOP_NOT_FOUND", "Shop was not found", 404, { shopId });
    }

    if (shop.sellerId !== sellerId) {
      throw new AppError("SHOP_FORBIDDEN", "Seller cannot modify this shop", 403, {
        sellerId,
        shopId,
      });
    }

    return shop;
  }

  private async assertOwnedMenuPage(
    sellerId: SellerId,
    menuPageId: MenuPageId | null | undefined,
    shopId: ShopId,
  ): Promise<SellerCatalogMenuPage | null> {
    if (menuPageId === undefined || menuPageId === null) {
      return null;
    }

    const menuPage = await this.repository.findMenuPageById(menuPageId);

    if (menuPage === null) {
      throw new AppError("MENU_PAGE_NOT_FOUND", "Menu page was not found", 404, { menuPageId });
    }

    if (menuPage.sellerId !== sellerId || menuPage.shopId !== shopId) {
      throw new AppError("MENU_PAGE_FORBIDDEN", "Seller cannot modify this menu page", 403, {
        sellerId,
        menuPageId,
        shopId,
      });
    }

    return menuPage;
  }

  private async assertRequiredOwnedMenuPage(
    sellerId: SellerId,
    menuPageId: MenuPageId,
    shopId: ShopId,
  ): Promise<SellerCatalogMenuPage> {
    const menuPage = await this.assertOwnedMenuPage(sellerId, menuPageId, shopId);

    if (menuPage === null) {
      throw new AppError("MENU_PAGE_NOT_FOUND", "Menu page was not found", 404, { menuPageId });
    }

    return menuPage;
  }
}
