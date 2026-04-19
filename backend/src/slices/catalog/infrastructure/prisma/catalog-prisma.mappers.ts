import type {
  CatalogWriteEvent,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
} from "../../domain/catalog.types";

export const mapMenuPage = (menuPage: {
  id: string;
  shopId: string;
  name: string;
  position: number;
  shop: {
    sellerId: string;
    status: SellerCatalogMenuPage["shopStatus"];
  };
}): SellerCatalogMenuPage => ({
  id: menuPage.id,
  shopId: menuPage.shopId,
  name: menuPage.name,
  position: menuPage.position,
  sellerId: menuPage.shop.sellerId,
  shopStatus: menuPage.shop.status,
});

export type SellerMenuPageRecord = Parameters<typeof mapMenuPage>[0];

export const mapProduct = (product: {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
  isDeleted: boolean;
  shop: {
    sellerId: string;
  };
}): SellerCatalogProduct => ({
  id: product.id,
  shopId: product.shopId,
  menuPageId: product.menuPageId,
  name: product.name,
  description: product.description,
  imageUrl: product.imageUrl,
  priceMinor: product.priceMinor,
  isDeleted: product.isDeleted,
  sellerId: product.shop.sellerId,
});

export type SellerProductRecord = Parameters<typeof mapProduct>[0];

export const toEventTimestamp = (value: Date | undefined): string =>
  (value ?? new Date(0)).toISOString();

export const mapCatalogWriteEvent = (event: {
  type: string;
  entity: string;
  entityId: string;
  payload: unknown;
  createdAt: Date;
}): CatalogWriteEvent => ({
  type: event.type,
  entity: event.entity as CatalogWriteEvent["entity"],
  entityId: event.entityId,
  payload: (event.payload ?? {}) as Record<string, unknown>,
  createdAt: event.createdAt.toISOString(),
});
