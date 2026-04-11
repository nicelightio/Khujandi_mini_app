import { createCatalogModule } from "../../../backend/src/slices/catalog/presentation/catalog.module";
import { createPrismaProvider } from "../../../backend/src/shared/db/prisma-client";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";

const createPrismaMock = () => {
  const shopFindMany = jest.fn().mockResolvedValue([]);
  const shopFindUnique = jest.fn().mockResolvedValue(null);
  const shopCreate = jest.fn();
  const shopUpdate = jest.fn();
  const menuPageFindMany = jest.fn().mockResolvedValue([]);
  const menuPageFindUnique = jest.fn().mockResolvedValue(null);
  const menuPageCreate = jest.fn();
  const menuPageUpdate = jest.fn();
  const productFindMany = jest.fn().mockResolvedValue([]);
  const productFindUnique = jest.fn().mockResolvedValue(null);
  const productCreate = jest.fn();
  const productUpdate = jest.fn();
  const eventCreate = jest.fn().mockResolvedValue({
    id: 1n,
    type: "catalog.event",
    entity: "shop",
    entityId: "entity-1",
    payload: {},
    createdAt: new Date("2026-04-10T10:00:00.000Z"),
  });
  const sellerShopBindingCreate = jest.fn();
  const sellerShopBindingFindMany = jest.fn().mockResolvedValue([]);
  const client = {
    shop: {
      findMany: shopFindMany,
      findUnique: shopFindUnique,
      create: shopCreate,
      update: shopUpdate,
    },
    menuPage: {
      findMany: menuPageFindMany,
      findUnique: menuPageFindUnique,
      create: menuPageCreate,
      update: menuPageUpdate,
    },
    product: {
      findMany: productFindMany,
      findUnique: productFindUnique,
      create: productCreate,
      update: productUpdate,
    },
    sellerShopBinding: {
      findMany: sellerShopBindingFindMany,
      create: sellerShopBindingCreate,
    },
    event: {
      create: eventCreate,
    },
  };
  const transaction = jest.fn(async (callback: (transactionClient: typeof client) => Promise<unknown>) => callback(client));

  const prisma = createPrismaProvider({
    ...client,
    $transaction: transaction,
  } as never);

  return {
    prisma,
    mocks: {
      shopFindMany,
      shopFindUnique,
      shopCreate,
      shopUpdate,
      menuPageFindMany,
      menuPageFindUnique,
      menuPageCreate,
      menuPageUpdate,
      productFindMany,
      productFindUnique,
      productCreate,
      productUpdate,
      eventCreate,
      sellerShopBindingCreate,
      sellerShopBindingFindMany,
      transaction,
    },
  };
};

