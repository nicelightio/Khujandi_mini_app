import { CatalogService } from "../../../backend/src/slices/catalog/application/catalog.service";
import {
  buildProvisioningTemplateBlueprint,
  type CatalogRepository,
} from "../../../backend/src/slices/catalog/domain/catalog.types";
import { AppError } from "../../../backend/src/shared/errors/app-error";

const withWriteEvent = <TRecord>(record: TRecord) => ({
  record,
  event: {
    type: "catalog.test",
    entity: "shop" as const,
    entityId: "entity-1",
    payload: {},
    createdAt: "2026-04-10T10:00:00.000Z",
  },
});

const createRepository = (): CatalogRepository => ({
  listPublicShops: async () => [],
  listPublicMenuPagesByShop: async () => [],
  listPublicProductsByShop: async () => [],
  listSellerBindingsByTelegramId: async () => [],
  findShopById: async () => null,
  createShop: async () => {
    throw new Error("not implemented");
  },
  updateShop: async () => {
    throw new Error("not implemented");
  },
  findMenuPageById: async () => null,
  createMenuPage: async () => {
    throw new Error("not implemented");
  },
  updateMenuPage: async () => {
    throw new Error("not implemented");
  },
  findProductById: async () => null,
  createSellerShopBinding: async () => {
    throw new Error("not implemented");
  },
  provisionSellerShop: async () => {
    throw new Error("not implemented");
  },
  createProduct: async () => {
    throw new Error("not implemented");
  },
  updateProduct: async () => {
    throw new Error("not implemented");
  },
});

