import { createCatalogModule } from "../../../backend/src/slices/catalog/presentation/catalog.module";
import { createPrismaProvider } from "../../../backend/src/shared/db/prisma-client";
import { createTestContext } from "../../../backend/src/shared/testing/create-test-context";

describe("catalog public browse integration", () => {
  it("reads public shops without auth and excludes soft-deleted rows", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([
      {
        id: "shop-1",
        name: "Khujand Bakery",
      },
    ]);
    const shopFindUnique = jest.fn().mockResolvedValue(null);
    const shopUpdate = jest.fn();
    const productFindMany = jest.fn().mockResolvedValue([]);
    const productFindUnique = jest.fn().mockResolvedValue(null);
    const productCreate = jest.fn();
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const context = createTestContext(prisma.client);
    const module = createCatalogModule(prisma);

    expect(context.prisma).toBe(prisma.client);
    await expect(module.controller.getShops()).resolves.toEqual([
      {
        id: "shop-1",
        name: "Khujand Bakery",
      },
    ]);
    expect(shopFindMany).toHaveBeenCalledWith({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
      },
    });
  });

  it("reads public products only for visible shops and excludes soft-deleted rows", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([]);
    const shopFindUnique = jest.fn().mockResolvedValue(null);
    const shopUpdate = jest.fn();
    const productFindMany = jest.fn().mockResolvedValue([
      {
        id: "product-1",
        shopId: "shop-1",
        name: "Somsa",
        priceMinor: 1500,
      },
    ]);
    const productFindUnique = jest.fn().mockResolvedValue(null);
    const productCreate = jest.fn();
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const module = createCatalogModule(prisma);

    await expect(module.controller.getProducts("shop-1")).resolves.toEqual([
      {
        id: "product-1",
        shopId: "shop-1",
        name: "Somsa",
        priceMinor: 1500,
      },
    ]);
    expect(productFindMany).toHaveBeenCalledWith({
      where: {
        shopId: "shop-1",
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
  });

  it("allows seller to rename only own shop and keeps the first rename free", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([]);
    const productFindMany = jest.fn().mockResolvedValue([]);
    const shopFindUnique = jest.fn().mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Old name",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const shopUpdate = jest.fn().mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "New name",
      renameCount: 1,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const productFindUnique = jest.fn().mockResolvedValue(null);
    const productCreate = jest.fn();
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const module = createCatalogModule(prisma);

    await expect(
      module.controller.updateShop("seller-1", "shop-1", { name: "New name" }),
    ).resolves.toEqual({
      id: "shop-1",
      sellerId: "seller-1",
      name: "New name",
      renameCount: 1,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    expect(shopFindUnique).toHaveBeenCalledWith({
      where: {
        id: "shop-1",
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
    expect(shopUpdate).toHaveBeenCalledWith({
      where: {
        id: "shop-1",
      },
      data: {
        name: "New name",
        renameCount: 1,
        requiresManualRenameReview: false,
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
  });

  it("rejects writes to another seller shop without mutation", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([]);
    const productFindMany = jest.fn().mockResolvedValue([]);
    const shopFindUnique = jest.fn().mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-2",
      name: "Old name",
      renameCount: 1,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const shopUpdate = jest.fn();
    const productFindUnique = jest.fn().mockResolvedValue(null);
    const productCreate = jest.fn();
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const module = createCatalogModule(prisma);

    await expect(
      module.controller.updateShop("seller-1", "shop-1", { name: "New name" }),
    ).rejects.toMatchObject({
      code: "SHOP_FORBIDDEN",
      statusCode: 403,
    });
    expect(shopUpdate).not.toHaveBeenCalled();
  });

  it("creates product only inside seller own shop", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([]);
    const shopFindUnique = jest.fn().mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Bakery",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const shopUpdate = jest.fn();
    const productFindMany = jest.fn().mockResolvedValue([]);
    const productFindUnique = jest.fn().mockResolvedValue(null);
    const productCreate = jest.fn().mockResolvedValue({
      id: "product-1",
      shopId: "shop-1",
      name: "Somsa",
      priceMinor: 1500,
      isDeleted: false,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
      },
    });
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const module = createCatalogModule(prisma);

    await expect(
      module.controller.createProduct("seller-1", {
        shopId: "shop-1",
        name: "Somsa",
        priceMinor: 1500,
      }),
    ).resolves.toEqual({
      id: "product-1",
      shopId: "shop-1",
      name: "Somsa",
      priceMinor: 1500,
      isDeleted: false,
      sellerId: "seller-1",
    });
    expect(productCreate).toHaveBeenCalledWith({
      data: {
        shopId: "shop-1",
        name: "Somsa",
        priceMinor: 1500,
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
  });

  it("rejects product create in another seller shop without mutation", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([]);
    const shopFindUnique = jest.fn().mockResolvedValue({
      id: "shop-2",
      sellerId: "seller-2",
      name: "Foreign shop",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const shopUpdate = jest.fn();
    const productFindMany = jest.fn().mockResolvedValue([]);
    const productFindUnique = jest.fn().mockResolvedValue(null);
    const productCreate = jest.fn();
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const module = createCatalogModule(prisma);

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
    expect(productCreate).not.toHaveBeenCalled();
  });

  it("rejects product update outside seller ownership without mutation", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([]);
    const shopFindUnique = jest.fn().mockResolvedValue({
      id: "shop-2",
      sellerId: "seller-2",
      name: "Foreign shop",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const shopUpdate = jest.fn();
    const productFindMany = jest.fn().mockResolvedValue([]);
    const productFindUnique = jest.fn().mockResolvedValue({
      id: "product-2",
      shopId: "shop-2",
      name: "Pilaf",
      priceMinor: 2200,
      isDeleted: false,
      shop: {
        sellerId: "seller-2",
        isDeleted: false,
      },
    });
    const productCreate = jest.fn();
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const module = createCatalogModule(prisma);

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
    expect(productUpdate).not.toHaveBeenCalled();
  });

  it("validates target shop linkage before product update", async () => {
    const shopFindMany = jest.fn().mockResolvedValue([]);
    const shopFindUnique = jest.fn().mockResolvedValue({
      id: "shop-2",
      sellerId: "seller-2",
      name: "Foreign shop",
      renameCount: 0,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const shopUpdate = jest.fn();
    const productFindMany = jest.fn().mockResolvedValue([]);
    const productFindUnique = jest.fn().mockResolvedValue({
      id: "product-1",
      shopId: "shop-1",
      name: "Somsa",
      priceMinor: 1500,
      isDeleted: false,
      shop: {
        sellerId: "seller-1",
        isDeleted: false,
      },
    });
    const productCreate = jest.fn();
    const productUpdate = jest.fn();
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
        findUnique: shopFindUnique,
        update: shopUpdate,
      },
      product: {
        findMany: productFindMany,
        findUnique: productFindUnique,
        create: productCreate,
        update: productUpdate,
      },
    });
    const module = createCatalogModule(prisma);

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
    expect(productUpdate).not.toHaveBeenCalled();
  });
});
