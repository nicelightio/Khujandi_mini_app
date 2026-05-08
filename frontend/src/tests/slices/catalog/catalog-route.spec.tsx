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

const createCatalogApiMock = (overrides: Partial<CatalogApi> = {}): CatalogApi => ({
  getStartShowcase: async () => ({
    favoriteShops: [],
    allKhujandLink: {
      label: "весь Худжанд",
      target: "/shops",
    },
    popularTodayProducts: [],
  }),
  getShowcaseAdminState: async () => ({ canCurate: false }),
  addShowcaseProduct: async () => undefined,
  removeShowcaseProduct: async () => undefined,
  addShowcaseShop: async () => undefined,
  removeShowcaseShop: async () => undefined,
  listCatalog: async () => [],
  getPublicStorefront: async () => null,
  getSellerStorefrontAccess: async () => null,
  updateSellerShop: async () => undefined,
  createSellerMenuPage: async () => undefined,
  updateSellerMenuPage: async () => undefined,
  createSellerProduct: async () => undefined,
  updateSellerProduct: async () => undefined,
  ...overrides,
});

describe("catalog route", () => {
  it("shows loading first and then renders public shops/products on the browse route", async () => {
    let resolveCatalog: ((value: Awaited<ReturnType<CatalogApi["listCatalog"]>>) => void) | undefined;
    const api = createCatalogApiMock({
      listCatalog: () =>
        new Promise((resolve) => {
          resolveCatalog = resolve;
        }),
    });

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute api={api} pathname="/shops" />
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
    const api = createCatalogApiMock({
      listCatalog: async () => {
        throw new Error("Catalog request failed with status 503.");
      },
    });

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue("ru")}>
          <CatalogRoute api={api} pathname="/shops" />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Сейчас не удалось загрузить каталог.");
    expect(text).toContain("Catalog request failed with status 503.");
  });

  it("renders a controlled not-found state instead of synthetic storefront content", async () => {
    const api = createCatalogApiMock({
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
    });

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
    const api = createCatalogApiMock({
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
    });

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
    const api = createCatalogApiMock({
      listCatalog: async () => {
        throw new Error("Catalog request failed with status 503.");
      },
      getPublicStorefront: async () => {
        throw new Error("Catalog request failed with status 503.");
      },
      getSellerStorefrontAccess: async () => {
        throw new Error("Seller runtime is temporarily unavailable.");
      },
    });

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

  it("renders root start showcase instead of the generic shop list by default", async () => {
    const listCatalog = jest.fn(async () => [
      {
        id: "shop-2",
        name: "Generic Shop",
        publicPath: "generic-shop",
        products: [],
      },
    ]);
    const api = createCatalogApiMock({
      getStartShowcase: async () => ({
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
      listCatalog,
    });

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue("ru")}>
          <CatalogRoute api={api} pathname="/" />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Сегодня популярны");
    expect(text).toContain("Somsa");
    expect(text).toContain("Baked fresh today");
    expect(text).toContain("Khujand Bakery");
    expect(text).toContain("весь Худжанд");
    expect(text).not.toContain("Generic Shop");
    expect(listCatalog).not.toHaveBeenCalled();
    expect(renderer.root.findByProps({ "data-start-showcase": "all-khujand" }).props.href).toBe("/shops");
    expect(renderer.root.findAllByProps({ "data-start-showcase-admin": "bar" })).toHaveLength(0);
  });

  it("keeps storefront admin long-press curation action stable after pointer release and calls the API", async () => {
    jest.useFakeTimers();

    const getShowcaseAdminState = jest.fn(async () => ({ canCurate: true }));
    const addShowcaseProduct = jest.fn(async () => undefined);
    const api = createCatalogApiMock({
      getShowcaseAdminState,
      addShowcaseProduct,
      getPublicStorefront: async () => ({
        shop: {
          id: "shop-1",
          publicPath: "khujand-bakery",
          name: "Khujand Bakery",
          description: "Fresh bread",
          headerImageUrl: null,
          backgroundImageUrl: null,
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
                imageUrl: null,
                priceMinor: 1500,
              },
            ],
          },
        ],
        unpagedProducts: [],
      }),
      getSellerStorefrontAccess: async () => null,
    });

    let renderer!: ReactTestRenderer;

    try {
      await act(async () => {
        renderer = create(
          <LanguageContextProvider value={createLanguageContextValue()}>
            <CatalogRoute api={api} pathname="/shops/khujand-bakery" />
          </LanguageContextProvider>,
        );
        await flushPromises();
      });

      const productCard = renderer.root.findByProps({ "data-product-id": "product-1" });

      await act(async () => {
        productCard.props.onPointerDown({
          currentTarget: {
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 240, height: 180 }),
            setPointerCapture: jest.fn(),
          },
          clientX: 24,
          clientY: 24,
          pointerId: 1,
        });
        jest.advanceTimersByTime(420);
        productCard.props.onPointerUp();
        productCard.props.onClick({ stopPropagation: jest.fn() });
        await flushPromises();
      });

      const addButton = renderer.root.findByProps({ "data-storefront-admin-curation": "add-product" });
      expect(collectText(addButton.props.children).join(" ")).toBe("Add to showcase");

      await act(async () => {
        addButton.props.onClick({ stopPropagation: jest.fn() });
        await flushPromises();
      });

      expect(addShowcaseProduct).toHaveBeenCalledWith("product-1");
      expect(getShowcaseAdminState).toHaveBeenCalled();
      expect(collectText(renderer.toJSON()).join(" ")).toContain("Showcase updated.");
    } finally {
      jest.useRealTimers();
    }
  });

  it("unfavorites the current shop from the storefront admin menu when it is already favorite", async () => {
    const removeShowcaseShop = jest.fn(async () => undefined);
    const getStartShowcase = jest
      .fn()
      .mockResolvedValueOnce({
        favoriteShops: [
          {
            id: "shop-1",
            name: "Khujand Bakery",
            publicPath: "khujand-bakery",
            description: null,
            headerImageUrl: null,
          },
        ],
        allKhujandLink: {
          label: "весь Худжанд",
          target: "/shops",
        },
        popularTodayProducts: [],
      })
      .mockResolvedValueOnce({
        favoriteShops: [],
        allKhujandLink: {
          label: "весь Худжанд",
          target: "/shops",
        },
        popularTodayProducts: [],
      });
    const api = createCatalogApiMock({
      getStartShowcase,
      getShowcaseAdminState: async () => ({ canCurate: true }),
      removeShowcaseShop,
      getPublicStorefront: async () => ({
        shop: {
          id: "shop-1",
          publicPath: "khujand-bakery",
          name: "Khujand Bakery",
          description: null,
          headerImageUrl: null,
          backgroundImageUrl: null,
        },
        menuPages: [],
        unpagedProducts: [],
      }),
      getSellerStorefrontAccess: async () => null,
    });

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute api={api} pathname="/shops/khujand-bakery" />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const adminMenuButton = renderer.root
      .findAllByType("button")
      .find((button) => collectText(button.props.children).join(" ") === "меню админов");

    expect(adminMenuButton).toBeDefined();

    await act(async () => {
      adminMenuButton?.props.onClick({ stopPropagation: jest.fn() });
      await flushPromises();
    });

    const unfavoriteButton = renderer.root
      .findAllByType("button")
      .find((button) => collectText(button.props.children).join(" ") === "Remove favorite");

    expect(unfavoriteButton).toBeDefined();

    await act(async () => {
      unfavoriteButton?.props.onClick({ stopPropagation: jest.fn() });
      await flushPromises();
    });

    expect(removeShowcaseShop).toHaveBeenCalledWith("shop-1");
    expect(getStartShowcase).toHaveBeenCalledTimes(2);
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Showcase updated.");
  });

  it("shows controlled storefront curation failure feedback", async () => {
    jest.useFakeTimers();

    const api = createCatalogApiMock({
      getShowcaseAdminState: async () => ({ canCurate: true }),
      addShowcaseProduct: async () => {
        throw new Error("Catalog request failed with status 401.");
      },
      getPublicStorefront: async () => ({
        shop: {
          id: "shop-1",
          publicPath: "khujand-bakery",
          name: "Khujand Bakery",
          description: null,
          headerImageUrl: null,
          backgroundImageUrl: null,
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
                description: null,
                imageUrl: null,
                priceMinor: 1500,
              },
            ],
          },
        ],
        unpagedProducts: [],
      }),
      getSellerStorefrontAccess: async () => null,
    });

    let renderer!: ReactTestRenderer;

    try {
      await act(async () => {
        renderer = create(
          <LanguageContextProvider value={createLanguageContextValue()}>
            <CatalogRoute api={api} pathname="/shops/khujand-bakery" />
          </LanguageContextProvider>,
        );
        await flushPromises();
      });

      const productCard = renderer.root.findByProps({ "data-product-id": "product-1" });

      await act(async () => {
        productCard.props.onContextMenu({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          currentTarget: {
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 240, height: 180 }),
          },
          clientX: 24,
          clientY: 24,
        });
        await flushPromises();
      });

      await act(async () => {
        renderer.root.findByProps({ "data-storefront-admin-curation": "add-product" }).props.onClick({
          stopPropagation: jest.fn(),
        });
        await flushPromises();
      });

      const text = collectText(renderer.toJSON()).join(" ");
      expect(text).toContain("Could not update showcase.");
      expect(text).toContain("Catalog request failed with status 401.");
    } finally {
      jest.useRealTimers();
    }
  });

  it("refreshes the start showcase after removing a curated product", async () => {
    jest.useFakeTimers();

    const removeShowcaseProduct = jest.fn(async () => undefined);
    const getStartShowcase = jest
      .fn()
      .mockResolvedValueOnce({
        favoriteShops: [],
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
            description: null,
            imageUrl: null,
            priceMinor: 1500,
            currency: "TJS",
            sortOrder: 1,
          },
        ],
      })
      .mockResolvedValueOnce({
        favoriteShops: [],
        allKhujandLink: {
          label: "весь Худжанд",
          target: "/shops",
        },
        popularTodayProducts: [],
      });
    const api = createCatalogApiMock({
      getStartShowcase,
      getShowcaseAdminState: async () => ({ canCurate: true }),
      removeShowcaseProduct,
    });

    let renderer!: ReactTestRenderer;

    try {
      await act(async () => {
        renderer = create(
          <LanguageContextProvider value={createLanguageContextValue("ru")}>
            <CatalogRoute api={api} pathname="/" />
          </LanguageContextProvider>,
        );
        await flushPromises();
      });

      const productCard = renderer.root.findByProps({ "data-product-id": "product-1" });

      await act(async () => {
        productCard.props.onPointerDown();
        jest.advanceTimersByTime(420);
        await flushPromises();
      });

      await act(async () => {
        renderer.root.findByProps({ "data-start-showcase-admin": "remove-product" }).props.onClick();
        await flushPromises();
      });

      expect(removeShowcaseProduct).toHaveBeenCalledWith("product-1");
      expect(getStartShowcase).toHaveBeenCalledTimes(2);
      const text = collectText(renderer.toJSON()).join(" ");
      expect(text).toContain("Витрина обновлена.");
      expect(text).not.toContain("Somsa");
    } finally {
      jest.useRealTimers();
    }
  });

});
