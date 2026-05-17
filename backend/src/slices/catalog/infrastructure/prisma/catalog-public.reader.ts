import type {
  CatalogMenuPage,
  CatalogProduct,
  CatalogShop,
  SellerCatalogShop,
  ShopId,
} from "../../domain/catalog.types";
import type { CatalogPrismaClientLike } from "./catalog-prisma.types";

export class CatalogPublicReader {
  constructor(private readonly prisma: CatalogPrismaClientLike) {}

  async listPublicShops(): Promise<CatalogShop[]> {
    const shops = await this.prisma.shop.findMany({
      where: {
        isDeleted: false,
        status: "WORKING",
      },
      select: {
        id: true,
        name: true,
        primaryPublicPath: true,
        secondaryPublicPath: true,
      },
    });

    return shops.map((shop) => ({
      id: String(shop.id),
      name: String(shop.name),
      publicPath:
        typeof shop.secondaryPublicPath === "string" && shop.secondaryPublicPath.length > 0
          ? shop.secondaryPublicPath
          : String(shop.primaryPublicPath),
    }));
  }

  async listAllPublicPaths(): Promise<string[]> {
    const shops = await this.prisma.shop.findMany({
      where: {},
      select: {
        primaryPublicPath: true,
        secondaryPublicPath: true,
      },
    });

    return shops.flatMap((shop) => [String(shop.primaryPublicPath), String(shop.secondaryPublicPath)]);
  }

  async listSellerPrimaryPublicPaths(sellerId: string): Promise<string[]> {
    const shops = await this.prisma.shop.findMany({
      where: {
        sellerId,
      },
      select: {
        primaryPublicPath: true,
      },
    });

    return shops.map((shop) => String(shop.primaryPublicPath));
  }

  async findShopByPublicPath(publicPath: string): Promise<SellerCatalogShop | null> {
    if (typeof this.prisma.shop.findFirst !== "function") {
      return null;
    }

    const shop = (await this.prisma.shop.findFirst({
      where: {
        OR: [{ primaryPublicPath: publicPath }, { secondaryPublicPath: publicPath }],
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        primaryPublicPath: true,
        secondaryPublicPath: true,
        description: true,
        headerImageUrl: true,
        backgroundImageUrl: true,
        status: true,
        renameCount: true,
        requiresManualRenameReview: true,
        isDeleted: true,
      },
    })) as SellerCatalogShop | null;

    return shop;
  }

  listPublicMenuPagesByShop(shopId: ShopId): Promise<CatalogMenuPage[]> {
    return this.prisma.menuPage.findMany({
      where: {
        shopId,
        shop: {
          isDeleted: false,
          status: "WORKING",
        },
      },
      orderBy: {
        position: "asc",
      },
      select: {
        id: true,
        shopId: true,
        name: true,
        position: true,
      },
    });
  }

  async listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]> {
    const products = await this.prisma.product.findMany({
      where: {
        shopId,
        isDeleted: false,
        shop: {
          isDeleted: false,
          status: "WORKING",
        },
      },
      select: {
        id: true,
        shopId: true,
        menuPageId: true,
        name: true,
        description: true,
        imageUrl: true,
        priceMinor: true,
      },
    });

    return products.map((product) => ({
      id: product.id,
      shopId: product.shopId,
      menuPageId: product.menuPageId,
      name: product.name,
      description: product.description ?? null,
      imageUrl: product.imageUrl ?? null,
      priceMinor: product.priceMinor,
    }));
  }
}
