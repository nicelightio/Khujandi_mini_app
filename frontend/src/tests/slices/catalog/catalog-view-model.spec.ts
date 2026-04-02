import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
} from "../../../slices/catalog/model/catalog-view-model";

describe("catalog view model", () => {
  it("creates a loading state for public browse", () => {
    expect(createLoadingCatalogViewModel()).toEqual({
      headline: "Каталог",
      statusLabel: "Загружаем магазины и товары...",
      shops: [],
      isLoading: true,
      errorMessage: null,
      isEmpty: false,
    });

    expect(createLoadingCatalogViewModel("ru")).toEqual({
      headline: "Каталог",
      statusLabel: "Загружаем магазины и товары...",
      shops: [],
      isLoading: true,
      errorMessage: null,
      isEmpty: false,
    });
  });

  it("creates an empty state when no shops are visible", () => {
    expect(createCatalogViewModel([])).toEqual({
      headline: "Каталог",
      statusLabel: "Сейчас нет доступных магазинов.",
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
      headline: "Каталог",
      statusLabel: "2 магазина доступны для просмотра.",
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
          emptyLabel: "В этом магазине пока нет товаров.",
        },
      ],
      isLoading: false,
      errorMessage: null,
      isEmpty: false,
    });
  });

  it("creates an error state for failed public browse", () => {
    expect(createErrorCatalogViewModel("Backend unavailable.")).toEqual({
      headline: "Каталог",
      statusLabel: "Сейчас не удалось загрузить каталог.",
      shops: [],
      isLoading: false,
      errorMessage: "Backend unavailable.",
      isEmpty: false,
    });
  });

  it("creates localized empty state labels when a non-default language is selected", () => {
    expect(createCatalogViewModel([], "tj")).toEqual({
      headline: "Феҳрист",
      statusLabel: "Ҳоло ягон мағозаи дастрас нест.",
      shops: [],
      isLoading: false,
      errorMessage: null,
      isEmpty: true,
    });
  });
});
