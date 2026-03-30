export type ShopId = string;
export type ProductId = string;
export type CatalogShop = {
  id: ShopId;
  name: string;
};

export type CatalogProduct = {
  id: ProductId;
  shopId: ShopId;
  name: string;
  priceMinor: number;
};

export interface CatalogRepository {
  listPublicShops(): Promise<CatalogShop[]>;
  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]>;
}
