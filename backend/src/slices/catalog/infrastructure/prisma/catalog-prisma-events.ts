import type { CatalogWriteEvent } from "../../domain/catalog.types";
import { toEventTimestamp } from "./catalog-prisma.mappers";

const createCatalogEventPayload = (input: {
  type: string;
  entity: CatalogWriteEvent["entity"];
  entityId: string;
  payload: Record<string, unknown>;
}) => ({
  type: input.type,
  entity: input.entity,
  entityId: input.entityId,
  payload: input.payload,
});

export const buildShopUpdatedEvent = (shop: {
  id: string;
  sellerId: string;
  status: string;
  name: string;
  renameCount: number;
  requiresManualRenameReview: boolean;
  updatedAt: Date;
}) =>
  createCatalogEventPayload({
    type: "catalog.shop.updated",
    entity: "shop",
    entityId: shop.id,
    payload: {
      shopId: shop.id,
      sellerId: shop.sellerId,
      status: shop.status,
      name: shop.name,
      renameCount: shop.renameCount,
      requiresManualRenameReview: shop.requiresManualRenameReview,
      updatedAt: toEventTimestamp(shop.updatedAt),
    },
  });

export const buildMenuPageCreatedEvent = (menuPage: {
  id: string;
  shopId: string;
  position: number;
  name: string;
  createdAt: Date;
  shop: {
    sellerId: string;
  };
}) =>
  createCatalogEventPayload({
    type: "catalog.menu_page.created",
    entity: "menu_page",
    entityId: menuPage.id,
    payload: {
      menuPageId: menuPage.id,
      shopId: menuPage.shopId,
      sellerId: menuPage.shop.sellerId,
      position: menuPage.position,
      name: menuPage.name,
      createdAt: toEventTimestamp(menuPage.createdAt),
    },
  });

export const buildMenuPageUpdatedEvent = (menuPage: {
  id: string;
  shopId: string;
  position: number;
  name: string;
  updatedAt: Date;
  shop: {
    sellerId: string;
  };
}) =>
  createCatalogEventPayload({
    type: "catalog.menu_page.updated",
    entity: "menu_page",
    entityId: menuPage.id,
    payload: {
      menuPageId: menuPage.id,
      shopId: menuPage.shopId,
      sellerId: menuPage.shop.sellerId,
      position: menuPage.position,
      name: menuPage.name,
      updatedAt: toEventTimestamp(menuPage.updatedAt),
    },
  });

export const buildProductCreatedEvent = (product: {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  priceMinor: number;
  createdAt: Date;
  shop: {
    sellerId: string;
  };
}) =>
  createCatalogEventPayload({
    type: "catalog.product.created",
    entity: "product",
    entityId: product.id,
    payload: {
      productId: product.id,
      shopId: product.shopId,
      menuPageId: product.menuPageId,
      sellerId: product.shop.sellerId,
      name: product.name,
      priceMinor: product.priceMinor,
      createdAt: toEventTimestamp(product.createdAt),
    },
  });

export const buildProductUpdatedEvent = (product: {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  priceMinor: number;
  updatedAt: Date;
  shop: {
    sellerId: string;
  };
}) =>
  createCatalogEventPayload({
    type: "catalog.product.updated",
    entity: "product",
    entityId: product.id,
    payload: {
      productId: product.id,
      shopId: product.shopId,
      menuPageId: product.menuPageId,
      sellerId: product.shop.sellerId,
      name: product.name,
      priceMinor: product.priceMinor,
      updatedAt: toEventTimestamp(product.updatedAt),
    },
  });
