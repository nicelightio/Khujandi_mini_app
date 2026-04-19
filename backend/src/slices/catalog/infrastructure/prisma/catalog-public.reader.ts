import type {
  CatalogMenuPage,
  CatalogProduct,
  CatalogShop,
  ShopId,
} from "../../domain/catalog.types";
import type { CatalogPrismaClientLike } from "./catalog-prisma.types";

export class CatalogPublicReader {
  constructor(private readonly prisma: CatalogPrismaClientLike) {}

  listPublicShops(): Promise<CatalogShop[]> {
    return this.prisma.shop.findMany({
      where: {
        isDeleted: false,
        status: "WORKING",
      },
      select: {
        id: true,
        name: true,
      },
    });
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

  listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]> {
    return this.prisma.product.findMany({
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
        priceMinor: true,
      },
    });
  }
}
