import { act, type ReactTestRenderer } from "react-test-renderer";
import { createCatalogViewModel } from "../../../slices/catalog/model/catalog-view-model";
import {
  collectText,
  createCatalogPageElement,
  dispatchBubblingClick,
  dispatchBubblingContextMenu,
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

describe("catalog page storefront edit events", () => {
  it("keeps nested storefront clicks from bubbling into the menu-page editor", () => {
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
              canEdit: true,
              currentTelegramId: null,
              authDebugLabel: null,
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
            debugLogs: [],
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

  it("opens the shop editor only once when the hero surface bubbles to the storefront article", () => {
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
              canEdit: true,
              currentTelegramId: null,
              authDebugLabel: null,
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
            debugLogs: [],
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
