import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { LanguageContextProvider, type LanguageContextValue } from "../../../app/language-context";
import { CatalogPage } from "../../../slices/catalog/components/catalog-page";
import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
} from "../../../slices/catalog/model/catalog-view-model";
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
});
