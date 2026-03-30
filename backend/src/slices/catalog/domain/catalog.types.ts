export type ShopId = string;
export type ProductId = string;
export type SellerId = string;

export type CatalogShop = {
  id: ShopId;
  sellerId: SellerId;
  name: string;
  renameCount: number;
  requiresManualRenameReview: boolean;
  isDeleted: boolean;
};

export type CatalogProduct = {
  id: ProductId;
  shopId: ShopId;
  name: string;
  priceMinor: number;
  isDeleted: boolean;
};

export interface CatalogRepository {
  listPublicShops(): Promise<CatalogShop[]>;
  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]>;
}
