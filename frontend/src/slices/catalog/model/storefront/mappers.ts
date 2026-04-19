import { isStorefrontPathname } from "../../../../shared/lib/routes";
import type { CatalogApi, SellerStorefrontAccess } from "../../api/catalog-api";
import { findStorefrontProduct } from "./editor";
import {
  storefrontNotFoundMessage,
  storefrontUnavailableMessage,
  type CatalogStorefrontData,
  type LoadCatalogStorefrontData,
  type PersistCatalogStorefrontEdit,
} from "./types";

const storefrontPrefix = "/shops/";

export const getStorefrontShopId = (pathname: string): string | null => {
  if (!isStorefrontPathname(pathname)) {
    return null;
  }

  return decodeURIComponent(pathname.slice(storefrontPrefix.length));
};

export const buildStorefrontDataFromSellerAccess = (sellerAccess: SellerStorefrontAccess): CatalogStorefrontData => ({
  shop: {
    id: sellerAccess.id,
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
});

export const buildStorefrontDataFromPublicShop = (
  publicShop: Awaited<ReturnType<CatalogApi["listCatalog"]>>[number],
): CatalogStorefrontData => ({
  shop: {
    id: publicShop.id,
    name: publicShop.name,
    description: null,
    headerImageUrl: null,
    backgroundImageUrl: null,
    renameReviewNote: null,
  },
  canEdit: false,
  currentTelegramId: null,
  authDebugLabel: null,
  accessStatusLabel: "Browse-only storefront. Seller edit mode stays hidden until ownership is confirmed server-side.",
  activationHint: null,
  menuPages:
    publicShop.products.length === 0
      ? []
      : [
          {
            id: `${publicShop.id}-page-main`,
            name: "Shared storefront menu",
            products: publicShop.products.map((product) => ({
              id: product.id,
              name: product.name,
              description: null,
              imageUrl: null,
              priceMinor: product.priceMinor,
            })),
          },
        ],
  unpagedProducts: [],
});

export const defaultLoadStorefrontData: LoadCatalogStorefrontData = async (shopId, api) => {
  const [publicCatalogResult, sellerAccessResult] = await Promise.allSettled([
    api.listCatalog(),
    api.getSellerStorefrontAccess(shopId),
  ]);

  if (sellerAccessResult.status === "fulfilled" && sellerAccessResult.value !== null) {
    return buildStorefrontDataFromSellerAccess(sellerAccessResult.value);
  }

  if (publicCatalogResult.status === "fulfilled") {
    const publicShop = publicCatalogResult.value.find((shop) => shop.id === shopId) ?? null;

    if (publicShop !== null) {
      return buildStorefrontDataFromPublicShop(publicShop);
    }
  }

  if (publicCatalogResult.status === "fulfilled" && sellerAccessResult.status === "fulfilled") {
    throw new Error(storefrontNotFoundMessage);
  }

  if (publicCatalogResult.status === "rejected") {
    throw publicCatalogResult.reason instanceof Error
      ? publicCatalogResult.reason
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

  if (edit.target.type === "shop") {
    await api.updateSellerShop({
      shopId: edit.shopId,
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
      shopId: edit.shopId,
      name: fieldValue("name").trim() || menuPage?.name || "Menu page",
    });

    return { confirmationMessage: "Menu page changes saved on the shared storefront tree." };
  }

  if (edit.target.type === "new-menu-page") {
    await api.createSellerMenuPage({
      shopId: edit.shopId,
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
      shopId: edit.shopId,
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
    shopId: edit.shopId,
    menuPageId: target.menuPageId,
    name: fieldValue("name").trim() || "New product",
    description: fieldValue("description").trim() || null,
    imageUrl: fieldValue("imageUrl").trim() || null,
    priceMinor: Number(fieldValue("priceMinor")) || 0,
  });

  return { confirmationMessage: "Product changes saved on the shared storefront tree." };
};
