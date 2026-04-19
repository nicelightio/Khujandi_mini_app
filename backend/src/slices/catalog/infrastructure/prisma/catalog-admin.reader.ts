import type { AdminProvisionedShopSummary } from "../../domain/catalog.types";
import { selectAdminProvisionedShop } from "./catalog-prisma.selects";
import type { CatalogPrismaClientLike } from "./catalog-prisma.types";

type AdminProvisionedShopRecord = {
  id: string;
  name: string;
  sellerId: string;
  status: "WORKING" | "NOT_WORKING";
  sellerBindings: Array<{
    telegramId: string;
  }>;
};

export class CatalogAdminReader {
  constructor(private readonly prisma: CatalogPrismaClientLike) {}

  async listProvisionedShops(): Promise<AdminProvisionedShopSummary[]> {
    const shops = (await this.prisma.shop.findMany({
      where: {
        isDeleted: false,
      },
      select: selectAdminProvisionedShop,
    })) as AdminProvisionedShopRecord[];

    return shops.map((shop) => ({
      shopId: shop.id,
      shopName: shop.name,
      status: shop.status,
      sellerId: shop.sellerId,
      telegramId: shop.sellerBindings[0]?.telegramId ?? null,
    }));
  }
}
