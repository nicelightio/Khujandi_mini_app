import { getCopy } from "../../../shared/i18n/copy";
import { defaultLanguage, type SupportedLanguage } from "../../../shared/i18n/languages";
import { routes } from "../../../shared/lib/routes";
import type { CatalogStartShowcase } from "../api/catalog-api";

export type ShowcaseFavoriteShopViewModel = {
  id: string;
  name: string;
  publicPath: string;
  href: string;
  description: string | null;
  imageUrl: string | null;
};

export type ShowcaseProductViewModel = {
  id: string;
  productId: string;
  shopId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceLabel: string;
  shopName: string;
  shopHref: string;
};

export type ShowcaseAdminAffordanceViewModel = {
  canCurate: boolean;
  menuLabel: string;
  removeProductLabel: string;
  favoriteShopLabel: string;
  unfavoriteShopLabel: string;
};

export type StartShowcaseViewModel = {
  title: string;
  statusLabel: string;
  favoriteShops: ShowcaseFavoriteShopViewModel[];
  allKhujandLink: {
    label: string;
    href: string;
  };
  popularProducts: ShowcaseProductViewModel[];
  isLoading: boolean;
  errorMessage: string | null;
  isEmpty: boolean;
  admin: ShowcaseAdminAffordanceViewModel;
};

const formatPrice = (priceMinor: number, currency: string): string => `${(priceMinor / 100).toFixed(2)} ${currency}`;

export const createLoadingStartShowcaseViewModel = (
  language: SupportedLanguage = defaultLanguage,
): StartShowcaseViewModel => ({
  title: getCopy(language).catalog.showcaseTitle,
  statusLabel: getCopy(language).catalog.loadingStatus,
  favoriteShops: [],
  allKhujandLink: {
    label: getCopy(language).catalog.allKhujandLabel,
    href: routes.catalogBrowse,
  },
  popularProducts: [],
  isLoading: true,
  errorMessage: null,
  isEmpty: false,
  admin: createShowcaseAdminAffordance(false, language),
});

export const createErrorStartShowcaseViewModel = (
  message = getCopy(defaultLanguage).catalog.unavailableMessage,
  language: SupportedLanguage = defaultLanguage,
): StartShowcaseViewModel => ({
  title: getCopy(language).catalog.showcaseTitle,
  statusLabel: getCopy(language).catalog.unavailableStatus,
  favoriteShops: [],
  allKhujandLink: {
    label: getCopy(language).catalog.allKhujandLabel,
    href: routes.catalogBrowse,
  },
  popularProducts: [],
  isLoading: false,
  errorMessage: message,
  isEmpty: false,
  admin: createShowcaseAdminAffordance(false, language),
});

export const createShowcaseAdminAffordance = (
  canCurate: boolean,
  language: SupportedLanguage = defaultLanguage,
): ShowcaseAdminAffordanceViewModel => {
  const copy = getCopy(language).catalog;

  return {
    canCurate,
    menuLabel: copy.adminMenuLabel,
    removeProductLabel: copy.removeFromShowcaseLabel,
    favoriteShopLabel: copy.favoriteShopLabel,
    unfavoriteShopLabel: copy.unfavoriteShopLabel,
  };
};

export const createStartShowcaseViewModel = (
  showcase: CatalogStartShowcase,
  canCurate: boolean,
  language: SupportedLanguage = defaultLanguage,
): StartShowcaseViewModel => {
  const copy = getCopy(language).catalog;
  const popularProducts = showcase.popularTodayProducts.map((product) => ({
    id: product.id,
    productId: product.productId,
    shopId: product.shopId,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    priceLabel: formatPrice(product.priceMinor, product.currency),
    shopName: product.shopName,
    shopHref: `/shops/${encodeURIComponent(product.shopPublicPath)}`,
  }));
  const favoriteShops = showcase.favoriteShops.slice(0, 3).map((shop) => ({
    id: shop.id,
    name: shop.name,
    publicPath: shop.publicPath,
    href: `/shops/${encodeURIComponent(shop.publicPath)}`,
    description: shop.description,
    imageUrl: shop.headerImageUrl,
  }));

  return {
    title: copy.showcaseTitle,
    statusLabel:
      popularProducts.length === 0 && favoriteShops.length === 0
        ? copy.showcaseEmptyStatus
        : copy.showcaseAvailableStatus(popularProducts.length),
    favoriteShops,
    allKhujandLink: {
      label: copy.allKhujandLabel,
      href: showcase.allKhujandLink.target || routes.catalogBrowse,
    },
    popularProducts,
    isLoading: false,
    errorMessage: null,
    isEmpty: popularProducts.length === 0 && favoriteShops.length === 0,
    admin: createShowcaseAdminAffordance(canCurate, language),
  };
};
