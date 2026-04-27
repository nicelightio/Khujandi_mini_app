import { createElement } from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { LanguageContextProvider, type LanguageContextValue } from "../../../app/language-context";
import { CatalogPage } from "../../../slices/catalog/components/catalog-page";
import type { CatalogStorefrontViewModel } from "../../../slices/catalog/components/storefront-view";
import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
} from "../../../slices/catalog/model/catalog-view-model";
import type { SupportedLanguage } from "../../../shared/i18n/languages";

const collectText = (node: unknown): string[] => {
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectText(child));
  }

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

const renderWithLanguage = (
  element: ReturnType<typeof createElement>,
  language: SupportedLanguage = "en",
) =>
  create(
    <LanguageContextProvider value={createLanguageContextValue(language)}>{element}</LanguageContextProvider>,
  );

const renderCatalogPageWithLanguage = (props: Parameters<typeof CatalogPage>[0]) => (
  <LanguageContextProvider value={createLanguageContextValue("en")}>
    <CatalogPage {...props} />
  </LanguageContextProvider>
);

const createCustomerStorefront = (
  shop: { id: string; publicPath: string; name: string },
  product: { id: string; name: string; priceMinor: number; priceLabel: string },
): CatalogStorefrontViewModel => ({
  shop: {
    ...shop,
    description: null,
    headerImageUrl: null,
    backgroundImageUrl: null,
    renameReviewNote: null,
  },
  access: {
    canEdit: false,
    currentTelegramId: null,
    authDebugLabel: null,
    statusLabel: "Public storefront",
    activationHint: null,
  },
  menuPages: [
    {
      id: `${shop.id}-page-1`,
      name: "Popular",
      products: [
        {
          ...product,
          description: null,
          imageUrl: null,
        },
      ],
    },
  ],
  unpagedProducts: [],
  emptyMenuPagesLabel: "No menu pages yet.",
  emptyProductsLabel: "No products yet.",
  addMenuPageLabel: "Add menu page",
  addProductLabel: "Add product",
  successMessage: null,
  errorMessage: null,
  isSaving: false,
  editor: null,
  debugLogs: [],
});

const getCartSummaryText = (renderer: ReactTestRenderer): string =>
  collectText(renderer.root.findByProps({ "data-storefront-cart": "summary" }).children).join(" ");

const dispatchBubblingClick = (instance: ReactTestInstance) => {
  let propagationStopped = false;
  let current: ReactTestInstance | null = instance;

  const event: {
    stopPropagation: () => void;
  } = {
    stopPropagation: () => {
      propagationStopped = true;
    },
  };

  while (current !== null) {
    const onClick = current.props.onClick as ((event: { stopPropagation: () => void }) => void) | undefined;
    onClick?.(event);

    if (propagationStopped) {
      break;
    }

    current = current.parent;
  }
};

const dispatchBubblingContextMenu = (instance: ReactTestInstance) => {
  let propagationStopped = false;
  let defaultPrevented = false;
  let current: ReactTestInstance | null = instance;

  const event: {
    preventDefault: () => void;
    stopPropagation: () => void;
  } = {
    preventDefault: () => {
      defaultPrevented = true;
    },
    stopPropagation: () => {
      propagationStopped = true;
    },
  };

  while (current !== null) {
    const onContextMenu = current.props.onContextMenu as
      | ((event: { preventDefault: () => void; stopPropagation: () => void }) => void)
      | undefined;
    onContextMenu?.(event);

    if (propagationStopped) {
      break;
    }

    current = current.parent;
  }

  expect(defaultPrevented).toBe(true);
};

