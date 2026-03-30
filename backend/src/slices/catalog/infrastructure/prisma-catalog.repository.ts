import type { PrismaProvider } from "../../../shared/db/prisma-client";
import type {
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  ShopId,
} from "../domain/catalog.types";

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaProvider) {}

  async listPublicShops(): Promise<CatalogShop[]> {
    return this.prisma.client.shop.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async listPublicProductsByShop(shopId: ShopId): Promise<CatalogProduct[]> {
    return this.prisma.client.product.findMany({
      where: {
        shopId,
        isDeleted: false,
        shop: {
          isDeleted: false,
        },
      },
      select: {
        id: true,
        shopId: true,
        name: true,
        priceMinor: true,
      },
    });
  }
}
