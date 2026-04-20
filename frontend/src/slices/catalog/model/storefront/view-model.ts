import type { SupportedLanguage } from "../../../../shared/i18n/languages";
import type { CatalogStorefrontViewModel } from "../../components/catalog-page";
import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
  type CatalogViewModel,
} from "../catalog-view-model";
import { storefrontUnavailableMessage, type CatalogStorefrontState } from "./types";

const formatPrice = (priceMinor: number): string => `${(priceMinor / 100).toFixed(2)} TJS`;

export const buildStorefrontViewModel = (state: CatalogStorefrontState): CatalogStorefrontViewModel | undefined => {
  if (state.data === null) {
    return undefined;
  }

  return {
    shop: state.data.shop,
    access: {
      canEdit: state.data.canEdit,
      currentTelegramId: state.data.currentTelegramId,
      authDebugLabel: state.data.authDebugLabel,
      statusLabel: state.data.accessStatusLabel,
      activationHint: state.data.activationHint,
    },
    menuPages: state.data.menuPages.map((menuPage) => ({
      id: menuPage.id,
      name: menuPage.name,
      products: menuPage.products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        priceLabel: formatPrice(product.priceMinor),
      })),
    })),
    unpagedProducts: state.data.unpagedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceLabel: formatPrice(product.priceMinor),
      menuPageId: product.menuPageId,
    })),
    emptyMenuPagesLabel: "No menu pages are available in this storefront yet.",
    emptyProductsLabel: "No products are available in this menu page yet.",
    addMenuPageLabel: "Add menu page",
    addProductLabel: "Add product",
    successMessage: state.successMessage,
    errorMessage: state.saveErrorMessage,
    isSaving: state.isSaving,
    editor: state.editor,
  };
};

export const buildStorefrontCatalogViewModel = (
  state: CatalogStorefrontState,
  language: SupportedLanguage,
): CatalogViewModel => {
  if (state.isLoading) {
    return createLoadingCatalogViewModel(language);
  }

  if (state.errorMessage !== null) {
    return createErrorCatalogViewModel(state.errorMessage, language);
  }

  if (state.data === null) {
    return createErrorCatalogViewModel(storefrontUnavailableMessage, language);
  }

  const storefrontShopId = state.data.shop.id;

  const baseViewModel = createCatalogViewModel(
    [
      {
        id: state.data.shop.id,
        publicPath: state.data.shop.publicPath,
        name: state.data.shop.name,
        products: [
          ...state.data.menuPages.flatMap((menuPage) =>
            menuPage.products.map((product) => ({
              id: product.id,
              shopId: storefrontShopId,
              name: product.name,
              priceMinor: product.priceMinor,
            })),
          ),
          ...state.data.unpagedProducts.map((product) => ({
            id: product.id,
            shopId: storefrontShopId,
            name: product.name,
            priceMinor: product.priceMinor,
          })),
        ],
      },
    ],
    language,
  );

  return {
    ...baseViewModel,
    headline: state.data.shop.name,
    statusLabel: "",
  };
};
