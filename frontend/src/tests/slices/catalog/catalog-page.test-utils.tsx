import { createElement, type ReactElement } from "react";
import { create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { LanguageContextProvider, type LanguageContextValue } from "../../../app/language-context";
import { CatalogPage } from "../../../slices/catalog/components/catalog-page";
import type { CatalogStorefrontViewModel } from "../../../slices/catalog/components/storefront-view";
import type { SupportedLanguage } from "../../../shared/i18n/languages";

export const collectText = (node: unknown): string[] => {
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

export const createLanguageContextValue = (language: SupportedLanguage = "en"): LanguageContextValue => ({
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

export const renderWithLanguage = (element: ReactElement, language: SupportedLanguage = "en") =>
  create(
    <LanguageContextProvider value={createLanguageContextValue(language)}>{element}</LanguageContextProvider>,
  );

export const renderCatalogPageWithLanguage = (props: Parameters<typeof CatalogPage>[0]) => (
  <LanguageContextProvider value={createLanguageContextValue("en")}>
    <CatalogPage {...props} />
  </LanguageContextProvider>
);

export const createCustomerStorefront = (
  shop: { id: string; publicPath: string; name: string },
  product: { id: string; name: string; description?: string | null; priceMinor: number; priceLabel: string },
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
          description: product.description ?? null,
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

export const getCartSummaryText = (renderer: ReactTestRenderer): string =>
  collectText(renderer.root.findByProps({ "data-storefront-cart": "summary" }).children).join(" ");

export const dispatchBubblingClick = (instance: ReactTestInstance) => {
  let propagationStopped = false;
  let current: ReactTestInstance | null = instance;
  const event = {
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

export const dispatchBubblingContextMenu = (instance: ReactTestInstance) => {
  let propagationStopped = false;
  let defaultPrevented = false;
  let current: ReactTestInstance | null = instance;
  const event = {
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

export const createCatalogPageElement = (props: Parameters<typeof CatalogPage>[0]) => createElement(CatalogPage, props);