describe("catalog page", () => {
  it("renders browse-safe shops and products for the public catalog", () => {
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createCatalogViewModel(
            [
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
            "en",
          ),
        }),
      );
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Catalog");
    expect(text).toContain("Khujand Bakery");
    expect(text).toContain("Somsa");
    expect(text).toContain("15.00 TJS");
    expect(renderer.root.findByProps({ "data-shell": "page" }).props).toMatchObject({
      "data-shell-back": "hidden",
      "data-shell-swipe": "default",
      "data-shell-action-feedback": "none",
    });
  });

  it("renders loading state for public browse", () => {
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createLoadingCatalogViewModel("en"),
        }),
        "en",
      );
    });

    const text = collectText(renderer.toJSON()).join(" ");

    expect(text).toContain("Loading shops and products...");
    expect(text).toContain("Loading catalog...");
  });

  it("renders empty and error states without shop sections", () => {
    let emptyRenderer!: ReactTestRenderer;
    let errorRenderer!: ReactTestRenderer;

    act(() => {
      emptyRenderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createCatalogViewModel([], "en"),
        }),
        "en",
      );
      errorRenderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createErrorCatalogViewModel("Backend unavailable.", "en"),
        }),
        "en",
      );
    });

    expect(collectText(emptyRenderer.toJSON()).join(" ")).toContain("No shops are available right now.");
    expect(collectText(errorRenderer.toJSON()).join(" ")).toContain("Backend unavailable.");
    expect(emptyRenderer.root.findAllByType("article")).toHaveLength(0);
    expect(errorRenderer.root.findAllByType("article")).toHaveLength(0);
  });

  it("renders localized loading copy for a selected language", () => {
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createLoadingCatalogViewModel("ru"),
        }),
        "ru",
      );
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Каталог");
    expect(text).toContain("Загрузка каталога...");
  });

  it("keeps nested storefront clicks from bubbling into the menu-page editor", () => {
    const onActivateEditor = jest.fn();
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createCatalogViewModel([], "en"),
          storefront: {
            shop: {
              id: "shop-1",
              publicPath: "khujand-bakery",
              name: "Khujand Bakery",
              description: null,
              headerImageUrl: null,
              backgroundImageUrl: null,
              renameReviewNote: null,
            },
            access: {
              canEdit: true,
              statusLabel: "Seller edit mode is active on the shared storefront tree.",
              activationHint: "Click or long press the existing shop, menu, or product blocks to edit them.",
            },
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
                    priceLabel: "15.00 TJS",
                  },
                ],
              },
            ],
            unpagedProducts: [],
            emptyMenuPagesLabel: "No menu pages yet.",
            emptyProductsLabel: "No products yet.",
            addMenuPageLabel: "Add menu page",
            addProductLabel: "Add product",
            successMessage: null,
            errorMessage: null,
            isSaving: false,
            editor: null,
          },
          onActivateEditor,
        }),
      );
    });

    const addProductButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add product");
    const productItem = renderer.root.findByProps({ "data-product-id": "product-1" });

    act(() => {
      dispatchBubblingClick(addProductButton!);
    });

    act(() => {
      dispatchBubblingClick(productItem);
    });

    expect(onActivateEditor.mock.calls).toEqual([
      [{ type: "new-product", menuPageId: "page-1" }],
      [{ type: "product", menuPageId: "page-1", productId: "product-1" }],
    ]);
  });

  it("wires customer storefront cart add, update, remove, totals and checkout readiness", () => {
    const onActivateEditor = jest.fn();
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createCatalogViewModel([], "en"),
          storefront: {
            shop: {
              id: "shop-1",
              publicPath: "khujand-bakery",
              name: "Khujand Bakery",
              description: null,
              headerImageUrl: null,
              backgroundImageUrl: null,
              renameReviewNote: null,
            },
            access: {
              canEdit: false,
              currentTelegramId: null,
              authDebugLabel: null,
              statusLabel: "Public storefront",
              activationHint: null,
            },
            menuPages: [
              {
                id: "page-1",
                name: "Popular",
                products: [
                  {
                    id: "product-1",
                    name: "Somsa",
                    description: "Hot baked pastry",
                    imageUrl: null,
                    priceMinor: 1500,
                    priceLabel: "15.00 TJS",
                  },
                ],
              },
            ],
            unpagedProducts: [],
            emptyMenuPagesLabel: "No menu pages yet.",
            emptyProductsLabel: "No products yet.",
            addMenuPageLabel: "Add menu page",
            addProductLabel: "Add product",
            successMessage: null,
            errorMessage: null,
            isSaving: false,
            editor: null,
            debugLogs: [],
          },
          onActivateEditor,
        }),
      );
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Add items to unlock checkout");
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Your cart is empty.");
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Preview total 0.00 TJS");

    const addButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(addButton!);
    });

    expect(onActivateEditor).not.toHaveBeenCalled();
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Checkout ready");
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Somsa 15.00 TJS");
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Preview total 15.00 TJS");

    const plusButton = renderer.root
      .findAllByType("button")
      .filter((node) => collectText(node.props.children).join(" ") === "+")
      .at(-1);

    act(() => {
      dispatchBubblingClick(plusButton!);
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Preview total 30.00 TJS");

    const removeButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Remove");

    act(() => {
      dispatchBubblingClick(removeButton!);
    });

    expect(collectText(renderer.toJSON()).join(" ")).toContain("Add items to unlock checkout");
    expect(collectText(renderer.toJSON()).join(" ")).toContain("Preview total 0.00 TJS");
  });

  it("passes the contract-shaped composition payload when checkout starts", () => {
    const onCheckoutComposition = jest.fn();
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createCatalogViewModel([], "en"),
          storefront: createCustomerStorefront(
            { id: "shop-1", publicPath: "khujand-bakery", name: "Khujand Bakery" },
            { id: "product-1", name: "Somsa", priceMinor: 1500, priceLabel: "15.00 TJS" },
          ),
          onCheckoutComposition,
        }),
      );
    });

    const checkoutButton = renderer.root.findByProps({ "data-storefront-cart": "checkout" });

    expect(checkoutButton.props.disabled).toBe(true);

    act(() => {
      dispatchBubblingClick(checkoutButton);
    });

    expect(onCheckoutComposition).not.toHaveBeenCalled();

    const addButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(addButton!);
    });

    const enabledCheckoutButton = renderer.root.findByProps({ "data-storefront-cart": "checkout" });

    expect(enabledCheckoutButton.props.disabled).toBe(false);

    act(() => {
      dispatchBubblingClick(enabledCheckoutButton);
    });

    expect(onCheckoutComposition).toHaveBeenCalledWith({
      shop_public_path: "khujand-bakery",
      shop_id: "shop-1",
      items: [
        {
          product_id: "product-1",
          quantity: 1,
          display_snapshot: {
            product_name: "Somsa",
            unit_price_minor: 1500,
            currency: "TJS",
          },
        },
      ],
      preview_total: {
        amount_minor: 1500,
        currency: "TJS",
      },
      created_at: expect.any(String),
    });
  });

  it("blocks checkout and shows repair feedback when a selected product leaves the public storefront", () => {
    const onCheckoutComposition = jest.fn();
    const storefront = createCustomerStorefront(
      { id: "shop-1", publicPath: "khujand-bakery", name: "Khujand Bakery" },
      { id: "product-1", name: "Somsa", priceMinor: 1500, priceLabel: "15.00 TJS" },
    );
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = create(
        renderCatalogPageWithLanguage({
          viewModel: createCatalogViewModel([], "en"),
          storefront,
          onCheckoutComposition,
        }),
      );
    });

    const addButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(addButton!);
    });

    expect(getCartSummaryText(renderer)).toContain("Checkout ready");

    act(() => {
      renderer.update(
        renderCatalogPageWithLanguage({
          viewModel: createCatalogViewModel([], "en"),
          storefront: {
            ...storefront,
            menuPages: storefront.menuPages.map((menuPage) => ({
              ...menuPage,
              products: [],
            })),
          },
          onCheckoutComposition,
        }),
      );
    });

    const checkoutButton = renderer.root.findByProps({ "data-storefront-cart": "checkout" });

    expect(checkoutButton.props.disabled).toBe(true);
    expect(getCartSummaryText(renderer)).toContain("Unavailable now");
    expect(getCartSummaryText(renderer)).toContain("Remove them before checkout");
    expect(getCartSummaryText(renderer)).toContain("Preview total 15.00 TJS");

    act(() => {
      dispatchBubblingClick(checkoutButton);
    });

    expect(onCheckoutComposition).not.toHaveBeenCalled();

    const removeButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Remove");

    act(() => {
      dispatchBubblingClick(removeButton!);
    });

    expect(getCartSummaryText(renderer)).toContain("Your cart is empty.");
    expect(getCartSummaryText(renderer)).not.toContain("Remove them before checkout");
  });

  it("requires explicit replacement before a different shop can own the cart", () => {
    const firstStorefront = createCustomerStorefront(
      { id: "shop-1", publicPath: "khujand-bakery", name: "Khujand Bakery" },
      { id: "product-1", name: "Somsa", priceMinor: 1500, priceLabel: "15.00 TJS" },
    );
    const secondStorefront = createCustomerStorefront(
      { id: "shop-2", publicPath: "tea-corner", name: "Tea Corner" },
      { id: "product-2", name: "Green Tea", priceMinor: 700, priceLabel: "7.00 TJS" },
    );
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = create(
        renderCatalogPageWithLanguage({
          viewModel: createCatalogViewModel([], "en"),
          storefront: firstStorefront,
        }),
      );
    });

    const firstAddButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(firstAddButton!);
    });

    expect(getCartSummaryText(renderer)).toContain("Somsa");
    expect(getCartSummaryText(renderer)).toContain("Preview total 15.00 TJS");

    act(() => {
      renderer.update(
        renderCatalogPageWithLanguage({
          viewModel: createCatalogViewModel([], "en"),
          storefront: secondStorefront,
        }),
      );
    });

    const secondAddButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(secondAddButton!);
    });

    expect(getCartSummaryText(renderer)).toContain("Somsa");
    expect(getCartSummaryText(renderer)).toContain("Replace it with Tea Corner");
    expect(getCartSummaryText(renderer)).not.toContain("Green Tea 7.00 TJS");

    const replaceButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Replace cart");

    act(() => {
      dispatchBubblingClick(replaceButton!);
    });

    expect(getCartSummaryText(renderer)).toContain("Green Tea");
    expect(getCartSummaryText(renderer)).toContain("Preview total 7.00 TJS");
    expect(getCartSummaryText(renderer)).not.toContain("Somsa");
  });

  it("lets customers clear an active cart before selecting from another shop", () => {
    const firstStorefront = createCustomerStorefront(
      { id: "shop-1", publicPath: "khujand-bakery", name: "Khujand Bakery" },
      { id: "product-1", name: "Somsa", priceMinor: 1500, priceLabel: "15.00 TJS" },
    );
    const secondStorefront = createCustomerStorefront(
      { id: "shop-2", publicPath: "tea-corner", name: "Tea Corner" },
      { id: "product-2", name: "Green Tea", priceMinor: 700, priceLabel: "7.00 TJS" },
    );
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = create(
        renderCatalogPageWithLanguage({
          viewModel: createCatalogViewModel([], "en"),
          storefront: firstStorefront,
        }),
      );
    });

    const firstAddButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(firstAddButton!);
    });

    act(() => {
      renderer.update(
        renderCatalogPageWithLanguage({
          viewModel: createCatalogViewModel([], "en"),
          storefront: secondStorefront,
        }),
      );
    });

    const secondAddButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(secondAddButton!);
    });

    const clearButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Clear cart");

    act(() => {
      dispatchBubblingClick(clearButton!);
    });

    expect(getCartSummaryText(renderer)).toContain("Your cart is empty.");
    expect(getCartSummaryText(renderer)).toContain("Preview total 0.00 TJS");

    const addAfterClearButton = renderer.root.findAllByType("button").find((node) => collectText(node.props.children).join(" ") === "Add to cart");

    act(() => {
      dispatchBubblingClick(addAfterClearButton!);
    });

    expect(getCartSummaryText(renderer)).toContain("Green Tea");
    expect(getCartSummaryText(renderer)).toContain("Preview total 7.00 TJS");
  });

  it("opens the shop editor only once when the hero surface bubbles to the storefront article", () => {
    const onActivateEditor = jest.fn();
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createElement(CatalogPage, {
          viewModel: createCatalogViewModel([], "en"),
          storefront: {
            shop: {
              id: "shop-1",
              publicPath: "khujand-bakery",
              name: "Khujand Bakery",
              description: null,
              headerImageUrl: null,
              backgroundImageUrl: null,
              renameReviewNote: null,
            },
            access: {
              canEdit: true,
              statusLabel: "Seller edit mode is active on the shared storefront tree.",
              activationHint: "Click or long press the existing shop, menu, or product blocks to edit them.",
            },
            menuPages: [],
            unpagedProducts: [],
            emptyMenuPagesLabel: "No menu pages yet.",
            emptyProductsLabel: "No products yet.",
            addMenuPageLabel: "Add menu page",
            addProductLabel: "Add product",
            successMessage: null,
            errorMessage: null,
            isSaving: false,
            editor: null,
          },
          onActivateEditor,
        }),
      );
    });

    const hero = renderer.root.findByProps({ "data-storefront-hero": "image" });

    act(() => {
      dispatchBubblingClick(hero);
    });

    act(() => {
      dispatchBubblingContextMenu(hero);
    });

    expect(onActivateEditor.mock.calls).toEqual([[{ type: "shop" }], [{ type: "shop" }]]);
  });
});
