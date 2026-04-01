import { CatalogService } from "../../../backend/src/slices/catalog/application/catalog.service";
import type { CatalogRepository } from "../../../backend/src/slices/catalog/domain/catalog.types";
import { AppError } from "../../../backend/src/shared/errors/app-error";

const createRepository = (): CatalogRepository => ({
  listPublicShops: async () => [],
  listPublicProductsByShop: async () => [],
  findShopById: async () => null,
  updateShop: async () => {
    throw new Error("not implemented");
  },
  findProductById: async () => null,
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

  it("keeps the first rename free", async () => {
    const updateShop = jest.fn().mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "New name",
      renameCount: 1,
      requiresManualRenameReview: false,
      isDeleted: false,
    });
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
        id: "shop-1",
        sellerId: "seller-1",
        name: "Old name",
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

  it("marks repeated rename as manual paid review", async () => {
    const updateShop = jest.fn().mockResolvedValue({
      id: "shop-1",
      sellerId: "seller-1",
      name: "Newest name",
      renameCount: 2,
      requiresManualRenameReview: true,
      isDeleted: false,
    });
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
        id: "shop-1",
        sellerId: "seller-1",
        name: "Current name",
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
    const createProduct = jest.fn().mockResolvedValue({
      id: "product-1",
      shopId: "shop-1",
      name: "Somsa",
      priceMinor: 1500,
      isDeleted: false,
      sellerId: "seller-1",
    });
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
        id: "shop-1",
        sellerId: "seller-1",
        name: "Bakery",
        renameCount: 0,
        requiresManualRenameReview: false,
        isDeleted: false,
      }),
      createProduct,
    });

    await expect(
      service.createSellerProduct("seller-1", {
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
    expect(createProduct).toHaveBeenCalledWith({
      shopId: "shop-1",
      name: "Somsa",
      priceMinor: 1500,
    });
  });

  it("rejects product creation in another seller shop", async () => {
    const createProduct = jest.fn();
    const service = new CatalogService({
      ...createRepository(),
      findShopById: async () => ({
        id: "shop-2",
        sellerId: "seller-2",
        name: "Foreign shop",
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
        name: "Pilaf",
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
        name: "Somsa",
        priceMinor: 1500,
        isDeleted: false,
        sellerId: "seller-1",
      }),
      findShopById: async () => ({
        id: "shop-2",
        sellerId: "seller-2",
        name: "Foreign shop",
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
