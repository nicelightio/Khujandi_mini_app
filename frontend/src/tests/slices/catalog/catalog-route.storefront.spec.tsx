import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LanguageContextProvider, type LanguageContextValue } from "../../../app/language-context";
import { CatalogRoute, type CatalogStorefrontData } from "../../../slices/catalog/routes/catalog-route";
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

describe("catalog route storefront editing", () => {
  it("keeps storefront editing on the same catalog tree for an owning seller", async () => {
    let storefrontData: CatalogStorefrontData = {
      shop: {
        id: "shop-1",
        publicPath: "khujand-bakery",
        name: "Khujand Bakery",
        description: "Fresh bread and pastries",
        headerImageUrl: null,
        backgroundImageUrl: null,
        renameReviewNote: null,
      },
      canEdit: true,
      accessStatusLabel: "Seller edit mode is active on the shared storefront tree.",
      activationHint: "Click or long press the existing shop, menu, or product blocks to edit them.",
      menuPages: [
        {
          id: "page-1",
          name: "Popular",
          products: [
            {
              id: "product-1",
              name: "Somsa",
              description: "Baked fresh today",
              imageUrl: null,
              priceMinor: 1500,
            },
          ],
        },
      ],
      unpagedProducts: [],
    };

    const persistStorefrontEdit = jest.fn().mockImplementation(async () => {
      storefrontData = {
        ...storefrontData,
        menuPages: [
          {
            ...storefrontData.menuPages[0],
            products: [
              {
                ...storefrontData.menuPages[0].products[0],
                name: "Somsa Deluxe",
              },
            ],
          },
        ],
      };

      return {
        confirmationMessage: "Product changes saved on the shared storefront tree.",
      };
    });

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute
            pathname="/shops/khujand-bakery"
            loadStorefrontData={async () => storefrontData}
            persistStorefrontEdit={persistStorefrontEdit}
          />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Khujand Bakery");

    await act(async () => {
      renderer.root.findByProps({ "data-product-id": "product-1" }).props.onClick({
        stopPropagation: jest.fn(),
      });
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Edit product");

    const nameInput = renderer.root.findAllByType("input").find((node) => node.props.value === "Somsa");

    await act(async () => {
      nameInput?.props.onChange({
        target: {
          value: "Somsa Deluxe",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-catalog-editor": "active" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Somsa Deluxe");
    expect(text).toContain("Product changes saved on the shared storefront tree.");
    expect(text).not.toContain("Delete");
    expect(persistStorefrontEdit).toHaveBeenCalledTimes(1);
    expect(persistStorefrontEdit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        shopId: "khujand-bakery",
        target: {
          type: "product",
          menuPageId: "page-1",
          productId: "product-1",
        },
      }),
    );
  });

  it("keeps non-seller storefront visitors in browse-only mode", async () => {
    const storefrontData: CatalogStorefrontData = {
      shop: {
        id: "shop-1",
        publicPath: "khujand-bakery",
        name: "Khujand Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        renameReviewNote: null,
      },
      canEdit: false,
      accessStatusLabel: "Browse-only storefront. Seller edit mode stays hidden until ownership is confirmed server-side.",
      activationHint: null,
      menuPages: [
        {
          id: "page-1",
          name: "Popular",
          products: [
            {
              id: "product-1",
              name: "Somsa",
              description: null,
              imageUrl: null,
              priceMinor: 1500,
            },
          ],
        },
      ],
      unpagedProducts: [],
    };

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute pathname="/shops/khujand-bakery" loadStorefrontData={async () => storefrontData} />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Khujand Bakery");
    expect(renderer.root.findAllByProps({ "data-catalog-editor": "active" })).toHaveLength(0);
    expect(renderer.root.findAllByType("button").some((node) => collectText(node.props.children).join(" ") === "Add menu page")).toBe(false);
  });

  it("renders and edits owner-visible legacy products without forcing a synthetic menu page", async () => {
    let storefrontData: CatalogStorefrontData = {
      shop: {
        id: "shop-legacy",
        publicPath: "legacy-bakery",
        name: "Legacy Bakery",
        description: null,
        headerImageUrl: null,
        backgroundImageUrl: null,
        renameReviewNote: null,
      },
      canEdit: true,
      accessStatusLabel: "Seller edit mode is active on the shared storefront tree.",
      activationHint: "Click or long press the existing shop, menu, or product blocks to edit them.",
      menuPages: [],
      unpagedProducts: [
        {
          id: "product-legacy-1",
          name: "Legacy Somsa",
          description: "No page yet",
          imageUrl: null,
          priceMinor: 1500,
          menuPageId: null,
        },
      ],
    };

    const persistStorefrontEdit = jest.fn().mockImplementation(async () => {
      storefrontData = {
        ...storefrontData,
        unpagedProducts: [
          {
            ...storefrontData.unpagedProducts[0],
            name: "Legacy Somsa Deluxe",
          },
        ],
      };

      return {
        confirmationMessage: "Product changes saved on the shared storefront tree.",
      };
    });

    let renderer!: ReactTestRenderer;

    await act(async () => {
      renderer = create(
        <LanguageContextProvider value={createLanguageContextValue()}>
          <CatalogRoute
            pathname="/shops/legacy-bakery"
            loadStorefrontData={async () => storefrontData}
            persistStorefrontEdit={persistStorefrontEdit}
          />
        </LanguageContextProvider>,
      );
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Legacy products without a menu page");

    await act(async () => {
      renderer.root.findByProps({ "data-product-id": "product-legacy-1" }).props.onClick({
        stopPropagation: jest.fn(),
      });
      await flushPromises();
    });

    const nameInput = renderer.root.findAllByType("input").find((node) => node.props.value === "Legacy Somsa");

    await act(async () => {
      nameInput?.props.onChange({
        target: {
          value: "Legacy Somsa Deluxe",
        },
      });
      await flushPromises();
    });

    await act(async () => {
      renderer.root.findByProps({ "data-catalog-editor": "active" }).props.onSubmit({
        preventDefault: jest.fn(),
      });
      await flushPromises();
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Legacy Somsa Deluxe");
    expect(persistStorefrontEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        target: {
          type: "product",
          menuPageId: null,
          productId: "product-legacy-1",
        },
      }),
      expect.anything(),
      expect.anything(),
    );
  });
});
