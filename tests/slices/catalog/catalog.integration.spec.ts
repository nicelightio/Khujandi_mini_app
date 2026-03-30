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
    const productFindMany = jest.fn().mockResolvedValue([]);
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
      },
      product: {
        findMany: productFindMany,
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
    const productFindMany = jest.fn().mockResolvedValue([
      {
        id: "product-1",
        shopId: "shop-1",
        name: "Somsa",
        priceMinor: 1500,
      },
    ]);
    const prisma = createPrismaProvider({
      shop: {
        findMany: shopFindMany,
      },
      product: {
        findMany: productFindMany,
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
});
