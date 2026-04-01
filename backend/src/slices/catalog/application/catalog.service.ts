import type {
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  CreateSellerProductInput,
  ProductId,
  SellerCatalogShop,
  SellerCatalogProduct,
  SellerId,
  ShopId,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../domain/catalog.types";
import { AppError } from "../../../shared/errors/app-error";

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  listPublicShops(): Promise<CatalogShop[]> {
    return this.repository.listPublicShops();
  }

  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]> {
    return this.repository.listPublicProductsByShop(shopId);
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

    if (shop.name === input.name) {
      return shop;
    }

    const renameCount = shop.renameCount + 1;

    return this.repository.updateShop(shopId, {
      name: input.name,
      renameCount,
      requiresManualRenameReview:
        shop.requiresManualRenameReview || shop.renameCount >= 1,
    });
  }

  async createSellerProduct(
    sellerId: SellerId,
    input: CreateSellerProductInput,
  ): Promise<SellerCatalogProduct> {
    await this.assertOwnedActiveShop(sellerId, input.shopId);

    return this.repository.createProduct(input);
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

    return this.repository.updateProduct(productId, input);
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
}
