import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
} from "../../../slices/catalog/model/catalog-view-model";

describe("catalog view model", () => {
  it("creates a loading state for public browse", () => {
    expect(createLoadingCatalogViewModel()).toEqual({
      headline: "Catalog",
      statusLabel: "Loading shops and products...",
      shops: [],
      isLoading: true,
      errorMessage: null,
      isEmpty: false,
    });
  });

  it("creates an empty state when no shops are visible", () => {
    expect(createCatalogViewModel([])).toEqual({
      headline: "Catalog",
      statusLabel: "No shops are available right now.",
      shops: [],
      isLoading: false,
      errorMessage: null,
      isEmpty: true,
    });
  });

  it("creates ready state sections with product prices and per-shop empty labels", () => {
    expect(
      createCatalogViewModel([
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
        {
          id: "shop-2",
          name: "Tea Corner",
          products: [],
        },
      ]),
    ).toEqual({
      headline: "Catalog",
      statusLabel: "2 shops available for browsing.",
      shops: [
        {
          id: "shop-1",
          name: "Khujand Bakery",
          products: [
            {
              id: "product-1",
              name: "Somsa",
              priceLabel: "15.00 TJS",
            },
          ],
          emptyLabel: null,
        },
        {
          id: "shop-2",
          name: "Tea Corner",
          products: [],
          emptyLabel: "No products are available in this shop yet.",
        },
      ],
      isLoading: false,
      errorMessage: null,
      isEmpty: false,
    });
  });

  it("creates an error state for failed public browse", () => {
    expect(createErrorCatalogViewModel("Backend unavailable.")).toEqual({
      headline: "Catalog",
      statusLabel: "We could not load the catalog right now.",
      shops: [],
      isLoading: false,
      errorMessage: "Backend unavailable.",
      isEmpty: false,
    });
  });
});
