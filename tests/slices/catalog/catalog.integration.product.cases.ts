import { createCatalogModule } from "../../../backend/src/slices/catalog/presentation/catalog.module";
import { createPrismaMock } from "./catalog.integration.test-helpers";

export const registerCatalogProductWriteIntegrationCases = () => {
  describe("seller product writes", () => {
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
};
