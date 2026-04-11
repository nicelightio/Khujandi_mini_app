export type ShopId = string;
export type ProductId = string;
export type MenuPageId = string;
export type SellerId = string;
export type ShopStatus = "WORKING" | "NOT_WORKING";

export type CatalogShop = {
  id: ShopId;
  name: string;
};

export type SellerCatalogShop = {
  id: ShopId;
  sellerId: SellerId;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  backgroundImageUrl: string | null;
  status: ShopStatus;
  renameCount: number;
  requiresManualRenameReview: boolean;
  isDeleted: boolean;
};

export type UpdateSellerShopInput = {
  name: string;
  description?: string | null;
  headerImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  status?: ShopStatus;
};

export type CatalogProduct = {
  id: ProductId;
  shopId: ShopId;
  menuPageId: MenuPageId | null;
  name: string;
  priceMinor: number;
};

export type CatalogMenuPage = {
  id: MenuPageId;
  shopId: ShopId;
  name: string;
  position: number;
};

export type SellerCatalogProduct = {
  id: ProductId;
  shopId: ShopId;
  menuPageId: MenuPageId | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
  isDeleted: boolean;
  sellerId: SellerId;
};

export type SellerCatalogMenuPage = CatalogMenuPage & {
  sellerId: SellerId;
  shopStatus: ShopStatus;
};

export type SellerShopBinding = {
  id: string;
  shopId: ShopId;
  sellerId: SellerId;
  telegramId: string;
};

export type CatalogWriteEventEntity = "shop" | "menu_page" | "product";

export type CatalogWriteEvent = {
  type: string;
  entity: CatalogWriteEventEntity;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type CatalogWriteResult<TRecord> = {
  record: TRecord;
  event: CatalogWriteEvent;
};

export type CreateProvisionedShopInput = {
  sellerId: SellerId;
  name: string;
  description?: string | null;
  headerImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  status?: ShopStatus;
};

export type CreateSellerShopBindingInput = {
  shopId: ShopId;
  sellerId: SellerId;
  telegramId: string;
};

export type ProvisionSellerShopInput = {
  sellerId: SellerId;
  telegramId: string;
  name: string;
  description?: string | null;
  headerImageUrl?: string | null;
  backgroundImageUrl?: string | null;
  status?: ShopStatus;
};

export type CreateSellerMenuPageInput = {
  shopId: ShopId;
  name: string;
  position: number;
};

export type UpdateSellerMenuPageInput = {
  shopId: ShopId;
  name: string;
};

export type CreateSellerProductInput = {
  shopId: ShopId;
  menuPageId?: MenuPageId | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceMinor: number;
};

export type UpdateSellerProductInput = {
  shopId: ShopId;
  menuPageId?: MenuPageId | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceMinor: number;
};

export type ProvisioningTemplateProduct = {
  pageName: string;
  name: string;
  description: string;
  priceMinor: number;
};

export type ProvisioningTemplateBlueprint = {
  shopStatus: ShopStatus;
  menuPages: Array<{
    name: string;
    position: number;
  }>;
  products: ProvisioningTemplateProduct[];
};

export const buildProvisioningTemplateBlueprint = (): ProvisioningTemplateBlueprint => ({
  shopStatus: "WORKING",
  menuPages: [
    {
      name: "Popular",
      position: 1,
    },
    {
      name: "Drinks",
      position: 2,
    },
  ],
  products: [
    {
      pageName: "Popular",
      name: "Starter Dish",
      description: "Edit this product after admin provisioning.",
      priceMinor: 1000,
    },
    {
      pageName: "Drinks",
      name: "Starter Drink",
      description: "Replace this placeholder with a real menu item.",
      priceMinor: 500,
    },
  ],
});

export type ProvisionedSellerShop = {
  shop: SellerCatalogShop;
  binding: SellerShopBinding;
  menuPages: SellerCatalogMenuPage[];
  products: SellerCatalogProduct[];
};

export interface CatalogRepository {
  listPublicShops(): Promise<CatalogShop[]>;
  listPublicMenuPagesByShop(shopId: ShopId): Promise<CatalogMenuPage[]>;
  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]>;
  listSellerBindingsByTelegramId(telegramId: string): Promise<SellerShopBinding[]>;
  findShopById(shopId: ShopId): Promise<SellerCatalogShop | null>;
  createShop(input: CreateProvisionedShopInput): Promise<SellerCatalogShop>;
  updateShop(shopId: ShopId, input: UpdateSellerShopInput & Pick<SellerCatalogShop, "renameCount" | "requiresManualRenameReview">): Promise<CatalogWriteResult<SellerCatalogShop>>;
  findMenuPageById(menuPageId: MenuPageId): Promise<SellerCatalogMenuPage | null>;
  createMenuPage(input: CreateSellerMenuPageInput): Promise<CatalogWriteResult<SellerCatalogMenuPage>>;
  updateMenuPage(menuPageId: MenuPageId, input: UpdateSellerMenuPageInput): Promise<CatalogWriteResult<SellerCatalogMenuPage>>;
  findProductById(productId: ProductId): Promise<SellerCatalogProduct | null>;
  createSellerShopBinding(input: CreateSellerShopBindingInput): Promise<SellerShopBinding>;
  provisionSellerShop(input: ProvisionSellerShopInput & { blueprint: ProvisioningTemplateBlueprint }): Promise<ProvisionedSellerShop>;
  createProduct(input: CreateSellerProductInput): Promise<CatalogWriteResult<SellerCatalogProduct>>;
  updateProduct(productId: ProductId, input: UpdateSellerProductInput): Promise<CatalogWriteResult<SellerCatalogProduct>>;
}
