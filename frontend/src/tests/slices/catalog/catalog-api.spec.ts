import { createCatalogApi, type CatalogFetch } from "../../../slices/catalog/api/catalog-api";

describe("catalog api", () => {
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
            },
          ],
        };
      }

      if (input === "/api/v1/shops/shop-1/products") {
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
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/shops/shop-1/products");
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
});
