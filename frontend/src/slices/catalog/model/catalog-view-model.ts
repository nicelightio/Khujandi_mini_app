import type { CatalogShopWithProducts } from "../api/catalog-api";

export type CatalogProductViewModel = {
  id: string;
  name: string;
  priceLabel: string;
};

export type CatalogShopViewModel = {
  id: string;
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

export const createLoadingCatalogViewModel = (): CatalogViewModel => ({
  headline: "Catalog",
  statusLabel: "Loading shops and products...",
  shops: [],
  isLoading: true,
  errorMessage: null,
  isEmpty: false,
});

export const createErrorCatalogViewModel = (message = "Catalog is temporarily unavailable."): CatalogViewModel => ({
  headline: "Catalog",
  statusLabel: "We could not load the catalog right now.",
  shops: [],
  isLoading: false,
  errorMessage: message,
  isEmpty: false,
});

export const createCatalogViewModel = (catalog: CatalogShopWithProducts[]): CatalogViewModel => {
  if (catalog.length === 0) {
    return {
      headline: "Catalog",
      statusLabel: "No shops are available right now.",
      shops: [],
      isLoading: false,
      errorMessage: null,
      isEmpty: true,
    };
  }

  const shops = catalog.map((shop) => ({
    id: shop.id,
    name: shop.name,
    products: shop.products.map((product) => ({
      id: product.id,
      name: product.name,
      priceLabel: formatPrice(product.priceMinor),
    })),
    emptyLabel: shop.products.length === 0 ? "No products are available in this shop yet." : null,
  }));

  return {
    headline: "Catalog",
    statusLabel: `${shops.length} shop${shops.length === 1 ? "" : "s"} available for browsing.`,
    shops,
    isLoading: false,
    errorMessage: null,
    isEmpty: false,
  };
};