describe("catalog public browse integration", () => {
  it("reads public shops without auth and excludes non-working or soft-deleted rows", async () => {
    const { prisma, mocks } = createPrismaMock();
    mocks.shopFindMany.mockResolvedValue([
      {
        id: "shop-1",
        name: "Khujand Bakery",
      },
    ]);
    const context = createTestContext(prisma.client);
    const module = createCatalogModule(prisma);

    expect(context.prisma).toBe(prisma.client);
    await expect(module.controller.getShops()).resolves.toEqual([
      {
        id: "shop-1",
        name: "Khujand Bakery",
      },
    ]);
    expect(mocks.shopFindMany).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
        status: "WORKING",
      },
      select: {
        id: true,
        name: true,
      },
    });
  });

  it("reads public menu pages only for working shops", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.menuPageFindMany.mockResolvedValue([
      {
        id: "page-1",
        shopId: "shop-1",
        name: "Popular",
        position: 1,
      },
    ]);

    await expect(module.repository.listPublicMenuPagesByShop("shop-1")).resolves.toEqual([
      {
        id: "page-1",
        shopId: "shop-1",
        name: "Popular",
        position: 1,
      },
    ]);
    expect(mocks.menuPageFindMany).toHaveBeenCalledWith({
      where: {
        shopId: "shop-1",
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
  });

  it("reads public products only for visible shops and excludes soft-deleted rows", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.productFindMany.mockResolvedValue([
      {
        id: "product-1",
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa",
        priceMinor: 1500,
      },
    ]);

    await expect(module.controller.getProducts("shop-1")).resolves.toEqual([
      {
        id: "product-1",
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa",
        priceMinor: 1500,
      },
    ]);
    expect(mocks.productFindMany).toHaveBeenCalledWith({
      where: {
        shopId: "shop-1",
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
  });

  it("creates provisioning baseline shop with explicit status and rich media fields", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopCreate.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      description: "Fresh bread and pastries",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: "https://example.com/background.png",
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });

    await expect(
      module.repository.createShop({
        sellerId: "seller-1",
        name: "Bakery",
        description: "Fresh bread and pastries",
        headerImageUrl: "https://example.com/header.png",
        backgroundImageUrl: "https://example.com/background.png",
      }),
    ).resolves.toEqual({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      description: "Fresh bread and pastries",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: "https://example.com/background.png",
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    expect(mocks.shopCreate).toHaveBeenCalledWith({
      data: {
        sellerId: "seller-1",
        name: "Bakery",
        description: "Fresh bread and pastries",
        headerImageUrl: "https://example.com/header.png",
        backgroundImageUrl: "https://example.com/background.png",
        status: "WORKING",
      },
      select: {
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
      },
    });
  });

  it("creates seller binding records without leaking logic to shared", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.sellerShopBindingCreate.mockResolvedValue({
      id: "binding-1",
      shopId: "shop-1",
      sellerId: "seller-1",
      telegramId: "123456",
    });

    await expect(
      module.repository.createSellerShopBinding({
        shopId: "shop-1",
        sellerId: "seller-1",
        telegramId: "123456",
      }),
    ).resolves.toEqual({
      id: "binding-1",
      shopId: "shop-1",
      sellerId: "seller-1",
      telegramId: "123456",
    });
    expect(mocks.sellerShopBindingCreate).toHaveBeenCalledWith({
      data: {
        shopId: "shop-1",
        sellerId: "seller-1",
        telegramId: "123456",
      },
      select: {
        id: true,
        shopId: true,
        sellerId: true,
        telegramId: true,
      },
    });
  });

  it("resolves seller-owned shop reads through Telegram-linked bindings instead of raw client flags", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.sellerShopBindingFindMany.mockResolvedValue([
      {
        id: "binding-1",
        shopId: "shop-1",
        sellerId: "seller-1",
        telegramId: "telegram-1",
      },
    ]);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Owner Hidden Shop",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "NOT_WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });

    await expect(module.controller.getSellerShops("telegram-1")).resolves.toEqual([
      {
        id: "shop-1",
        sellerId: "seller-1",
        name: "Owner Hidden Shop",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "NOT_WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
        isDeleted: false,
      },
    ]);
    expect(mocks.sellerShopBindingFindMany).toHaveBeenCalledWith({
      where: {
        telegramId: "telegram-1",
      },
      select: {
        id: true,
        shopId: true,
        sellerId: true,
        telegramId: true,
      },
    });
  });

  it("creates starter menu pages within the catalog slice baseline", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.menuPageCreate.mockResolvedValue({
      id: "page-1",
      shopId: "shop-1",
      name: "Popular",
      position: 1,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
        status: "WORKING",
      },
    });

    await expect(
      module.repository.createMenuPage({
        shopId: "shop-1",
        name: "Popular",
        position: 1,
      }),
    ).resolves.toEqual({
      record: {
        id: "page-1",
        shopId: "shop-1",
        name: "Popular",
        position: 1,
        sellerId: "seller-1",
        shopStatus: "WORKING",
      },
      event: {
        type: "catalog.event",
        entity: "shop",
        entityId: "entity-1",
        payload: {},
        createdAt: "2026-04-10T10:00:00.000Z",
      },
    });
    expect(mocks.menuPageCreate).toHaveBeenCalledWith({
      data: {
        shopId: "shop-1",
        name: "Popular",
        position: 1,
      },
      select: {
        createdAt: true,
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
        updatedAt: true,
      },
    });
  });

  it("creates seller menu pages only inside owned shops", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.menuPageCreate.mockResolvedValue({
      id: "page-3",
      shopId: "shop-1",
      name: "Desserts",
      position: 3,
      createdAt: new Date("2026-04-10T10:01:00.000Z"),
      updatedAt: new Date("2026-04-10T10:01:00.000Z"),
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
        status: "WORKING",
      },
    });

    await expect(
      module.controller.createMenuPage("seller-1", {
        shopId: "shop-1",
        name: "Desserts",
        position: 3,
      }),
    ).resolves.toMatchObject({
      id: "page-3",
      shopId: "shop-1",
      name: "Desserts",
      position: 3,
      sellerId: "seller-1",
      shopStatus: "WORKING",
    });
    expect(mocks.menuPageCreate).toHaveBeenCalledWith({
      data: {
        shopId: "shop-1",
        name: "Desserts",
        position: 3,
      },
      select: {
        createdAt: true,
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
        updatedAt: true,
      },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: {
        type: "catalog.menu_page.created",
        entity: "menu_page",
        entityId: "page-3",
        payload: {
          menuPageId: "page-3",
          shopId: "shop-1",
          sellerId: "seller-1",
          position: 3,
          name: "Desserts",
          createdAt: "2026-04-10T10:01:00.000Z",
        },
      },
    });
  });

  it("renames owned menu pages without introducing delete semantics", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.menuPageFindUnique.mockResolvedValue({
      id: "page-1",
      shopId: "shop-1",
      name: "Popular",
      position: 1,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
        status: "WORKING",
      },
    });
    mocks.menuPageUpdate.mockResolvedValue({
      id: "page-1",
      shopId: "shop-1",
      name: "Hot Meals",
      position: 1,
      createdAt: new Date("2026-04-10T09:59:00.000Z"),
      updatedAt: new Date("2026-04-10T10:02:00.000Z"),
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
        status: "WORKING",
      },
    });

    await expect(
      module.controller.updateMenuPage("seller-1", "page-1", {
        shopId: "shop-1",
        name: "Hot Meals",
      }),
    ).resolves.toMatchObject({
      id: "page-1",
      shopId: "shop-1",
      name: "Hot Meals",
      position: 1,
      sellerId: "seller-1",
      shopStatus: "WORKING",
    });
    expect(mocks.menuPageUpdate).toHaveBeenCalledWith({
      where: {
        id: "page-1",
      },
      data: {
        shopId: "shop-1",
        name: "Hot Meals",
      },
      select: {
        createdAt: true,
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
        updatedAt: true,
      },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: {
        type: "catalog.menu_page.updated",
        entity: "menu_page",
        entityId: "page-1",
        payload: {
          menuPageId: "page-1",
          shopId: "shop-1",
          sellerId: "seller-1",
          position: 1,
          name: "Hot Meals",
          updatedAt: "2026-04-10T10:02:00.000Z",
        },
      },
    });
  });

  it("allows seller to rename only own shop and keeps the first rename free", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Old name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.shopUpdate.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "New name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 1,
      requiresManualRenameReview: false,
      isDeleted: false,
      updatedAt: new Date("2026-04-10T10:03:00.000Z"),
    });

    await expect(
      module.controller.updateShop("seller-1", "shop-1", { name: "New name" }),
    ).resolves.toMatchObject({
      id: "shop-1",
      sellerId: "seller-1",
      name: "New name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 1,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    expect(mocks.shopFindUnique).toHaveBeenCalledWith({
      where: {
        id: "shop-1",
      },
      select: {
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
      },
    });
    expect(mocks.shopUpdate).toHaveBeenCalledWith({
      where: {
        id: "shop-1",
      },
      data: {
        name: "New name",
        description: undefined,
        headerImageUrl: undefined,
        backgroundImageUrl: undefined,
        renameCount: 1,
        requiresManualRenameReview: false,
      },
      select: {
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
        updatedAt: true,
      },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: {
        type: "catalog.shop.updated",
        entity: "shop",
        entityId: "shop-1",
        payload: {
          shopId: "shop-1",
          sellerId: "seller-1",
          status: "WORKING",
          name: "New name",
          renameCount: 1,
          requiresManualRenameReview: false,
          updatedAt: "2026-04-10T10:03:00.000Z",
        },
      },
    });
  });

  it("updates owned shop metadata without spending rename allowance", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Current name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.shopUpdate.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Current name",
      description: "Updated description",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
      updatedAt: new Date("2026-04-10T10:04:00.000Z"),
    });

    await expect(
      module.controller.updateShop("seller-1", "shop-1", {
        name: "Current name",
        description: "Updated description",
        headerImageUrl: "https://example.com/header.png",
      }),
    ).resolves.toMatchObject({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Current name",
      description: "Updated description",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    expect(mocks.shopUpdate).toHaveBeenCalledWith({
      where: {
        id: "shop-1",
      },
      data: {
        name: "Current name",
        description: "Updated description",
        headerImageUrl: "https://example.com/header.png",
        backgroundImageUrl: undefined,
        renameCount: 0,
        requiresManualRenameReview: false,
      },
      select: {
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
        updatedAt: true,
      },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: {
        type: "catalog.shop.updated",
        entity: "shop",
        entityId: "shop-1",
        payload: {
          shopId: "shop-1",
          sellerId: "seller-1",
          status: "WORKING",
          name: "Current name",
          renameCount: 0,
          requiresManualRenameReview: false,
          updatedAt: "2026-04-10T10:04:00.000Z",
        },
      },
    });
  });

  it("updates owned shop status without consuming rename allowance", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Current name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.shopUpdate.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Current name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "NOT_WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
      updatedAt: new Date("2026-04-10T10:05:00.000Z"),
    });

    await expect(
      module.controller.updateShop("seller-1", "shop-1", {
        name: "Current name",
        status: "NOT_WORKING",
      }),
    ).resolves.toMatchObject({
      id: "shop-1",
      status: "NOT_WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
    });
    expect(mocks.shopUpdate).toHaveBeenCalledWith({
      where: {
        id: "shop-1",
      },
      data: {
        name: "Current name",
        description: undefined,
        headerImageUrl: undefined,
        backgroundImageUrl: undefined,
        status: "NOT_WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
      },
      select: {
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
        updatedAt: true,
      },
    });
  });

  it("rejects writes to another seller shop without mutation", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-2",
      name: "Old name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 1,
      requiresManualRenameReview: false,
      isDeleted: false,
    });

    await expect(
      module.controller.updateShop("seller-1", "shop-1", { name: "New name" }),
    ).rejects.toMatchObject({
      code: "SHOP_FORBIDDEN",
      statusCode: 403,
    });
    expect(mocks.shopUpdate).not.toHaveBeenCalled();
  });

  it("creates product only inside seller own shop", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.menuPageFindUnique.mockResolvedValue({
      id: "page-1",
      shopId: "shop-1",
      name: "Popular",
      position: 1,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
        status: "WORKING",
      },
    });
    mocks.productCreate.mockResolvedValue({
      id: "product-1",
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa",
      description: "Fresh and hot",
      imageUrl: "https://example.com/somsa.png",
      priceMinor: 1500,
      isDeleted: false,
      createdAt: new Date("2026-04-10T10:05:00.000Z"),
      updatedAt: new Date("2026-04-10T10:05:00.000Z"),
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
      },
    });

    await expect(
      module.controller.createProduct("seller-1", {
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa",
        description: "Fresh and hot",
        imageUrl: "https://example.com/somsa.png",
        priceMinor: 1500,
      }),
    ).resolves.toEqual({
      id: "product-1",
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa",
      description: "Fresh and hot",
      imageUrl: "https://example.com/somsa.png",
      priceMinor: 1500,
      isDeleted: false,
      sellerId: "seller-1",
    });
    expect(mocks.productCreate).toHaveBeenCalledWith({
      data: {
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa",
        description: "Fresh and hot",
        imageUrl: "https://example.com/somsa.png",
        priceMinor: 1500,
      },
      select: {
        id: true,
        shopId: true,
        menuPageId: true,
        name: true,
        description: true,
        imageUrl: true,
        priceMinor: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            sellerId: true,
            isDeleted: true,
          },
        },
      },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: {
        type: "catalog.product.created",
        entity: "product",
        entityId: "product-1",
        payload: {
          productId: "product-1",
          shopId: "shop-1",
          menuPageId: "page-1",
          sellerId: "seller-1",
          name: "Somsa",
          priceMinor: 1500,
          createdAt: "2026-04-10T10:05:00.000Z",
        },
      },
    });
  });

  it("updates owned product and emits an explicit catalog event", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.productFindUnique.mockResolvedValue({
      id: "product-1",
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa",
      description: "Fresh and hot",
      imageUrl: "https://example.com/somsa.png",
      priceMinor: 1500,
      isDeleted: false,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
      },
    });
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.menuPageFindUnique.mockResolvedValue({
      id: "page-1",
      shopId: "shop-1",
      name: "Popular",
      position: 1,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
        status: "WORKING",
      },
    });
    mocks.productUpdate.mockResolvedValue({
      id: "product-1",
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa XL",
      description: "Fresh and extra hot",
      imageUrl: "https://example.com/somsa-xl.png",
      priceMinor: 1800,
      isDeleted: false,
      createdAt: new Date("2026-04-10T09:55:00.000Z"),
      updatedAt: new Date("2026-04-10T10:06:00.000Z"),
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
      },
    });

    await expect(
      module.controller.updateProduct("seller-1", "product-1", {
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa XL",
        description: "Fresh and extra hot",
        imageUrl: "https://example.com/somsa-xl.png",
        priceMinor: 1800,
      }),
    ).resolves.toEqual({
      id: "product-1",
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa XL",
      description: "Fresh and extra hot",
      imageUrl: "https://example.com/somsa-xl.png",
      priceMinor: 1800,
      isDeleted: false,
      sellerId: "seller-1",
    });
    expect(mocks.productUpdate).toHaveBeenCalledWith({
      where: {
        id: "product-1",
      },
      data: {
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa XL",
        description: "Fresh and extra hot",
        imageUrl: "https://example.com/somsa-xl.png",
        priceMinor: 1800,
      },
      select: {
        id: true,
        shopId: true,
        menuPageId: true,
        name: true,
        description: true,
        imageUrl: true,
        priceMinor: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        shop: {
          select: {
            sellerId: true,
            isDeleted: true,
          },
        },
      },
    });
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: {
        type: "catalog.product.updated",
        entity: "product",
        entityId: "product-1",
        payload: {
          productId: "product-1",
          shopId: "shop-1",
          menuPageId: "page-1",
          sellerId: "seller-1",
          name: "Somsa XL",
          priceMinor: 1800,
          updatedAt: "2026-04-10T10:06:00.000Z",
        },
      },
    });
  });

  it("rejects product create when menu page ownership does not match the seller shop", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.menuPageFindUnique.mockResolvedValue({
      id: "page-foreign",
      shopId: "shop-2",
      name: "Foreign Page",
      position: 1,
      shop: {
        sellerId: "seller-2",
        isDeleted: false,
        status: "WORKING",
      },
    });

    await expect(
      module.controller.createProduct("seller-1", {
        shopId: "shop-1",
        menuPageId: "page-foreign",
        name: "Somsa",
        priceMinor: 1500,
      }),
    ).rejects.toMatchObject({
      code: "MENU_PAGE_FORBIDDEN",
      statusCode: 403,
    });
    expect(mocks.productCreate).not.toHaveBeenCalled();
  });

  it("rejects product create in another seller shop without mutation", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-2",
      sellerId: "seller-2",
      name: "Foreign shop",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });

    await expect(
      module.controller.createProduct("seller-1", {
        shopId: "shop-2",
        name: "Pilaf",
        priceMinor: 2200,
      }),
    ).rejects.toMatchObject({
      code: "SHOP_FORBIDDEN",
      statusCode: 403,
    });
    expect(mocks.productCreate).not.toHaveBeenCalled();
  });

  it("rejects product update outside seller ownership without mutation", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-2",
      sellerId: "seller-2",
      name: "Foreign shop",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.productFindUnique.mockResolvedValue({
      id: "product-2",
      shopId: "shop-2",
      menuPageId: null,
      name: "Pilaf",
      description: null,
      imageUrl: null,
      priceMinor: 2200,
      isDeleted: false,
      shop: {
        sellerId: "seller-2",
        isDeleted: false,
      },
    });

    await expect(
      module.controller.updateProduct("seller-1", "product-2", {
        shopId: "shop-2",
        name: "Pilaf XL",
        priceMinor: 2600,
      }),
    ).rejects.toMatchObject({
      code: "PRODUCT_FORBIDDEN",
      statusCode: 403,
    });
    expect(mocks.productUpdate).not.toHaveBeenCalled();
  });

  it("validates target shop linkage before product update", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindUnique.mockResolvedValue({
      id: "shop-2",
      sellerId: "seller-2",
      name: "Foreign shop",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.productFindUnique.mockResolvedValue({
      id: "product-1",
      shopId: "shop-1",
      menuPageId: null,
      name: "Somsa",
      description: null,
      imageUrl: null,
      priceMinor: 1500,
      isDeleted: false,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
      },
    });

    await expect(
      module.controller.updateProduct("seller-1", "product-1", {
        shopId: "shop-2",
        name: "Somsa XL",
        priceMinor: 1800,
      }),
    ).rejects.toMatchObject({
      code: "SHOP_FORBIDDEN",
      statusCode: 403,
    });
    expect(mocks.productUpdate).not.toHaveBeenCalled();
  });
});
