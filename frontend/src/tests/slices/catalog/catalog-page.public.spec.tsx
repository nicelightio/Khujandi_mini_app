import { act, type ReactTestRenderer } from "react-test-renderer";
import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
} from "../../../slices/catalog/model/catalog-view-model";
import { collectText, createCatalogPageElement, renderWithLanguage } from "./catalog-page.test-utils";

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

describe("catalog page public browse", () => {
  it("renders browse-safe shops and products for the public catalog", () => {
    let renderer!: ReactTestRenderer;

    act(() => {
      renderer = renderWithLanguage(
        createCatalogPageElement({
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
    expect(text).toContain("Админка приложения");
    expect(text).toContain("Открыть админку");
    expect(text).toContain("Khujand Bakery");
    expect(text).toContain("Somsa");
    expect(text).toContain("15.00 TJS");
    expect(renderer.root.findAllByType("a").map((link) => link.props.href)).toContain("https://tgmeal.natureonzoom.win/admin");
    expect(renderer.root.findAllByType("a").map((link) => link.props.href)).not.toContain("https://tgmeal.natureonzoom.win/admin/orders/assignment");
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
        createCatalogPageElement({
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
        createCatalogPageElement({
          viewModel: createCatalogViewModel([], "en"),
        }),
        "en",
      );
      errorRenderer = renderWithLanguage(
        createCatalogPageElement({
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
        createCatalogPageElement({
          viewModel: createLoadingCatalogViewModel("ru"),
        }),
        "ru",
      );
    });

    const text = collectText(renderer.toJSON()).join(" ");
    expect(text).toContain("Каталог");
    expect(text).toContain("Загрузка каталога...");
  });
});
