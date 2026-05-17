import type {
  CreateProvisionedShopInput,
  PersistProvisionSellerShopInput,
  CreateSellerShopBindingInput,
  ProvisionedSellerShop,
  ProvisioningTemplateBlueprint,
  SellerCatalogMenuPage,
  SellerCatalogShop,
  SellerCatalogProduct,
  SellerShopBinding,
} from "../../domain/catalog.types";
import { buildUniqueShopPublicPaths } from "../../domain/shop-public-paths";
import { mapMenuPage, mapProduct } from "./catalog-prisma.mappers";
import {
  selectSellerBinding,
  selectSellerMenuPage,
  selectSellerProduct,
  selectSellerShop,
} from "./catalog-prisma.selects";
import type { CatalogPrismaClientLike, CatalogPrismaTransactionalClientLike } from "./catalog-prisma.types";

export class CatalogProvisioningWriter {
  constructor(private readonly prisma: CatalogPrismaClientLike | CatalogPrismaTransactionalClientLike) {}

  private async resolvePublicPaths(input: CreateProvisionedShopInput): Promise<{
    primaryPublicPath: string;
    secondaryPublicPath: string;
  }> {
    if (
      typeof input.primaryPublicPath === "string" &&
      input.primaryPublicPath.length > 0 &&
      typeof input.secondaryPublicPath === "string" &&
      input.secondaryPublicPath.length > 0
    ) {
      return {
        primaryPublicPath: input.primaryPublicPath,
        secondaryPublicPath: input.secondaryPublicPath,
      };
    }

    const [allPathRecords, sellerPathRecords] = await Promise.all([
      this.prisma.shop.findMany({
        where: {},
        select: {
          primaryPublicPath: true,
          secondaryPublicPath: true,
        },
      }),
      this.prisma.shop.findMany({
        where: {
          sellerId: input.sellerId,
        },
        select: {
          primaryPublicPath: true,
        },
      }),
    ]);

    return buildUniqueShopPublicPaths({
      sellerId: input.sellerId,
      shopName: input.name,
      existingPublicPaths: allPathRecords.flatMap((record) => [
        String(record.primaryPublicPath),
        String(record.secondaryPublicPath),
      ]),
      existingSellerPrimaryPublicPaths: sellerPathRecords.map((record) => String(record.primaryPublicPath)),
    });
  }

  async createShop(input: CreateProvisionedShopInput): Promise<SellerCatalogShop> {
    const publicPaths = await this.resolvePublicPaths(input);

    return this.prisma.shop.create({
      data: {
        sellerId: input.sellerId,
        name: input.name,
        primaryPublicPath: publicPaths.primaryPublicPath,
        secondaryPublicPath: publicPaths.secondaryPublicPath,
        description: input.description,
        headerImageUrl: input.headerImageUrl,
        backgroundImageUrl: input.backgroundImageUrl,
        status: input.status ?? "WORKING",
      },
      select: {
        ...selectSellerShop,
      },
    });
  }

  createSellerShopBinding(input: CreateSellerShopBindingInput): Promise<SellerShopBinding> {
    return this.prisma.sellerShopBinding.create({
      data: {
        shopId: input.shopId,
        sellerId: input.sellerId,
        telegramId: input.telegramId,
      },
      select: selectSellerBinding,
    });
  }

  provisionSellerShop(
    input: PersistProvisionSellerShopInput & { blueprint: ProvisioningTemplateBlueprint },
  ): Promise<ProvisionedSellerShop> {
    const transactionalPrisma = this.prisma as CatalogPrismaTransactionalClientLike;

    return transactionalPrisma.$transaction(async (transactionClient) => {
      const shop = await transactionClient.shop.create({
        data: {
          sellerId: input.sellerId,
          name: input.name,
          primaryPublicPath: input.primaryPublicPath,
          secondaryPublicPath: input.secondaryPublicPath,
          description: input.description,
          headerImageUrl: input.headerImageUrl,
          backgroundImageUrl: input.backgroundImageUrl,
          status: input.status ?? input.blueprint.shopStatus,
        },
        select: selectSellerShop,
      });

      const binding = await transactionClient.sellerShopBinding.create({
        data: {
          shopId: shop.id,
          sellerId: shop.sellerId,
          telegramId: input.telegramId,
        },
        select: selectSellerBinding,
      });

      const menuPages: SellerCatalogMenuPage[] = [];
      const menuPageIdsByName = new Map<string, string>();

      for (const page of input.blueprint.menuPages) {
        const createdPage = await transactionClient.menuPage.create({
          data: {
            shopId: shop.id,
            name: page.name,
            position: page.position,
          },
          select: selectSellerMenuPage,
        });

        menuPages.push(mapMenuPage(createdPage));
        menuPageIdsByName.set(page.name, createdPage.id);
      }

      const products: SellerCatalogProduct[] = [];

      for (const product of input.blueprint.products) {
        const menuPageId = menuPageIdsByName.get(product.pageName) ?? null;
        const createdProduct = await transactionClient.product.create({
          data: {
            shopId: shop.id,
            menuPageId,
            name: product.name,
            description: product.description,
            priceMinor: product.priceMinor,
          },
          select: selectSellerProduct,
        });

        products.push(mapProduct(createdProduct));
      }

      return {
        shop,
        binding,
        menuPages,
        products,
      };
    });
  }
}
