import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  CatalogWriteEvent,
  CatalogFavoriteShopReference,
  CatalogShowcaseProductReference,
  SellerCatalogMenuPage,
  SellerCatalogProduct,
  SellerCatalogShop,
  SellerShopBinding,
} from "../slices/catalog/domain/catalog.types";

export type CatalogRuntimeState = {
  shops: SellerCatalogShop[];
  menuPages: SellerCatalogMenuPage[];
  products: SellerCatalogProduct[];
  showcaseProducts: CatalogShowcaseProductReference[];
  favoriteShops: CatalogFavoriteShopReference[];
  bindings: SellerShopBinding[];
  events: CatalogWriteEvent[];
  nextShopId: number;
  nextMenuPageId: number;
  nextProductId: number;
  nextShowcaseProductId: number;
  nextFavoriteShopId: number;
  nextBindingId: number;
};

export const cloneShop = (shop: SellerCatalogShop): SellerCatalogShop => ({ ...shop });
export const cloneMenuPage = (page: SellerCatalogMenuPage): SellerCatalogMenuPage => ({ ...page });
export const cloneProduct = (product: SellerCatalogProduct): SellerCatalogProduct => ({ ...product });
export const cloneShowcaseProduct = (reference: CatalogShowcaseProductReference): CatalogShowcaseProductReference => ({ ...reference });
export const cloneFavoriteShop = (reference: CatalogFavoriteShopReference): CatalogFavoriteShopReference => ({ ...reference });
export const cloneBinding = (binding: SellerShopBinding): SellerShopBinding => ({ ...binding });

export const cloneCatalogState = (state: CatalogRuntimeState): CatalogRuntimeState => ({
  shops: state.shops.map(cloneShop),
  menuPages: state.menuPages.map(cloneMenuPage),
  products: state.products.map(cloneProduct),
  showcaseProducts: (state.showcaseProducts ?? []).map(cloneShowcaseProduct),
  favoriteShops: (state.favoriteShops ?? []).map(cloneFavoriteShop),
  bindings: state.bindings.map(cloneBinding),
  events: state.events.map((event) => ({
    ...event,
    payload: { ...event.payload },
  })),
  nextShopId: state.nextShopId,
  nextMenuPageId: state.nextMenuPageId,
  nextProductId: state.nextProductId,
  nextShowcaseProductId: state.nextShowcaseProductId ?? 1,
  nextFavoriteShopId: state.nextFavoriteShopId ?? 1,
  nextBindingId: state.nextBindingId,
});

const catalogSeedBaselinePath = resolve(process.cwd(), "backend", "prisma", "seeds", "catalog-runtime-baseline.json");

let cachedCatalogSeedBaseline: CatalogRuntimeState | null = null;

const loadCatalogSeedBaseline = (): CatalogRuntimeState => {
  if (cachedCatalogSeedBaseline === null) {
    cachedCatalogSeedBaseline = JSON.parse(readFileSync(catalogSeedBaselinePath, "utf8")) as CatalogRuntimeState;
  }

  return cloneCatalogState(cachedCatalogSeedBaseline);
};

export const createCatalogRuntimeState = (): CatalogRuntimeState => ({
  ...loadCatalogSeedBaseline(),
});