describe("catalog service", () => {
  it("keeps public browse behavior behind the owning repository boundary", async () => {
    const service = new CatalogService(createRepository());

    await expect(service.listPublicShops()).resolves.toEqual([]);
    await expect(service.listPublicProductsByShop("shop-1")).resolves.toEqual([]);
  });

  it("builds a default provisioning blueprint with starter pages and products", () => {
    expect(buildProvisioningTemplateBlueprint()).toEqual({
      shopStatus: "WORKING",
      menuPages: [
        {
          name: "Popular",
          position: 1,
        },
        {
          name: "Drinks",
          position: 2,
        },
      ],
      products: [
        {
          pageName: "Popular",
          name: "Starter Dish",
          description: "Edit this product after admin provisioning.",
          priceMinor: 1000,
        },
        {
          pageName: "Drinks",
          name: "Starter Drink",
          description: "Replace this placeholder with a real menu item.",
          priceMinor: 500,
        },
      ],
    });
  });

  it("resolves seller-owned shops from Telegram-linked bindings and keeps not-working shops visible to the owner", async () => {
    const service = new CatalogService({
      ...createRepository(),
      listSellerBindingsByTelegramId: async () => [
        {
          id: "binding-1",
          shopId: "shop-1",
          sellerId: "seller-1",
          telegramId: "telegram-1",
        },
      ],
      findShopById: async () => ({
        id: "shop-1",
        sellerId: "seller-1",
        name: "Hidden From Public",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "NOT_WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
        isDeleted: false,
      }),
    });

    await expect(service.listSellerShopsByTelegramId(" telegram-1 ")).resolves.toEqual([
      {
        id: "shop-1",
        sellerId: "seller-1",
        name: "Hidden From Public",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "NOT_WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
        isDeleted: false,
      },
    ]);
  });

  it("fails closed when the authenticated Telegram user has no seller binding", async () => {
    const service = new CatalogService(createRepository());

    await expect(service.listSellerShopsByTelegramId("telegram-404")).rejects.toEqual(
      new AppError("FORBIDDEN", "Seller access is not provisioned for this Telegram account", 403, {
        telegramId: "telegram-404",
      }),
    );
  });

  it("fails closed when binding ownership drifts away from shop.sellerId", async () => {
    const service = new CatalogService({
      ...createRepository(),
      listSellerBindingsByTelegramId: async () => [
        {
          id: "binding-1",
          shopId: "shop-1",
          sellerId: "seller-1",
          telegramId: "telegram-1",
        },
      ],
      findShopById: async () => ({
        id: "shop-1",
        sellerId: "seller-drifted",
        name: "Drifted Shop",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
        isDeleted: false,
      }),
    });

    await expect(service.listSellerShopsByTelegramId("telegram-1")).rejects.toEqual(
      new AppError("FORBIDDEN", "Seller access is not provisioned for this Telegram account", 403, {
        telegramId: "telegram-1",
      }),
    );
  });

  it("keeps the first rename free", async () => {
    const updateShop = jest.fn().mockResolvedValue(withWriteEvent({
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
    }));
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
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
      }),
      updateShop,
    });

    await expect(
      service.updateSellerShop("seller-1", "shop-1", { name: "New name" }),
    ).resolves.toEqual({
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
    expect(updateShop).toHaveBeenCalledWith("shop-1", {
      name: "New name",
      renameCount: 1,
      requiresManualRenameReview: false,
    });
  });

  it("updates owned shop metadata without consuming the rename allowance", async () => {
    const updateShop = jest.fn().mockResolvedValue(withWriteEvent({
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
    }));
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
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
      }),
      updateShop,
    });

    await expect(
      service.updateSellerShop("seller-1", "shop-1", {
        name: "Current name",
        description: "Updated description",
        headerImageUrl: "https://example.com/header.png",
      }),
    ).resolves.toEqual({
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
    expect(updateShop).toHaveBeenCalledWith("shop-1", {
      name: "Current name",
      description: "Updated description",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: undefined,
      renameCount: 0,
      requiresManualRenameReview: false,
    });
  });

  it("updates owned shop status without consuming the rename allowance", async () => {
    const updateShop = jest.fn().mockResolvedValue(withWriteEvent({
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
    }));
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
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
      }),
      updateShop,
    });

    await expect(
      service.updateSellerShop("seller-1", "shop-1", {
        name: "Current name",
        status: "NOT_WORKING",
      }),
    ).resolves.toMatchObject({
      id: "shop-1",
      status: "NOT_WORKING",
      renameCount: 0,
    });
    expect(updateShop).toHaveBeenCalledWith("shop-1", {
      name: "Current name",
      status: "NOT_WORKING",
      renameCount: 0,
      requiresManualRenameReview: false,
    });
  });

  it("provisions a seller shop with the default starter blueprint", async () => {
    const provisionSellerShop = jest.fn().mockResolvedValue({
      shop: {
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
      },
      binding: {
        id: "binding-1",
        shopId: "shop-1",
        sellerId: "seller-1",
        telegramId: "123456",
      },
      menuPages: [],
      products: [],
    });
    const service = new CatalogService({
      ...createRepository(),
      provisionSellerShop,
    });

    await expect(
      service.provisionSellerShop({
        sellerId: " seller-1 ",
        telegramId: " 123456 ",
        name: " Bakery ",
      }),
    ).resolves.toMatchObject({
      shop: {
        id: "shop-1",
        sellerId: "seller-1",
      },
      binding: {
        telegramId: "123456",
      },
    });
    expect(provisionSellerShop).toHaveBeenCalledWith({
      sellerId: "seller-1",
      telegramId: "123456",
      name: "Bakery",
      description: undefined,
      headerImageUrl: undefined,
      backgroundImageUrl: undefined,
      status: undefined,
      blueprint: buildProvisioningTemplateBlueprint(),
    });
  });

  it("rejects provisioning when seller identity inputs are blank", async () => {
    const service = new CatalogService(createRepository());

    await expect(
      service.provisionSellerShop({
        sellerId: " ",
        telegramId: "123456",
        name: "Bakery",
      }),
    ).rejects.toEqual(
      new AppError("VALIDATION_ERROR", "Provisioning requires sellerId, telegramId, and shop name", 400),
    );
  });

  it("maps repository uniqueness conflicts into a controlled provisioning error", async () => {
    const service = new CatalogService({
      ...createRepository(),
      provisionSellerShop: async () => {
        const error = new Error("duplicate");
        Object.assign(error, { code: "P2002" });
        throw error;
      },
    });

    await expect(
      service.provisionSellerShop({
        sellerId: "seller-1",
        telegramId: "123456",
        name: "Bakery",
      }),
    ).rejects.toEqual(
      new AppError(
        "SHOP_PROVISIONING_CONFLICT",
        "Shop provisioning conflicts with an existing seller binding or shop record",
        409,
      ),
    );
  });

  it("marks repeated rename as manual paid review", async () => {
    const updateShop = jest.fn().mockResolvedValue(withWriteEvent({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Newest name",
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 2,
      requiresManualRenameReview: true,
      isDeleted: false,
    }));
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
        id: "shop-1",
        sellerId: "seller-1",
        name: "Current name",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
        renameCount: 1,
        requiresManualRenameReview: false,
        isDeleted: false,
      }),
      updateShop,
    });

    await service.updateSellerShop("seller-1", "shop-1", { name: "Newest name" });

    expect(updateShop).toHaveBeenCalledWith("shop-1", {
      name: "Newest name",
      renameCount: 2,
      requiresManualRenameReview: true,
    });
  });

  it("rejects non-owner shop writes", async () => {
    const updateShop = jest.fn();
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
        id: "shop-1",
        sellerId: "seller-2",
        name: "Current name",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
        isDeleted: false,
      }),
      updateShop,
    });

    await expect(
      service.updateSellerShop("seller-1", "shop-1", { name: "New name" }),
    ).rejects.toEqual(
      new AppError("SHOP_FORBIDDEN", "Seller cannot modify this shop", 403, {
        sellerId: "seller-1",
        shopId: "shop-1",
      }),
    );
    expect(updateShop).not.toHaveBeenCalled();
  });

  it("creates product only inside seller own shop", async () => {
    const createProduct = jest.fn().mockResolvedValue(withWriteEvent({
      id: "product-1",
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa",
      description: "Fresh and hot",
      imageUrl: "https://example.com/somsa.png",
      priceMinor: 1500,
      isDeleted: false,
      sellerId: "seller-1",
    }));
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
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
      }),
      findMenuPageById: async () => ({
        id: "page-1",
        shopId: "shop-1",
        name: "Popular",
        position: 1,
        sellerId: "seller-1",
        shopStatus: "WORKING",
      }),
      createProduct,
    });

    await expect(
      service.createSellerProduct("seller-1", {
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
    expect(createProduct).toHaveBeenCalledWith({
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa",
      description: "Fresh and hot",
      imageUrl: "https://example.com/somsa.png",
      priceMinor: 1500,
    });
  });

  it("creates menu page only inside seller own shop", async () => {
    const createMenuPage = jest.fn().mockResolvedValue(withWriteEvent({
      id: "page-1",
      shopId: "shop-1",
      name: "New Page",
      position: 3,
      sellerId: "seller-1",
      shopStatus: "WORKING",
    }));
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
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
      }),
      createMenuPage,
    });

    await expect(
      service.createSellerMenuPage("seller-1", {
        shopId: "shop-1",
        name: "New Page",
        position: 3,
      }),
    ).resolves.toEqual({
      id: "page-1",
      shopId: "shop-1",
      name: "New Page",
      position: 3,
      sellerId: "seller-1",
      shopStatus: "WORKING",
    });
    expect(createMenuPage).toHaveBeenCalledWith({
      shopId: "shop-1",
      name: "New Page",
      position: 3,
    });
  });

  it("renames owned menu page without exposing delete semantics", async () => {
    const updateMenuPage = jest.fn().mockResolvedValue(withWriteEvent({
      id: "page-1",
      shopId: "shop-1",
      name: "Hot Meals",
      position: 1,
      sellerId: "seller-1",
      shopStatus: "WORKING",
    }));
    const service = new CatalogService({
      ...createRepository(),
      findMenuPageById: async () => ({
        id: "page-1",
        shopId: "shop-1",
        name: "Popular",
        position: 1,
        sellerId: "seller-1",
        shopStatus: "WORKING",
      }),
      updateMenuPage,
    });

    await expect(
      service.updateSellerMenuPage("seller-1", "page-1", {
        shopId: "shop-1",
        name: "Hot Meals",
      }),
    ).resolves.toEqual({
      id: "page-1",
      shopId: "shop-1",
      name: "Hot Meals",
      position: 1,
      sellerId: "seller-1",
      shopStatus: "WORKING",
    });
    expect(updateMenuPage).toHaveBeenCalledWith("page-1", {
      shopId: "shop-1",
      name: "Hot Meals",
    });
  });

  it("rejects menu page rename outside seller ownership", async () => {
    const updateMenuPage = jest.fn();
    const service = new CatalogService({
      ...createRepository(),
      findMenuPageById: async () => ({
        id: "page-foreign",
        shopId: "shop-2",
        name: "Popular",
        position: 1,
        sellerId: "seller-2",
        shopStatus: "WORKING",
      }),
      updateMenuPage,
    });

    await expect(
      service.updateSellerMenuPage("seller-1", "page-foreign", {
        shopId: "shop-2",
        name: "Hot Meals",
      }),
    ).rejects.toEqual(
      new AppError("MENU_PAGE_FORBIDDEN", "Seller cannot modify this menu page", 403, {
        sellerId: "seller-1",
        menuPageId: "page-foreign",
        shopId: "shop-2",
      }),
    );
    expect(updateMenuPage).not.toHaveBeenCalled();
  });

  it("rejects product writes when the menu page belongs to another seller shop", async () => {
    const createProduct = jest.fn();
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
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
      }),
      findMenuPageById: async () => ({
        id: "page-foreign",
        shopId: "shop-2",
        name: "Foreign Page",
        position: 1,
        sellerId: "seller-2",
        shopStatus: "WORKING",
      }),
      createProduct,
    });

    await expect(
      service.createSellerProduct("seller-1", {
        shopId: "shop-1",
        menuPageId: "page-foreign",
        name: "Somsa",
        priceMinor: 1500,
      }),
    ).rejects.toEqual(
      new AppError("MENU_PAGE_FORBIDDEN", "Seller cannot modify this menu page", 403, {
        sellerId: "seller-1",
        menuPageId: "page-foreign",
        shopId: "shop-1",
      }),
    );
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("rejects product creation in another seller shop", async () => {
    const createProduct = jest.fn();
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
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
      }),
      createProduct,
    });

    await expect(
      service.createSellerProduct("seller-1", {
        shopId: "shop-2",
        name: "Pilaf",
        priceMinor: 2200,
      }),
    ).rejects.toEqual(
      new AppError("SHOP_FORBIDDEN", "Seller cannot modify this shop", 403, {
        sellerId: "seller-1",
        shopId: "shop-2",
      }),
    );
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("rejects updates to another seller product", async () => {
    const updateProduct = jest.fn();
    const service = new CatalogService({
      ...createRepository(),
      findProductById: async () => ({
        id: "product-2",
        shopId: "shop-2",
        menuPageId: null,
        name: "Pilaf",
        description: null,
        imageUrl: null,
        priceMinor: 2200,
        isDeleted: false,
        sellerId: "seller-2",
      }),
      updateProduct,
    });

    await expect(
      service.updateSellerProduct("seller-1", "product-2", {
        shopId: "shop-2",
        name: "Pilaf XL",
        priceMinor: 2600,
      }),
    ).rejects.toEqual(
      new AppError("PRODUCT_FORBIDDEN", "Seller cannot modify this product", 403, {
        sellerId: "seller-1",
        productId: "product-2",
      }),
    );
    expect(updateProduct).not.toHaveBeenCalled();
  });

  it("validates target shop linkage before updating product", async () => {
    const updateProduct = jest.fn();
    const service = new CatalogService({
      ...createRepository(),
      findProductById: async () => ({
        id: "product-1",
        shopId: "shop-1",
        menuPageId: null,
        name: "Somsa",
        description: null,
        imageUrl: null,
        priceMinor: 1500,
        isDeleted: false,
        sellerId: "seller-1",
      }),
      findShopById: async () => ({
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
      }),
      updateProduct,
    });

    await expect(
      service.updateSellerProduct("seller-1", "product-1", {
        shopId: "shop-2",
        name: "Somsa XL",
        priceMinor: 1800,
      }),
    ).rejects.toEqual(
      new AppError("SHOP_FORBIDDEN", "Seller cannot modify this shop", 403, {
        sellerId: "seller-1",
        shopId: "shop-2",
      }),
    );
    expect(updateProduct).not.toHaveBeenCalled();
  });
});
