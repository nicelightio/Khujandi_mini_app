import type { CatalogStorefrontData, CatalogStorefrontEditor, CatalogStorefrontEditorTarget } from "./types";

export const findStorefrontProduct = (
  data: CatalogStorefrontData,
  target: Extract<CatalogStorefrontEditorTarget, { type: "product" }>,
) => {
  if (target.menuPageId === null) {
    return data.unpagedProducts.find((entry) => entry.id === target.productId);
  }

  const menuPage = data.menuPages.find((entry) => entry.id === target.menuPageId);
  return menuPage?.products.find((entry) => entry.id === target.productId);
};

export const createStorefrontEditor = (
  data: CatalogStorefrontData,
  target: CatalogStorefrontEditorTarget,
): CatalogStorefrontEditor | null => {
  if (target.type === "shop") {
    return {
      title: "Edit shop",
      submitLabel: "Save shop",
      target,
      fields: [
        { name: "name", label: "Shop name", value: data.shop.name, inputMode: "text" },
        { name: "description", label: "Description", value: data.shop.description ?? "", inputMode: "textarea" },
        { name: "headerImageUrl", label: "Shop header image", value: data.shop.headerImageUrl ?? "", inputMode: "image" },
        { name: "backgroundImageUrl", label: "Shop background image", value: data.shop.backgroundImageUrl ?? "", inputMode: "image" },
      ],
    };
  }

  if (target.type === "menu-page") {
    const menuPage = data.menuPages.find((entry) => entry.id === target.menuPageId);

    if (menuPage === undefined) {
      return null;
    }

    return {
      title: "Edit menu page",
      submitLabel: "Save menu page",
      target,
      fields: [{ name: "name", label: "Menu page name", value: menuPage.name, inputMode: "text" }],
    };
  }

  if (target.type === "product") {
    const product = findStorefrontProduct(data, target);

    if (product === undefined) {
      return null;
    }

    return {
      title: "Edit product",
      submitLabel: "Save product",
      target,
      fields: [
        { name: "name", label: "Product name", value: product.name, inputMode: "text" },
        { name: "description", label: "Description", value: product.description ?? "", inputMode: "textarea" },
        { name: "imageUrl", label: "Product image", value: product.imageUrl ?? "", inputMode: "image" },
        { name: "priceMinor", label: "Price (minor units)", value: String(product.priceMinor), inputMode: "number" },
      ],
    };
  }

  if (target.type === "new-menu-page") {
    return {
      title: "Add menu page",
      submitLabel: "Add menu page",
      target,
      fields: [{ name: "name", label: "Menu page name", value: "", inputMode: "text" }],
    };
  }

  return {
    title: "Add product",
    submitLabel: "Add product",
    target,
    fields: [
      { name: "name", label: "Product name", value: "", inputMode: "text" },
      { name: "description", label: "Description", value: "", inputMode: "textarea" },
      { name: "imageUrl", label: "Product image", value: "", inputMode: "image" },
      { name: "priceMinor", label: "Price (minor units)", value: "0", inputMode: "number" },
    ],
  };
};
