import type { PrismaProvider } from "../../../shared/db/prisma-client";
import type {
  CatalogWriteEvent,
  CatalogWriteResult,
  CatalogMenuPage,
  CatalogProduct,
  CatalogRepository,
  CatalogShop,
  CreateProvisionedShopInput,
  CreateSellerMenuPageInput,
  CreateSellerShopBindingInput,
  CreateSellerProductInput,
  MenuPageId,
  ProductId,
  ProvisionedSellerShop,
  ProvisionSellerShopInput,
  ProvisioningTemplateBlueprint,
  SellerCatalogMenuPage,
  SellerShopBinding,
  SellerCatalogShop,
  SellerCatalogProduct,
  ShopId,
  UpdateSellerProductInput,
  UpdateSellerShopInput,
} from "../domain/catalog.types";

type CatalogPrismaClientLike = PrismaProvider["client"];

type CatalogPrismaTransactionalClientLike = CatalogPrismaClientLike & {
  $transaction<T>(callback: (client: CatalogPrismaClientLike) => Promise<T>): Promise<T>;
};

const selectSellerShop = {
  id: true,
  sellerId: true,
  name: true,
  description: true,
  headerImageUrl: true,
  backgroundImageUrl: true,
  status: true,
  renameCount: true,
  requiresManualRenameReview: true,
  isDeleted: true,
} as const;

const selectSellerMenuPage = {
  id: true,
  shopId: true,
  name: true,
  position: true,
  shop: {
    select: {
      sellerId: true,
      isDeleted: true,
      status: true,
    },
  },
} as const;

const selectSellerProduct = {
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
      sellerId: true,
      isDeleted: true,
    },
  },
} as const;

const selectSellerBinding = {
  id: true,
  shopId: true,
  sellerId: true,
  telegramId: true,
} as const;

const selectSellerShopWrite = {
  ...selectSellerShop,
  updatedAt: true,
} as const;

const selectSellerMenuPageWrite = {
  ...selectSellerMenuPage,
  createdAt: true,
  updatedAt: true,
} as const;

const selectSellerProductWrite = {
  ...selectSellerProduct,
  createdAt: true,
  updatedAt: true,
} as const;

const mapMenuPage = (menuPage: {
  id: string;
  shopId: string;
  name: string;
  position: number;
  shop: {
    sellerId: string;
    status: SellerCatalogMenuPage["shopStatus"];
  };
}): SellerCatalogMenuPage => ({
  id: menuPage.id,
  shopId: menuPage.shopId,
  name: menuPage.name,
  position: menuPage.position,
  sellerId: menuPage.shop.sellerId,
  shopStatus: menuPage.shop.status,
});

type SellerMenuPageRecord = Parameters<typeof mapMenuPage>[0];

const mapProduct = (product: {
  id: string;
  shopId: string;
  menuPageId: string | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceMinor: number;
  isDeleted: boolean;
  shop: {
    sellerId: string;
  };
}): SellerCatalogProduct => ({
  id: product.id,
  shopId: product.shopId,
  menuPageId: product.menuPageId,
  name: product.name,
  description: product.description,
  imageUrl: product.imageUrl,
  priceMinor: product.priceMinor,
  isDeleted: product.isDeleted,
  sellerId: product.shop.sellerId,
});

type SellerProductRecord = Parameters<typeof mapProduct>[0];

const createCatalogEventPayload = (input: {
  type: string;
  entity: CatalogWriteEvent["entity"];
  entityId: string;
  payload: Record<string, unknown>;
}) => ({
  type: input.type,
  entity: input.entity,
  entityId: input.entityId,
  payload: input.payload,
});

const toEventTimestamp = (value: Date | undefined): string => (value ?? new Date(0)).toISOString();

