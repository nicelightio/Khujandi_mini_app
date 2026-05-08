import { AppError } from "../../../../shared/errors/app-error";
import type { ProductId, ShopId } from "../../domain/catalog.types";
import type { CatalogPrismaClientLike } from "./catalog-prisma.types";

const nextSortOrder = async (
  findMany: (args: Record<string, unknown>) => Promise<Array<{ sortOrder: number }>>,
): Promise<number> => {
  const [lastReference] = await findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "desc",
    },
    take: 1,
    select: {
      sortOrder: true,
    },
  });

  return (lastReference?.sortOrder ?? 0) + 1;
};

export class CatalogStartShowcaseWriter {
  constructor(private readonly prisma: CatalogPrismaClientLike) {}

  async addShowcaseProduct(productId: ProductId): Promise<void> {
    const existing = await this.prisma.catalogShowcaseProduct.findUnique({
      where: {
        productId,
      },
    });

    if (existing === null) {
      await this.prisma.catalogShowcaseProduct.create({
        data: {
          productId,
          sortOrder: await nextSortOrder((args) => this.prisma.catalogShowcaseProduct.findMany(args)),
          isActive: true,
        },
      });
      return;
    }

    if (!existing.isActive) {
      await this.prisma.catalogShowcaseProduct.update({
        where: {
          productId,
        },
        data: {
          isActive: true,
          sortOrder: await nextSortOrder((args) => this.prisma.catalogShowcaseProduct.findMany(args)),
        },
      });
    }
  }

  async unlinkShowcaseProduct(productId: ProductId): Promise<void> {
    const existing = await this.prisma.catalogShowcaseProduct.findUnique({
      where: {
        productId,
      },
    });

    if (existing === null || !existing.isActive) {
      return;
    }

    await this.prisma.catalogShowcaseProduct.update({
      where: {
        productId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async favoriteShop(shopId: ShopId): Promise<void> {
    const existing = await this.prisma.catalogFavoriteShop.findUnique({
      where: {
        shopId,
      },
    });

    if (existing?.isActive === true) {
      return;
    }

    const activeCount = await this.prisma.catalogFavoriteShop.count({
      where: {
        isActive: true,
        shop: {
          isDeleted: false,
          status: "WORKING",
        },
      },
    });

    if (activeCount >= 3) {
      throw new AppError(
        "SHOWCASE_FAVORITE_LIMIT",
        "Start showcase can have at most 3 favorite shops",
        409,
        { limit: 3 },
      );
    }

    if (existing === null) {
      await this.prisma.catalogFavoriteShop.create({
        data: {
          shopId,
          sortOrder: await nextSortOrder((args) => this.prisma.catalogFavoriteShop.findMany(args)),
          isActive: true,
        },
      });
      return;
    }

    await this.prisma.catalogFavoriteShop.update({
      where: {
        shopId,
      },
      data: {
        isActive: true,
        sortOrder: await nextSortOrder((args) => this.prisma.catalogFavoriteShop.findMany(args)),
      },
    });
  }

  async unfavoriteShop(shopId: ShopId): Promise<void> {
    const existing = await this.prisma.catalogFavoriteShop.findUnique({
      where: {
        shopId,
      },
    });

    if (existing === null || !existing.isActive) {
      return;
    }

    await this.prisma.catalogFavoriteShop.update({
      where: {
        shopId,
      },
      data: {
        isActive: false,
      },
    });
  }
}
