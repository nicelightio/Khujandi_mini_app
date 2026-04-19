import type {
  CatalogWriteResult,
  CreateSellerMenuPageInput,
  CreateSellerProductInput,
  MenuPageId,
  ProductId,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  ShopId,
  UpdateSellerMenuPageInput,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../../domain/catalog.types";
import {
  mapCatalogWriteEvent,
  mapMenuPage,
  mapProduct,
} from "./catalog-prisma.mappers";
import {
  buildMenuPageCreatedEvent,
  buildMenuPageUpdatedEvent,
  buildProductCreatedEvent,
  buildProductUpdatedEvent,
  buildShopUpdatedEvent,
} from "./catalog-prisma-events";
import {
  selectSellerMenuPageWrite,
  selectSellerProductWrite,
  selectSellerShopWrite,
} from "./catalog-prisma.selects";
import type { CatalogPrismaTransactionalClientLike } from "./catalog-prisma.types";

export class CatalogSellerWriter {
  constructor(private readonly prisma: CatalogPrismaTransactionalClientLike) {}

  updateShop(
    shopId: ShopId,
    input: UpdateSellerShopInput &
      Pick<SellerCatalogShop, "renameCount" | "requiresManualRenameReview">,
  ): Promise<CatalogWriteResult<SellerCatalogShop>> {
    return this.prisma.$transaction(async (transactionClient) => {
      const shop = await transactionClient.shop.update({
        where: {
          id: shopId,
        },
        data: {
          name: input.name,
          description: input.description,
          headerImageUrl: input.headerImageUrl,
          backgroundImageUrl: input.backgroundImageUrl,
          status: input.status,
          renameCount: input.renameCount,
          requiresManualRenameReview: input.requiresManualRenameReview,
        },
        select: selectSellerShopWrite,
      });

      const event = await transactionClient.event.create({
        data: buildShopUpdatedEvent(shop),
      });

      return {
        record: shop,
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  createMenuPage(
    input: CreateSellerMenuPageInput,
  ): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    return this.prisma.$transaction(async (transactionClient) => {
      const menuPage = await transactionClient.menuPage.create({
        data: {
          shopId: input.shopId,
          name: input.name,
          position: input.position,
        },
        select: selectSellerMenuPageWrite,
      });

      const event = await transactionClient.event.create({
        data: buildMenuPageCreatedEvent(menuPage),
      });

      return {
        record: mapMenuPage(menuPage),
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  updateMenuPage(
    menuPageId: MenuPageId,
    input: UpdateSellerMenuPageInput,
  ): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    return this.prisma.$transaction(async (transactionClient) => {
      const menuPage = await transactionClient.menuPage.update({
        where: {
          id: menuPageId,
        },
        data: {
          shopId: input.shopId,
          name: input.name,
        },
        select: selectSellerMenuPageWrite,
      });

      const event = await transactionClient.event.create({
        data: buildMenuPageUpdatedEvent(menuPage),
      });

      return {
        record: mapMenuPage(menuPage),
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  createProduct(
    input: CreateSellerProductInput,
  ): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    return this.prisma.$transaction(async (transactionClient) => {
      const product = await transactionClient.product.create({
        data: {
          shopId: input.shopId,
          menuPageId: input.menuPageId,
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          priceMinor: input.priceMinor,
        },
        select: selectSellerProductWrite,
      });

      const event = await transactionClient.event.create({
        data: buildProductCreatedEvent(product),
      });

      return {
        record: mapProduct(product),
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  updateProduct(
    productId: ProductId,
    input: UpdateSellerProductInput,
  ): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    return this.prisma.$transaction(async (transactionClient) => {
      const product = await transactionClient.product.update({
        where: {
          id: productId,
        },
        data: {
          shopId: input.shopId,
          menuPageId: input.menuPageId,
          name: input.name,
          description: input.description,
          imageUrl: input.imageUrl,
          priceMinor: input.priceMinor,
        },
        select: selectSellerProductWrite,
      });

      const event = await transactionClient.event.create({
        data: buildProductUpdatedEvent(product),
      });

      return {
        record: mapProduct(product),
        event: mapCatalogWriteEvent(event),
      };
    });
  }
}
