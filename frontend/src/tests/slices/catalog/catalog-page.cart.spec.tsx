import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createCatalogViewModel } from "../../../slices/catalog/model/catalog-view-model";
import {
  collectText,
  createCatalogPageElement,
  createCustomerStorefront,
  dispatchBubblingClick,
  getCartSummaryText,
  renderCatalogPageWithLanguage,
  renderWithLanguage,
} from "./catalog-page.test-utils";

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

describe("catalog page cart composition", () => {
  it("wires customer storefront cart add, update, remove, totals and checkout readiness", () => {
    const onActivateEditor = jest.fn();
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createCatalogPageElement({
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
    expect(renderer.root.findByProps({ "data-storefront-back-link": true }).props.href).toBe("/");
    expect(collectText(renderer.root.findByProps({ "data-storefront-back-link": true }).children).join(" ")).toBe("Вернуться");

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
        createCatalogPageElement({
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
});
