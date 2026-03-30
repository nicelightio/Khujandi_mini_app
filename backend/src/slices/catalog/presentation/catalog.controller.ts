import { CatalogService } from "../application/catalog.service";

export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  getShops() {
    return this.service.listPublicShops();
  }

  getProducts(shopId: string) {
    return this.service.listPublicProductsByShop(shopId);
  }
}