const mapCatalogWriteEvent = (event: {
  type: string;
  entity: string;
  entityId: string;
  payload: unknown;
  createdAt: Date;
}): CatalogWriteEvent => ({
  type: event.type,
  entity: event.entity as CatalogWriteEvent["entity"],
  entityId: event.entityId,
  payload: (event.payload ?? {}) as Record<string, unknown>,
  createdAt: event.createdAt.toISOString(),
});

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaProvider) {}

  async listPublicShops(): Promise<CatalogShop[]> {
    return this.prisma.client.shop.findMany({
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

  async listPublicMenuPagesByShop(shopId: ShopId): Promise<CatalogMenuPage[]> {
    return this.prisma.client.menuPage.findMany({
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
    return this.prisma.client.product.findMany({
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

  listSellerBindingsByTelegramId(telegramId: string): Promise<SellerShopBinding[]> {
    return this.prisma.client.sellerShopBinding.findMany({
      where: {
        telegramId,
      },
      select: selectSellerBinding,
    });
  }

  async listSellerMenuPagesByShop(shopId: ShopId): Promise<SellerCatalogMenuPage[]> {
    const menuPages = (await this.prisma.client.menuPage.findMany({
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
    const products = (await this.prisma.client.product.findMany({
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

  async findShopById(shopId: ShopId): Promise<SellerCatalogShop | null> {
    return this.prisma.client.shop.findUnique({
      where: {
        id: shopId,
      },
      select: {
        ...selectSellerShop,
      },
    });
  }

  async createShop(input: CreateProvisionedShopInput): Promise<SellerCatalogShop> {
    return this.prisma.client.shop.create({
      data: {
        sellerId: input.sellerId,
        name: input.name,
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

  async updateShop(
    shopId: ShopId,
    input: UpdateSellerShopInput & Pick<SellerCatalogShop, "renameCount" | "requiresManualRenameReview">,
  ): Promise<CatalogWriteResult<SellerCatalogShop>> {
    const transactionalClient = this.prisma.client as CatalogPrismaTransactionalClientLike;

    return transactionalClient.$transaction(async (transactionClient) => {
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
        data: createCatalogEventPayload({
          type: "catalog.shop.updated",
          entity: "shop",
          entityId: shop.id,
          payload: {
            shopId: shop.id,
            sellerId: shop.sellerId,
            status: shop.status,
            name: shop.name,
            renameCount: shop.renameCount,
            requiresManualRenameReview: shop.requiresManualRenameReview,
            updatedAt: toEventTimestamp(shop.updatedAt),
          },
        }),
      });

      return {
        record: shop,
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  async findMenuPageById(menuPageId: MenuPageId): Promise<SellerCatalogMenuPage | null> {
    const menuPage = await this.prisma.client.menuPage.findUnique({
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

  async createMenuPage(input: CreateSellerMenuPageInput): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    const transactionalClient = this.prisma.client as CatalogPrismaTransactionalClientLike;

    return transactionalClient.$transaction(async (transactionClient) => {
      const menuPage = await transactionClient.menuPage.create({
        data: {
          shopId: input.shopId,
          name: input.name,
          position: input.position,
        },
        select: selectSellerMenuPageWrite,
      });

      const event = await transactionClient.event.create({
        data: createCatalogEventPayload({
          type: "catalog.menu_page.created",
          entity: "menu_page",
          entityId: menuPage.id,
          payload: {
            menuPageId: menuPage.id,
            shopId: menuPage.shopId,
            sellerId: menuPage.shop.sellerId,
            position: menuPage.position,
            name: menuPage.name,
            createdAt: toEventTimestamp(menuPage.createdAt),
          },
        }),
      });

      return {
        record: mapMenuPage(menuPage),
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  async updateMenuPage(menuPageId: MenuPageId, input: { shopId: ShopId; name: string }): Promise<CatalogWriteResult<SellerCatalogMenuPage>> {
    const transactionalClient = this.prisma.client as CatalogPrismaTransactionalClientLike;

    return transactionalClient.$transaction(async (transactionClient) => {
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
        data: createCatalogEventPayload({
          type: "catalog.menu_page.updated",
          entity: "menu_page",
          entityId: menuPage.id,
          payload: {
            menuPageId: menuPage.id,
            shopId: menuPage.shopId,
            sellerId: menuPage.shop.sellerId,
            position: menuPage.position,
            name: menuPage.name,
            updatedAt: toEventTimestamp(menuPage.updatedAt),
          },
        }),
      });

      return {
        record: mapMenuPage(menuPage),
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  async findProductById(productId: ProductId): Promise<SellerCatalogProduct | null> {
    const product = await this.prisma.client.product.findUnique({
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

  async createSellerShopBinding(input: CreateSellerShopBindingInput): Promise<SellerShopBinding> {
    return this.prisma.client.sellerShopBinding.create({
      data: {
        shopId: input.shopId,
        sellerId: input.sellerId,
        telegramId: input.telegramId,
      },
      select: selectSellerBinding,
    });
  }

  provisionSellerShop(input: ProvisionSellerShopInput & { blueprint: ProvisioningTemplateBlueprint }): Promise<ProvisionedSellerShop> {
    const transactionalClient = this.prisma.client as CatalogPrismaTransactionalClientLike;

    return transactionalClient.$transaction(async (transactionClient) => {
      const shop = await transactionClient.shop.create({
        data: {
          sellerId: input.sellerId,
          name: input.name,
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

  async createProduct(input: CreateSellerProductInput): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    const transactionalClient = this.prisma.client as CatalogPrismaTransactionalClientLike;

    return transactionalClient.$transaction(async (transactionClient) => {
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
        data: createCatalogEventPayload({
          type: "catalog.product.created",
          entity: "product",
          entityId: product.id,
          payload: {
            productId: product.id,
            shopId: product.shopId,
            menuPageId: product.menuPageId,
            sellerId: product.shop.sellerId,
            name: product.name,
            priceMinor: product.priceMinor,
            createdAt: toEventTimestamp(product.createdAt),
          },
        }),
      });

      return {
        record: mapProduct(product),
        event: mapCatalogWriteEvent(event),
      };
    });
  }

  async updateProduct(productId: ProductId, input: UpdateSellerProductInput): Promise<CatalogWriteResult<SellerCatalogProduct>> {
    const transactionalClient = this.prisma.client as CatalogPrismaTransactionalClientLike;

    return transactionalClient.$transaction(async (transactionClient) => {
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
        data: createCatalogEventPayload({
          type: "catalog.product.updated",
          entity: "product",
          entityId: product.id,
          payload: {
            productId: product.id,
            shopId: product.shopId,
            menuPageId: product.menuPageId,
            sellerId: product.shop.sellerId,
            name: product.name,
            priceMinor: product.priceMinor,
            updatedAt: toEventTimestamp(product.updatedAt),
          },
        }),
      });

      return {
        record: mapProduct(product),
        event: mapCatalogWriteEvent(event),
      };
    });
  }
}
