import { getCopy } from "../../../shared/i18n/copy";
import { defaultLanguage, type SupportedLanguage } from "../../../shared/i18n/languages";
import type { CatalogShopWithProducts } from "../api/catalog-api";

export type CatalogProductViewModel = {
  id: string;
  name: string;
  priceLabel: string;
};

export type CatalogShopViewModel = {
  id: string;
  publicPath: string;
  name: string;
  products: CatalogProductViewModel[];
  emptyLabel: string | null;
};

export type CatalogViewModel = {
  headline: string;
  statusLabel: string;
  shops: CatalogShopViewModel[];
  isLoading: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
};

const formatPrice = (priceMinor: number): string => {
  return `${(priceMinor / 100).toFixed(2)} TJS`;
};

export const createLoadingCatalogViewModel = (
  language: SupportedLanguage = defaultLanguage,
): CatalogViewModel => ({
  headline: getCopy(language).catalog.headline,
  statusLabel: getCopy(language).catalog.loadingStatus,
  shops: [],
  isLoading: true,
  errorMessage: null,
  isEmpty: false,
});

export const createErrorCatalogViewModel = (
  message = getCopy(defaultLanguage).catalog.unavailableMessage,
  language: SupportedLanguage = defaultLanguage,
): CatalogViewModel => ({
  headline: getCopy(language).catalog.headline,
  statusLabel: getCopy(language).catalog.unavailableStatus,
  shops: [],
  isLoading: false,
  errorMessage: message,
  isEmpty: false,
});

export const createCatalogViewModel = (
  catalog: CatalogShopWithProducts[],
  language: SupportedLanguage = defaultLanguage,
): CatalogViewModel => {
  const copy = getCopy(language).catalog;

  if (catalog.length === 0) {
    return {
      headline: copy.headline,
      statusLabel: copy.emptyStatus,
      shops: [],
      isLoading: false,
      errorMessage: null,
      isEmpty: true,
    };
  }

  const shops = catalog.map((shop) => ({
    id: shop.id,
    publicPath: shop.publicPath,
    name: shop.name,
      products: shop.products.map((product) => ({
        id: product.id,
        name: product.name,
        priceLabel: formatPrice(product.priceMinor),
      })),
      emptyLabel: shop.products.length === 0 ? copy.emptyShopLabel : null,
    }));

  return {
    headline: copy.headline,
    statusLabel: copy.availableCount(shops.length),
    shops,
    isLoading: false,
    errorMessage: null,
    isEmpty: false,
  };
};
