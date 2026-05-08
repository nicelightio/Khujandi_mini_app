import type { StartShowcase } from "../../domain/catalog.types";
import { getPreferredPublicPath } from "../../domain/shop-public-paths";
import type {
  CatalogPrismaClientLike,
  FavoriteShopReferenceRecord,
  ShowcaseProductReferenceRecord,
} from "./catalog-prisma.types";

const selectShowcaseProduct = {
  id: true,
  productId: true,
  sortOrder: true,
  isActive: true,
  product: {
    select: {
      id: true,
      shopId: true,
      menuPageId: true,
      name: true,
      description: true,
      imageUrl: true,
      priceMinor: true,
      isDeleted: true,
      shop: {
        select: {
          id: true,
          name: true,
          primaryPublicPath: true,
          secondaryPublicPath: true,
          isDeleted: true,
          status: true,
        },
      },
    },
  },
} as const;

const selectFavoriteShop = {
  id: true,
  shopId: true,
  sortOrder: true,
  isActive: true,
  shop: {
    select: {
      id: true,
      name: true,
      primaryPublicPath: true,
      secondaryPublicPath: true,
      description: true,
      headerImageUrl: true,
      backgroundImageUrl: true,
      status: true,
      isDeleted: true,
    },
  },
} as const;

export class CatalogStartShowcaseReader {
  constructor(private readonly prisma: CatalogPrismaClientLike) {}

  async getStartShowcase(): Promise<StartShowcase> {
    const [favoriteReferences, productReferences] = await Promise.all([
      this.prisma.catalogFavoriteShop.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: selectFavoriteShop,
      }),
      this.prisma.catalogShowcaseProduct.findMany({
        where: {
          isActive: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: selectShowcaseProduct,
      }),
    ]);

    const favoriteShops = favoriteReferences
      .filter((reference): reference is FavoriteShopReferenceRecord & { shop: NonNullable<FavoriteShopReferenceRecord["shop"]> } =>
        reference.shop !== undefined &&
        !reference.shop.isDeleted &&
        reference.shop.status === "WORKING",
      )
      .slice(0, 3)
      .map((reference) => ({
        id: reference.shop.id,
        name: reference.shop.name,
        publicPath: getPreferredPublicPath(reference.shop),
        description: reference.shop.description,
        headerImageUrl: reference.shop.headerImageUrl,
        backgroundImageUrl: reference.shop.backgroundImageUrl,
        status: reference.shop.status,
        sortOrder: reference.sortOrder,
      }));

    const popularTodayProducts = productReferences
      .filter((reference): reference is ShowcaseProductReferenceRecord & { product: NonNullable<ShowcaseProductReferenceRecord["product"]> } =>
        reference.product !== undefined &&
        !reference.product.isDeleted &&
        !reference.product.shop.isDeleted &&
        reference.product.shop.status === "WORKING",
      )
      .map((reference) => ({
        id: reference.product.id,
        shopId: reference.product.shopId,
        menuPageId: reference.product.menuPageId,
        name: reference.product.name,
        description: reference.product.description,
        imageUrl: reference.product.imageUrl,
        priceMinor: reference.product.priceMinor,
        shopPublicPath: getPreferredPublicPath(reference.product.shop),
        shopName: reference.product.shop.name,
        sortOrder: reference.sortOrder,
      }));

    return {
      favoriteShops,
      allKhujandLink: {
        label: "весь Худжанд",
        target: "/shops",
      },
      popularTodayProducts,
    };
  }
}
