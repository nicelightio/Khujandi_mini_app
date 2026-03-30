import type {
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  ShopId,
} from "../domain/catalog.types";

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  listPublicShops(): Promise<CatalogShop[]> {
    return this.repository.listPublicShops();
  }

  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]> {
    return this.repository.listPublicProductsByShop(shopId);
  }
}
