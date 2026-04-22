import { isStorefrontPathname } from "../../../../shared/lib/routes";
import type { PublicStorefront, SellerStorefrontAccess } from "../../api/catalog-api";
import { findStorefrontProduct } from "./editor";
import {
  storefrontNotFoundMessage,
  storefrontUnavailableMessage,
  type CatalogStorefrontData,
  type LoadCatalogStorefrontData,
  type PersistCatalogStorefrontEdit,
} from "./types";

const storefrontPrefix = "/shops/";

const createDebugBootstrapLogs = (lines: string[]): string[] => lines.map((line) => `[bootstrap] ${line}`);

export const getStorefrontPublicPath = (pathname: string): string | null => {
  if (!isStorefrontPathname(pathname)) {
    return null;
  }

  return decodeURIComponent(pathname.slice(storefrontPrefix.length));
};

export const buildStorefrontDataFromSellerAccess = (sellerAccess: SellerStorefrontAccess): CatalogStorefrontData => ({
  shop: {
    id: sellerAccess.id,
    publicPath: sellerAccess.publicPath,
    name: sellerAccess.name,
    description: sellerAccess.description,
    headerImageUrl: sellerAccess.headerImageUrl,
    backgroundImageUrl: sellerAccess.backgroundImageUrl,
    renameReviewNote:
      sellerAccess.requiresManualRenameReview === true
        ? "Further shop renames now require manual paid accounting review."
        : null,
  },
  canEdit: true,
  currentTelegramId: null,
  authDebugLabel: null,
  accessStatusLabel: "Seller edit mode is active on the shared storefront tree.",
  activationHint: "Click or long press the existing shop, menu, or product blocks to edit them.",
  menuPages: sellerAccess.menuPages.map((menuPage) => ({
    id: menuPage.id,
    name: menuPage.name,
    products: menuPage.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceMinor: product.priceMinor,
    })),
  })),
  unpagedProducts: sellerAccess.unpagedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    priceMinor: product.priceMinor,
    menuPageId: product.menuPageId,
  })),
  debugLogs: createDebugBootstrapLogs([
    `seller access loaded for shop ${sellerAccess.id}`,
    `header image ${sellerAccess.headerImageUrl === null ? "null" : `len=${sellerAccess.headerImageUrl.length}`}`,
    `background image ${sellerAccess.backgroundImageUrl === null ? "null" : `len=${sellerAccess.backgroundImageUrl.length}`}`,
  ]),
});

export const buildStorefrontDataFromPublicStorefront = (
  publicStorefront: PublicStorefront,
): CatalogStorefrontData => ({
  shop: {
    id: publicStorefront.shop.id,
    publicPath: publicStorefront.shop.publicPath,
    name: publicStorefront.shop.name,
    description: publicStorefront.shop.description,
    headerImageUrl: publicStorefront.shop.headerImageUrl,
    backgroundImageUrl: publicStorefront.shop.backgroundImageUrl,
    renameReviewNote: null,
  },
  canEdit: false,
  currentTelegramId: null,
  authDebugLabel: null,
  accessStatusLabel: "Browse-only storefront. Seller edit mode stays hidden until ownership is confirmed server-side.",
  activationHint: null,
  menuPages: publicStorefront.menuPages.map((menuPage) => ({
    id: menuPage.id,
    name: menuPage.name,
    products: menuPage.products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      priceMinor: product.priceMinor,
    })),
  })),
  unpagedProducts: publicStorefront.unpagedProducts.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    priceMinor: product.priceMinor,
    menuPageId: product.menuPageId,
  })),
  debugLogs: createDebugBootstrapLogs([
    `public storefront loaded for shop ${publicStorefront.shop.id}`,
    "seller access unavailable or not granted",
  ]),
});

export const defaultLoadStorefrontData: LoadCatalogStorefrontData = async (publicPath, api) => {
  const [publicStorefrontResult, sellerAccessResult] = await Promise.allSettled([
    api.getPublicStorefront(publicPath),
    api.getSellerStorefrontAccess(publicPath),
  ]);

  if (sellerAccessResult.status === "fulfilled" && sellerAccessResult.value !== null) {
    return buildStorefrontDataFromSellerAccess(sellerAccessResult.value);
  }

  if (publicStorefrontResult.status === "fulfilled" && publicStorefrontResult.value !== null) {
    return buildStorefrontDataFromPublicStorefront(publicStorefrontResult.value);
  }

  if (publicStorefrontResult.status === "fulfilled" && sellerAccessResult.status === "fulfilled") {
    throw new Error(storefrontNotFoundMessage);
  }

  if (publicStorefrontResult.status === "rejected") {
    throw publicStorefrontResult.reason instanceof Error
      ? publicStorefrontResult.reason
      : new Error(storefrontUnavailableMessage);
  }

  if (sellerAccessResult.status === "rejected") {
    throw sellerAccessResult.reason instanceof Error
      ? sellerAccessResult.reason
      : new Error(storefrontUnavailableMessage);
  }

  throw new Error(storefrontUnavailableMessage);
};

export const defaultPersistStorefrontEdit: PersistCatalogStorefrontEdit = async (edit, data, api) => {
  const fieldValue = (name: string): string => edit.fields.find((field) => field.name === name)?.value ?? "";
  const canonicalShopId = data.shop.id;

  if (edit.target.type === "shop") {
    await api.updateSellerShop({
      shopId: canonicalShopId,
      name: fieldValue("name").trim() || data.shop.name,
      description: fieldValue("description").trim() || null,
      headerImageUrl: fieldValue("headerImageUrl").trim() || null,
      backgroundImageUrl: fieldValue("backgroundImageUrl").trim() || null,
    });

    return { confirmationMessage: "Shop changes saved on the shared storefront tree." };
  }

  if (edit.target.type === "menu-page") {
    const target = edit.target;
    const menuPage = data.menuPages.find((entry) => entry.id === target.menuPageId);

    await api.updateSellerMenuPage({
      menuPageId: target.menuPageId,
      shopId: canonicalShopId,
      name: fieldValue("name").trim() || menuPage?.name || "Menu page",
    });

    return { confirmationMessage: "Menu page changes saved on the shared storefront tree." };
  }

  if (edit.target.type === "new-menu-page") {
    await api.createSellerMenuPage({
      shopId: canonicalShopId,
      name: fieldValue("name").trim() || "New menu page",
      position: data.menuPages.length + 1,
    });

    return { confirmationMessage: "Menu page changes saved on the shared storefront tree." };
  }

  if (edit.target.type === "product") {
    const target = edit.target;
    const product = findStorefrontProduct(data, target);

    await api.updateSellerProduct({
      productId: target.productId,
      shopId: canonicalShopId,
      menuPageId: target.menuPageId,
      name: fieldValue("name").trim() || product?.name || "Product",
      description: fieldValue("description").trim() || null,
      imageUrl: fieldValue("imageUrl").trim() || null,
      priceMinor: Number(fieldValue("priceMinor")) || 0,
    });

    return { confirmationMessage: "Product changes saved on the shared storefront tree." };
  }

  const target = edit.target;

  await api.createSellerProduct({
    shopId: canonicalShopId,
    menuPageId: target.menuPageId,
    name: fieldValue("name").trim() || "New product",
    description: fieldValue("description").trim() || null,
    imageUrl: fieldValue("imageUrl").trim() || null,
    priceMinor: Number(fieldValue("priceMinor")) || 0,
  });

  return { confirmationMessage: "Product changes saved on the shared storefront tree." };
};
