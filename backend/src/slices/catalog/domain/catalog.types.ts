export type ShopId = string;
export type ProductId = string;
export type SellerId = string;

export type CatalogShop = {
  id: ShopId;
  name: string;
};

export type SellerCatalogShop = {
  id: ShopId;
  sellerId: SellerId;
  name: string;
  renameCount: number;
  requiresManualRenameReview: boolean;
  isDeleted: boolean;
};

export type UpdateSellerShopInput = {
  name: string;
};

export type CatalogProduct = {
  id: ProductId;
  shopId: ShopId;
  name: string;
  priceMinor: number;
};

export type SellerCatalogProduct = {
  id: ProductId;
  shopId: ShopId;
  name: string;
  priceMinor: number;
  isDeleted: boolean;
  sellerId: SellerId;
};

export type CreateSellerProductInput = {
  shopId: ShopId;
  name: string;
  priceMinor: number;
};

export type UpdateSellerProductInput = {
  shopId: ShopId;
  name: string;
  priceMinor: number;
};

export interface CatalogRepository {
  listPublicShops(): Promise<CatalogShop[]>;
  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]>;
  findShopById(shopId: ShopId): Promise<SellerCatalogShop | null>;
  updateShop(shopId: ShopId, input: UpdateSellerShopInput & Pick<SellerCatalogShop, "renameCount" | "requiresManualRenameReview">): Promise<SellerCatalogShop>;
  findProductById(productId: ProductId): Promise<SellerCatalogProduct | null>;
  createProduct(input: CreateSellerProductInput): Promise<SellerCatalogProduct>;
  updateProduct(productId: ProductId, input: UpdateSellerProductInput): Promise<SellerCatalogProduct>;
}
