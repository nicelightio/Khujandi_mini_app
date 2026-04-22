import type {
  CatalogMenuPage,
  CatalogProduct,
  PublicCatalogStorefront,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
} from "./catalog.types";
import { getPreferredPublicPath } from "./shop-public-paths";

const buildStorefrontCollections = <TMenuPage extends CatalogMenuPage, TProduct extends CatalogProduct>(
  shopMenuPages: TMenuPage[],
  shopProducts: TProduct[],
) => {
  const shopMenuPageIds = new Set(shopMenuPages.map((page) => page.id));

  return {
    menuPages: shopMenuPages
      .sort((left, right) => left.position - right.position)
      .map((page) => ({
        ...page,
        products: shopProducts.filter((product) => product.menuPageId === page.id),
      })),
    unpagedProducts: shopProducts.filter(
      (product) => product.menuPageId === null || !shopMenuPageIds.has(product.menuPageId),
    ),
  };
};

export const buildPublicStorefrontPayload = (
  shop: SellerCatalogShop,
  shopMenuPages: CatalogMenuPage[],
  shopProducts: CatalogProduct[],
): PublicCatalogStorefront => {
  const collections = buildStorefrontCollections(shopMenuPages, shopProducts);

  return {
    shop: {
      id: shop.id,
      name: shop.name,
      publicPath: getPreferredPublicPath(shop),
      description: shop.description,
      headerImageUrl: shop.headerImageUrl,
      backgroundImageUrl: shop.backgroundImageUrl,
    },
    menuPages: collections.menuPages,
    unpagedProducts: collections.unpagedProducts,
  };
};

export const buildSellerStorefrontPayload = (
  shop: SellerCatalogShop,
  shopMenuPages: SellerCatalogMenuPage[],
  shopProducts: SellerCatalogProduct[],
) => {
  const collections = buildStorefrontCollections(shopMenuPages, shopProducts);

  return {
    ...shop,
    publicPath: getPreferredPublicPath(shop),
    menuPages: collections.menuPages,
    unpagedProducts: collections.unpagedProducts,
  };
};
