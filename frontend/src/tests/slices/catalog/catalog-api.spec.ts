import { createCatalogApi, type CatalogFetch } from "../../../slices/catalog/api/catalog-api";

describe("catalog api", () => {
  it("loads the public start showcase without auth headers", async () => {
    const fetchMock: CatalogFetch = jest.fn(async (input) => {
      if (input === "/api/v1/showcase") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            favoriteShops: [
              {
                id: "shop-1",
                name: "Khujand Bakery",
                publicPath: "khujand-bakery",
                description: "Fresh bread",
                headerImageUrl: null,
              },
            ],
            allKhujandLink: {
              label: "весь Худжанд",
              target: "/shops",
            },
            popularTodayProducts: [
              {
                id: "ref-product-1",
                productId: "product-1",
                shopId: "shop-1",
                shopPublicPath: "khujand-bakery",
                shopName: "Khujand Bakery",
                name: "Somsa",
                description: "Baked fresh today",
                imageUrl: "https://example.com/somsa.png",
                priceMinor: 1500,
                currency: "TJS",
                sortOrder: 1,
              },
            ],
          }),
        };
      }

      throw new Error(`Unexpected request: ${input}`);
    });

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getStartShowcase()).resolves.toEqual({
      favoriteShops: [
        {
          id: "shop-1",
          name: "Khujand Bakery",
          publicPath: "khujand-bakery",
          description: "Fresh bread",
          headerImageUrl: null,
        },
      ],
      allKhujandLink: {
        label: "весь Худжанд",
        target: "/shops",
      },
      popularTodayProducts: [
        {
          id: "ref-product-1",
          productId: "product-1",
          shopId: "shop-1",
          shopPublicPath: "khujand-bakery",
          shopName: "Khujand Bakery",
          name: "Somsa",
          description: "Baked fresh today",
          imageUrl: "https://example.com/somsa.png",
          priceMinor: 1500,
          currency: "TJS",
          sortOrder: 1,
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/showcase");
  });

  it("sends showcase admin curation writes with included credentials", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await api.addShowcaseProduct("product-1");
    await api.removeShowcaseProduct("product-1");
    await api.addShowcaseShop("shop-1");
    await api.removeShowcaseShop("shop-1");

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/admin/catalog/showcase/products/product-1", {
      method: "POST",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/admin/catalog/showcase/products/product-1", {
      method: "DELETE",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/v1/admin/catalog/showcase/shops/shop-1", {
      method: "POST",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(4, "/api/v1/admin/catalog/showcase/shops/shop-1", {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("fails closed for missing showcase admin read support", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: "NOT_FOUND" } }),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getShowcaseAdminState()).resolves.toEqual({ canCurate: false });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/catalog/showcase", {
      credentials: "include",
    });
  });

  it("loads public shops and products without auth headers", async () => {
    const fetchMock: CatalogFetch = jest.fn(async (input) => {
      if (input === "/api/v1/shops") {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "shop-1",
              name: "Khujand Bakery",
              publicPath: "khujand-bakery",
            },
          ],
        };
      }

      if (input === "/api/v1/shops/khujand-bakery/products") {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "product-1",
              shopId: "shop-1",
              name: "Somsa",
              priceMinor: 1500,
            },
          ],
        };
      }

      throw new Error(`Unexpected request: ${input}`);
    });

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.listCatalog()).resolves.toEqual([
      {
        id: "shop-1",
        name: "Khujand Bakery",
        publicPath: "khujand-bakery",
        products: [
          {
            id: "product-1",
            shopId: "shop-1",
            name: "Somsa",
            priceMinor: 1500,
          },
        ],
      },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/shops");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/shops/khujand-bakery/products");
  });

  it("loads canonical public storefront payloads for /shops/:publicPath", async () => {
    const fetchMock: CatalogFetch = jest.fn(async (input) => {
      if (input === "/api/v1/shops/khujand-bakery") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
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
                    description: "Baked fresh today",
                    imageUrl: "https://example.com/somsa.png",
                    priceMinor: 1500,
                  },
                ],
              },
            ],
            unpagedProducts: [
              {
                id: "product-legacy",
                shopId: "shop-1",
                menuPageId: null,
                name: "Legacy Pilaf",
                description: "Still missing a menu page",
                imageUrl: null,
                priceMinor: 2200,
              },
            ],
          }),
        };
      }

      throw new Error(`Unexpected request: ${input}`);
    });

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getPublicStorefront("khujand-bakery")).resolves.toEqual({
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
              description: "Baked fresh today",
              imageUrl: "https://example.com/somsa.png",
              priceMinor: 1500,
            },
          ],
        },
      ],
      unpagedProducts: [
        {
          id: "product-legacy",
          shopId: "shop-1",
          menuPageId: null,
          name: "Legacy Pilaf",
          description: "Still missing a menu page",
          imageUrl: null,
          priceMinor: 2200,
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/shops/khujand-bakery");
  });

  it("returns seller storefront access when the protected owner read succeeds", async () => {
    const fetchMock: CatalogFetch = jest.fn(async (input) => {
      if (input === "/api/v1/seller/shops/shop-1") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "shop-1",
            publicPath: "khujand-bakery",
            sellerId: "seller-1",
            name: "Khujand Bakery",
            description: "Fresh bread and pastries",
            headerImageUrl: "https://example.com/header.png",
            backgroundImageUrl: null,
            status: "WORKING",
            renameCount: 1,
            requiresManualRenameReview: false,
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
                    description: "Baked fresh today",
                    imageUrl: null,
                    priceMinor: 1500,
                  },
                ],
              },
            ],
            unpagedProducts: [
              {
                id: "product-legacy",
                shopId: "shop-1",
                menuPageId: null,
                name: "Legacy Pilaf",
                description: "Still missing a menu page",
                imageUrl: null,
                priceMinor: 2200,
              },
            ],
          }),
        };
      }

      throw new Error(`Unexpected request: ${input}`);
    });

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getSellerStorefrontAccess("shop-1")).resolves.toEqual({
      id: "shop-1",
      publicPath: "khujand-bakery",
      sellerId: "seller-1",
      name: "Khujand Bakery",
      description: "Fresh bread and pastries",
      headerImageUrl: "https://example.com/header.png",
      backgroundImageUrl: null,
      status: "WORKING",
      renameCount: 1,
      requiresManualRenameReview: false,
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
              description: "Baked fresh today",
              imageUrl: null,
              priceMinor: 1500,
            },
          ],
        },
      ],
      unpagedProducts: [
        {
          id: "product-legacy",
          shopId: "shop-1",
          menuPageId: null,
          name: "Legacy Pilaf",
          description: "Still missing a menu page",
          imageUrl: null,
          priceMinor: 2200,
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/seller/shops/shop-1", {
      credentials: "include",
    });
  });

  it("fails closed when seller storefront access is forbidden", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: { code: "FORBIDDEN" } }),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getSellerStorefrontAccess("shop-1")).resolves.toBeNull();
  });

  it("throws a controlled error when catalog fetch fails", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: { code: "INTERNAL_ERROR" } }),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.listCatalog()).rejects.toThrow("Catalog request failed with status 503.");
  });

  it("fails closed with null when the public storefront path is missing", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: "SHOP_NOT_FOUND" } }),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getPublicStorefront("missing-shop")).resolves.toBeNull();
  });

  it("rejects public browse payloads that fall back to technical shop ids", async () => {
    const fetchMock: CatalogFetch = jest.fn(async (input) => {
      if (input === "/api/v1/shops") {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "shop-1",
              name: "Khujand Bakery",
            },
          ],
        };
      }

      throw new Error(`Unexpected request: ${input}`);
    });

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.listCatalog()).rejects.toThrow("Catalog shop payload is invalid.");
  });

  it("rejects canonical storefront payloads that omit publicPath", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        shop: {
          id: "shop-1",
          name: "Khujand Bakery",
          description: "Fresh bread and pastries",
          headerImageUrl: null,
          backgroundImageUrl: null,
        },
        menuPages: [],
        unpagedProducts: [],
      }),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getPublicStorefront("khujand-bakery")).rejects.toThrow(
      "Public storefront payload is invalid.",
    );
  });

  it("rejects seller storefront payloads that omit alias-aware publicPath", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "shop-1",
        sellerId: "seller-1",
        name: "Khujand Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
        menuPages: [],
        unpagedProducts: [],
      }),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getSellerStorefrontAccess("khujand-bakery")).rejects.toThrow(
      "Seller storefront access payload is invalid.",
    );
  });

  it("sends seller write requests through the checked-in backend boundary", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await api.updateSellerProduct({
      productId: "product-1",
      shopId: "shop-1",
      menuPageId: "page-1",
      name: "Somsa Deluxe",
      description: "Buttery",
      imageUrl: null,
      priceMinor: 1800,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/seller/products/product-1", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shopId: "shop-1",
        menuPageId: "page-1",
        name: "Somsa Deluxe",
        description: "Buttery",
        imageUrl: null,
        priceMinor: 1800,
      }),
    });
  });

  it("accepts canonical seller storefront payloads with legacy unpaged products", async () => {
    const fetchMock: CatalogFetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        id: "shop-legacy",
        publicPath: "legacy-bakery",
        sellerId: "seller-legacy",
        name: "Legacy Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        status: "WORKING",
        renameCount: 0,
        requiresManualRenameReview: false,
        menuPages: [],
        unpagedProducts: [
          {
            id: "product-legacy-1",
            shopId: "shop-legacy",
            menuPageId: null,
            name: "Legacy Somsa",
            description: null,
            imageUrl: null,
            priceMinor: 1500,
          },
        ],
      }),
    }));

    const api = createCatalogApi({ fetch: fetchMock });

    await expect(api.getSellerStorefrontAccess("shop-legacy")).resolves.toEqual(
      expect.objectContaining({
        id: "shop-legacy",
        publicPath: "legacy-bakery",
        menuPages: [],
        unpagedProducts: [
          expect.objectContaining({
            id: "product-legacy-1",
            menuPageId: null,
            name: "Legacy Somsa",
          }),
        ],
      }),
    );
  });
});
