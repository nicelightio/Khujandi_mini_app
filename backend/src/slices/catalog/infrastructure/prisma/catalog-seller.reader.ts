import type {
  MenuPageId,
  ProductId,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  SellerShopBinding,
  ShopId,
} from "../../domain/catalog.types";
import {
  mapMenuPage,
  mapProduct,
  type SellerMenuPageRecord,
  type SellerProductRecord,
} from "./catalog-prisma.mappers";
import {
  selectSellerBinding,
  selectSellerMenuPage,
  selectSellerProduct,
  selectSellerShop,
} from "./catalog-prisma.selects";
import type { CatalogPrismaClientLike } from "./catalog-prisma.types";

export class CatalogSellerReader {
  constructor(private readonly prisma: CatalogPrismaClientLike) {}

  listSellerBindingsByTelegramId(telegramId: string): Promise<SellerShopBinding[]> {
    return this.prisma.sellerShopBinding.findMany({
      where: {
        telegramId,
      },
      select: selectSellerBinding,
    });
  }

  async listSellerMenuPagesByShop(shopId: ShopId): Promise<SellerCatalogMenuPage[]> {
    const menuPages = (await this.prisma.menuPage.findMany({
      where: {
        shopId,
        shop: {
          isDeleted: false,
        },
      },
      orderBy: {
        position: "asc",
      },
      select: selectSellerMenuPage,
    })) as SellerMenuPageRecord[];

    return menuPages.map((menuPage) => mapMenuPage(menuPage));
  }

  async listSellerProductsByShop(shopId: ShopId): Promise<SellerCatalogProduct[]> {
    const products = (await this.prisma.product.findMany({
      where: {
        shopId,
        isDeleted: false,
        shop: {
          isDeleted: false,
        },
      },
      select: selectSellerProduct,
    })) as SellerProductRecord[];

    return products.map((product) => mapProduct(product));
  }

  findShopById(shopId: ShopId): Promise<SellerCatalogShop | null> {
    return this.prisma.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        ...selectSellerShop,
      },
    });
  }

  async findMenuPageById(menuPageId: MenuPageId): Promise<SellerCatalogMenuPage | null> {
    const menuPage = await this.prisma.menuPage.findUnique({
      where: {
        id: menuPageId,
      },
      select: selectSellerMenuPage,
    });

    if (menuPage === null) {
      return null;
    }

    return mapMenuPage(menuPage);
  }

  async findProductById(productId: ProductId): Promise<SellerCatalogProduct | null> {
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: selectSellerProduct,
    });

    if (product === null) {
      return null;
    }

    return mapProduct(product);
  }
}
