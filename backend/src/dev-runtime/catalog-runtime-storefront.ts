import type {
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
} from "../slices/catalog/domain/catalog.types";
import { getPreferredPublicPath } from "../slices/catalog/domain/shop-public-paths";

export const buildSellerStorefrontPayload = (
  shop: SellerCatalogShop,
  shopMenuPages: SellerCatalogMenuPage[],
  shopProducts: SellerCatalogProduct[],
) => {
  const shopMenuPageIds = new Set(shopMenuPages.map((page) => page.id));

  const menuPages = shopMenuPages
    .sort((left, right) => left.position - right.position)
    .map((page) => ({
      id: page.id,
      shopId: page.shopId,
      name: page.name,
      position: page.position,
      products: shopProducts
        .filter((product) => product.menuPageId === page.id)
        .map((product) => ({
          id: product.id,
          shopId: product.shopId,
          menuPageId: product.menuPageId,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          priceMinor: product.priceMinor,
        })),
    }));

  const unpagedProducts = shopProducts
    .filter((product) => product.menuPageId === null || !shopMenuPageIds.has(product.menuPageId))
    .map((product) => ({
      id: product.id,
      shopId: product.shopId,
      menuPageId: product.menuPageId,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceMinor: product.priceMinor,
    }));

  return {
    ...shop,
    publicPath: getPreferredPublicPath(shop),
    menuPages,
    unpagedProducts,
  };
};
