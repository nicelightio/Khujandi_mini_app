import { CatalogService } from "../application/catalog.service";
import type {
  CreateSellerMenuPageInput,
  CreateSellerProductInput,
  ProvisionSellerShopInput,
  UpdateSellerMenuPageInput,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../domain/catalog.types";

export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  getShops() {
    return this.service.listPublicShops();
  }

  getStartShowcase() {
    return this.service.getStartShowcase();
  }

  getStorefront(publicPath: string) {
    return this.service.getPublicStorefrontByPublicPath(publicPath);
  }

  getProducts(publicPath: string) {
    return this.service.listPublicProductsByShopPublicPath(publicPath);
  }

  getAdminProvisionedShops() {
    return this.service.listAdminProvisionedShops();
  }

  getSellerShops(telegramId: string) {
    return this.service.listSellerShopsByTelegramId(telegramId);
  }

  getSellerShop(telegramId: string, shopId: string) {
    return this.service.getSellerShopByTelegramId(telegramId, shopId);
  }

  provisionShop(input: ProvisionSellerShopInput) {
    return this.service.provisionSellerShop(input);
  }

  updateShop(sellerId: string, shopId: string, input: UpdateSellerShopInput) {
    return this.service.updateSellerShop(sellerId, shopId, input);
  }

  createMenuPage(sellerId: string, input: CreateSellerMenuPageInput) {
    return this.service.createSellerMenuPage(sellerId, input);
  }

  updateMenuPage(sellerId: string, menuPageId: string, input: UpdateSellerMenuPageInput) {
    return this.service.updateSellerMenuPage(sellerId, menuPageId, input);
  }

  createProduct(sellerId: string, input: CreateSellerProductInput) {
    return this.service.createSellerProduct(sellerId, input);
  }

  updateProduct(sellerId: string, productId: string, input: UpdateSellerProductInput) {
    return this.service.updateSellerProduct(sellerId, productId, input);
  }

  addShowcaseProduct(productId: string) {
    return this.service.addShowcaseProduct(productId);
  }

  unlinkShowcaseProduct(productId: string) {
    return this.service.unlinkShowcaseProduct(productId);
  }

  favoriteShop(shopId: string) {
    return this.service.favoriteShop(shopId);
  }

  unfavoriteShop(shopId: string) {
    return this.service.unfavoriteShop(shopId);
  }
}
