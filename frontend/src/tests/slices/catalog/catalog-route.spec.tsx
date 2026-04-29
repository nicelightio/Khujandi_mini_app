import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LanguageContextProvider, type LanguageContextValue } from "../../../app/language-context";
import type { CatalogApi } from "../../../slices/catalog/api/catalog-api";
import { CatalogRoute } from "../../../slices/catalog/routes/catalog-route";
import type { SupportedLanguage } from "../../../shared/i18n/languages";

const collectText = (node: unknown): string[] => {
  if (typeof node === "string") {
    return [node];
  }

  if (node === null || typeof node !== "object") {
    return [];
  }

  const children = "children" in node ? (node.children as unknown[] | null) : null;

  if (children === null) {
    return [];
  }

  return children.flatMap((child) => collectText(child));
};

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation((message: unknown) => {
    if (typeof message === "string" && message.includes("react-test-renderer is deprecated")) {
      return;
    }

    process.stderr.write(String(message));
  });
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

const createLanguageContextValue = (language: SupportedLanguage = "en"): LanguageContextValue => ({
  state: {
    language,
    isHydrated: true,
    isOverlayVisible: false,
  },
  controller: {
    getState: () => ({
      language,
      isHydrated: true,
      isOverlayVisible: false,
    }),
    hydrate: async () => ({
      language,
      isHydrated: true,
      isOverlayVisible: false,
    }),
    selectLanguage: async (selectedLanguage) => ({
      language: selectedLanguage,
      isHydrated: true,
      isOverlayVisible: false,
    }),
  },
  selectLanguage: async () => undefined,
});

describe("catalog route", () => {
  it("shows loading first and then renders public shops/products from the route", async () => {
    let resolveCatalog: ((value: Awaited<ReturnType<CatalogApi["listCatalog"]>>) => void) | undefined;
    const api: CatalogApi = {
      listCatalog: () =>
        new Promise((resolve) => {
          resolveCatalog = resolve;
        }),
      getPublicStorefront: async () => null,
      getSellerStorefrontAccess: async () => null,
      updateSellerShop: async () => undefined,
      createSellerMenuPage: async () => undefined,
      updateSellerMenuPage: async () => undefined,
      createSellerProduct: async () => undefined,
      updateSellerProduct: async () => undefined,
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute api={api} />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Loading catalog...");

    await act(async () => {
      resolveCatalog?.([
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
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Khujand Bakery");
    expect(text).toContain("Somsa");
    expect(text).toContain("15.00 TJS");
    expect(renderer.root.findByProps({ href: "/shops/khujand-bakery" }).children).toContain("Khujand Bakery");
  });

  it("renders a controlled error state when the public browse request fails", async () => {
    const api: CatalogApi = {
      listCatalog: async () => {
        throw new Error("Catalog request failed with status 503.");
      },
      getPublicStorefront: async () => null,
      getSellerStorefrontAccess: async () => null,
      updateSellerShop: async () => undefined,
      createSellerMenuPage: async () => undefined,
      updateSellerMenuPage: async () => undefined,
      createSellerProduct: async () => undefined,
      updateSellerProduct: async () => undefined,
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue("ru")}>
          <CatalogRoute api={api} />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Сейчас не удалось загрузить каталог.");
    expect(text).toContain("Catalog request failed with status 503.");
  });

  it("renders a controlled not-found state instead of synthetic storefront content", async () => {
    const api: CatalogApi = {
      listCatalog: async () => [
        {
          id: "shop-1",
          name: "Khujand Bakery",
          publicPath: "khujand-bakery",
          products: [],
        },
      ],
      getPublicStorefront: async () => null,
      getSellerStorefrontAccess: async () => null,
      updateSellerShop: async () => undefined,
      createSellerMenuPage: async () => undefined,
      updateSellerMenuPage: async () => undefined,
      createSellerProduct: async () => undefined,
      updateSellerProduct: async () => undefined,
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute api={api} pathname="/shops/missing-shop" />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Storefront was not found.");
    expect(text).not.toContain("Shared storefront");
    expect(text).not.toContain("Starter Dish");
  });

  it("keeps legitimate public storefront browse when seller access fails", async () => {
    const api: CatalogApi = {
      listCatalog: async () => [
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
      ],
      getPublicStorefront: async () => ({
        shop: {
          id: "shop-1",
          publicPath: "khujand-bakery",
          name: "Khujand Bakery",
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
      getSellerStorefrontAccess: async () => {
        throw new Error("Seller runtime is temporarily unavailable.");
      },
      updateSellerShop: async () => undefined,
      createSellerMenuPage: async () => undefined,
      updateSellerMenuPage: async () => undefined,
      createSellerProduct: async () => undefined,
      updateSellerProduct: async () => undefined,
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute api={api} pathname="/shops/khujand-bakery" />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Khujand Bakery");
    expect(text).toContain("Somsa");
    expect(text).toContain("Fresh bread and pastries");
    expect(text).toContain("Popular");
    expect(text).toContain("Legacy");
    expect(text).not.toContain("Seller runtime is temporarily unavailable.");

    await act(async () => {
      renderer.root.findByProps({ "data-storefront-tab-state": "idle" }).props.onClick({
        stopPropagation: jest.fn(),
      });
      await flushPromises();
    });

    const legacyText = collectText(renderer.toJSON()).join(" ");
    expect(legacyText).toContain("Legacy products without a menu page");
    expect(legacyText).toContain("Legacy Pilaf");
  });

  it("renders a controlled error state when both storefront sources fail", async () => {
    const api: CatalogApi = {
      listCatalog: async () => {
        throw new Error("Catalog request failed with status 503.");
      },
      getPublicStorefront: async () => {
        throw new Error("Catalog request failed with status 503.");
      },
      getSellerStorefrontAccess: async () => {
        throw new Error("Seller runtime is temporarily unavailable.");
      },
      updateSellerShop: async () => undefined,
      createSellerMenuPage: async () => undefined,
      updateSellerMenuPage: async () => undefined,
      createSellerProduct: async () => undefined,
      updateSellerProduct: async () => undefined,
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute api={api} pathname="/shops/khujand-bakery" />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Catalog request failed with status 503.");
    expect(text).not.toContain("Shared storefront");
    expect(text).not.toContain("Starter Dish");
  });

});
