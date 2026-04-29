import { createCatalogModule } from "../../../backend/src/slices/catalog/presentation/catalog.module";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";
import { registerCatalogProductWriteIntegrationCases } from "./catalog.integration.product.cases";
import { createPrismaMock } from "./catalog.integration.test-helpers";

describe("catalog public browse integration", () => {
  it("reads public shops without auth and excludes non-working or soft-deleted rows", async () => {
    const { prisma, mocks } = createPrismaMock();
    mocks.shopFindMany.mockResolvedValue([
      {
        id: "shop-1",
        name: "Khujand Bakery",
        secondaryPublicPath: "khujand-bakery",
      },
    ]);
    const context = createTestContext(prisma.client);
    const module = createCatalogModule(prisma);

    expect(context.prisma).toBe(prisma.client);
    await expect(module.controller.getShops()).resolves.toEqual([
      {
        id: "shop-1",
        name: "Khujand Bakery",
        publicPath: "khujand-bakery",
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
        primaryPublicPath: true,
        secondaryPublicPath: true,
      },
    });
  });

  it("reads a canonical public storefront payload by either immutable public path alias", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindFirst.mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Khujand Bakery",
      primaryPublicPath: "seller-11",
      secondaryPublicPath: "khujand-bakery",
      description: "Fresh bread and pastries",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: "https://example.com/background.png",
      status: "WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    mocks.menuPageFindMany.mockResolvedValue([
      {
        id: "page-1",
        shopId: "shop-1",
        name: "Popular",
        position: 1,
      },
    ]);
    mocks.productFindMany.mockResolvedValue([
      {
        id: "product-1",
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa",
        description: "Fresh and hot",
        imageUrl: "https://example.com/somsa.png",
        priceMinor: 1500,
      },
    ]);

    await expect(module.controller.getStorefront("seller-11")).resolves.toEqual({
      shop: {
        id: "shop-1",
        name: "Khujand Bakery",
        publicPath: "khujand-bakery",
        description: "Fresh bread and pastries",
        headerImageUrl: "https://example.com/header.png",
        backgroundImageUrl: "https://example.com/background.png",
      },
      menuPages: [
        {
          id: "page-1",
          shopId: "shop-1",
          name: "Popular",
          position: 1,
          products: [
            {
              id: "product-1",
              shopId: "shop-1",
              menuPageId: "page-1",
              name: "Somsa",
              description: "Fresh and hot",
              imageUrl: "https://example.com/somsa.png",
              priceMinor: 1500,
            },
          ],
        },
      ],
      unpagedProducts: [],
    });
    expect(mocks.shopFindFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ primaryPublicPath: "seller-11" }, { secondaryPublicPath: "seller-11" }],
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
    });
  });

  it("reads admin provisioning summaries from catalog persistence including not-working shops", async () => {
    const { prisma, mocks } = createPrismaMock();
    const module = createCatalogModule(prisma);
    mocks.shopFindMany.mockResolvedValue([
      {
        id: "shop-1",
        name: "Night Bakery",
        sellerId: "seller-1",
        status: "NOT_WORKING",
        primaryPublicPath: "seller-11",
        secondaryPublicPath: "night-bakery",
        sellerBindings: [
          {
            telegramId: "1042",
          },
        ],
      },
    ]);

    await expect(module.controller.getAdminProvisionedShops()).resolves.toEqual([
      {
        shopId: "shop-1",
        shopName: "Night Bakery",
        status: "NOT_WORKING",
        sellerId: "seller-1",
        telegramId: "1042",
        primaryPublicPath: "seller-11",
        secondaryPublicPath: "night-bakery",
      },
    ]);
    expect(mocks.shopFindMany).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        sellerId: true,
        status: true,
        primaryPublicPath: true,
        secondaryPublicPath: true,
        sellerBindings: {
          select: {
            telegramId: true,
          },
        },
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
        description: "Fresh and hot",
        imageUrl: "https://example.com/somsa.png",
        priceMinor: 1500,
      },
    ]);

    await expect(module.controller.getProducts("shop-1")).resolves.toEqual([
      {
        id: "product-1",
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa",
        description: "Fresh and hot",
        imageUrl: "https://example.com/somsa.png",
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
        description: true,
        imageUrl: true,
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
        primaryPublicPath: "seller-11",
        secondaryPublicPath: "bakery",
        description: "Fresh bread and pastries",
        headerImageUrl: "https://example.com/header.png",
        backgroundImageUrl: "https://example.com/background.png",
        status: "WORKING",
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
        primaryPublicPath: true,
        secondaryPublicPath: true,
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

  it("maps durable rename uniqueness conflicts to a controlled 409 business error", async () => {
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
    mocks.shopUpdate.mockRejectedValue(Object.assign(new Error("Unique constraint failed"), { code: "P2002" }));

    await expect(module.controller.updateShop("seller-1", "shop-1", { name: "Taken name" })).rejects.toMatchObject({
      code: "SHOP_RENAME_CONFLICT",
      message: "Shop rename conflicts with another shop owned by this seller",
      statusCode: 409,
    });
    expect(mocks.eventCreate).not.toHaveBeenCalled();
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
        status: undefined,
        renameCount: 0,
        requiresManualRenameReview: false,
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
        primaryPublicPath: true,
        secondaryPublicPath: true,
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

  registerCatalogProductWriteIntegrationCases();
});
