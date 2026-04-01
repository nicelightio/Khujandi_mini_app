import type { PrismaProvider } from "../../../shared/db/prisma-client";
import type {
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  CreateSellerProductInput,
  ProductId,
  SellerCatalogShop,
  SellerCatalogProduct,
  ShopId,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
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

  async findShopById(shopId: ShopId): Promise<SellerCatalogShop | null> {
    return this.prisma.client.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        renameCount: true,
        requiresManualRenameReview: true,
        isDeleted: true,
      },
    });
  }

  async updateShop(
    shopId: ShopId,
    input: UpdateSellerShopInput & Pick<SellerCatalogShop, "renameCount" | "requiresManualRenameReview">,
  ): Promise<SellerCatalogShop> {
    return this.prisma.client.shop.update({
      where: {
        id: shopId,
      },
      data: {
        name: input.name,
        renameCount: input.renameCount,
        requiresManualRenameReview: input.requiresManualRenameReview,
      },
      select: {
        id: true,
        sellerId: true,
        name: true,
        renameCount: true,
        requiresManualRenameReview: true,
        isDeleted: true,
      },
    });
  }

  async findProductById(productId: ProductId): Promise<SellerCatalogProduct | null> {
    const product = await this.prisma.client.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        shopId: true,
        name: true,
        priceMinor: true,
        isDeleted: true,
        shop: {
          select: {
            sellerId: true,
            isDeleted: true,
          },
        },
      },
    });

    if (product === null) {
      return null;
    }

    return {
      id: product.id,
      shopId: product.shopId,
      name: product.name,
      priceMinor: product.priceMinor,
      isDeleted: product.isDeleted,
      sellerId: product.shop.sellerId,
    };
  }

  async createProduct(input: CreateSellerProductInput): Promise<SellerCatalogProduct> {
    const product = await this.prisma.client.product.create({
      data: {
        shopId: input.shopId,
        name: input.name,
        priceMinor: input.priceMinor,
      },
      select: {
        id: true,
        shopId: true,
        name: true,
        priceMinor: true,
        isDeleted: true,
        shop: {
          select: {
            sellerId: true,
            isDeleted: true,
          },
        },
      },
    });

    return {
      id: product.id,
      shopId: product.shopId,
      name: product.name,
      priceMinor: product.priceMinor,
      isDeleted: product.isDeleted,
      sellerId: product.shop.sellerId,
    };
  }

  async updateProduct(productId: ProductId, input: UpdateSellerProductInput): Promise<SellerCatalogProduct> {
    const product = await this.prisma.client.product.update({
      where: {
        id: productId,
      },
      data: {
        shopId: input.shopId,
        name: input.name,
        priceMinor: input.priceMinor,
      },
      select: {
        id: true,
        shopId: true,
        name: true,
        priceMinor: true,
        isDeleted: true,
        shop: {
          select: {
            sellerId: true,
            isDeleted: true,
          },
        },
      },
    });

    return {
      id: product.id,
      shopId: product.shopId,
      name: product.name,
      priceMinor: product.priceMinor,
      isDeleted: product.isDeleted,
      sellerId: product.shop.sellerId,
    };
  }
}
