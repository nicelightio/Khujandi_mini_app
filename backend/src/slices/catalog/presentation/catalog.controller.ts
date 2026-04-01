import { CatalogService } from "../application/catalog.service";

export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  getShops() {
    return this.service.listPublicShops();
  }

  getProducts(shopId: string) {
    return this.service.listPublicProductsByShop(shopId);
  }

  updateShop(sellerId: string, shopId: string, input: { name: string }) {
    return this.service.updateSellerShop(sellerId, shopId, input);
  }

  createProduct(sellerId: string, input: { shopId: string; name: string; priceMinor: number }) {
    return this.service.createSellerProduct(sellerId, input);
  }

  updateProduct(
    sellerId: string,
    productId: string,
    input: { shopId: string; name: string; priceMinor: number },
  ) {
    return this.service.updateSellerProduct(sellerId, productId, input);
  }
}
