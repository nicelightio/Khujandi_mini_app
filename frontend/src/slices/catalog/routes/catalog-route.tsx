import { useEffect, useMemo, useState } from "react";
import { createCatalogApi, type CatalogApi, type SellerStorefrontAccess } from "../api/catalog-api";
import { useLanguageContext } from "../../../app/language-context";
import {
  CatalogPage,
  type CatalogStorefrontEditor,
  type CatalogStorefrontEditorField,
  type CatalogStorefrontEditorTarget,
  type CatalogStorefrontViewModel,
} from "../components/catalog-page";
import { useCatalogViewModel } from "../hooks/use-catalog-view-model";
import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
  type CatalogViewModel,
} from "../model/catalog-view-model";
import { isStorefrontPathname } from "../../../shared/lib/routes";

type CatalogRouteProps = {
  api?: CatalogApi;
  pathname?: string;
  loadStorefrontData?: (shopId: string, api: CatalogApi) => Promise<CatalogStorefrontData>;
  persistStorefrontEdit?: (
    edit: CatalogStorefrontEdit,
    data: CatalogStorefrontData,
    api: CatalogApi,
  ) => Promise<{ confirmationMessage: string }>;
};

export type CatalogStorefrontData = {
  shop: {
    id: string;
    name: string;
    description: string | null;
    headerImageUrl: string | null;
    backgroundImageUrl: string | null;
    renameReviewNote: string | null;
  };
  canEdit: boolean;
  accessStatusLabel: string;
  activationHint: string | null;
  menuPages: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      priceMinor: number;
    }>;
  }>;
  unpagedProducts: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    priceMinor: number;
    menuPageId: string | null;
  }>;
};

type CatalogStorefrontState = {
  isLoading: boolean;
  errorMessage: string | null;
  data: CatalogStorefrontData | null;
  editor: CatalogStorefrontEditor | null;
  successMessage: string | null;
  saveErrorMessage: string | null;
  isSaving: boolean;
};

export type CatalogStorefrontEdit = {
  shopId: string;
  target: CatalogStorefrontEditorTarget;
  fields: CatalogStorefrontEditorField[];
};

const getCurrentPathname = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
};

const storefrontPrefix = "/shops/";

const getStorefrontShopId = (pathname: string): string | null => {
  if (!isStorefrontPathname(pathname)) {
    return null;
  }

  return decodeURIComponent(pathname.slice(storefrontPrefix.length));
};

const formatPrice = (priceMinor: number): string => `${(priceMinor / 100).toFixed(2)} TJS`;

const storefrontNotFoundMessage = "Storefront was not found.";
const storefrontUnavailableMessage = "Storefront is temporarily unavailable.";

const buildStorefrontDataFromSellerAccess = (sellerAccess: SellerStorefrontAccess): CatalogStorefrontData => ({
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

const buildStorefrontDataFromPublicShop = (
  publicShop: Awaited<ReturnType<CatalogApi["listCatalog"]>>[number],
): CatalogStorefrontData => {
  return {
    shop: {
      id: publicShop.id,
      name: publicShop.name,
      description: null,
      headerImageUrl: null,
      backgroundImageUrl: null,
      renameReviewNote: null,
    },
    canEdit: false,
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
  };
};

const findStorefrontProduct = (
  data: CatalogStorefrontData,
  target: Extract<CatalogStorefrontEditorTarget, { type: "product" }>,
) => {
  if (target.menuPageId === null) {
    return data.unpagedProducts.find((entry) => entry.id === target.productId);
  }

  const menuPage = data.menuPages.find((entry) => entry.id === target.menuPageId);
  return menuPage?.products.find((entry) => entry.id === target.productId);
};

const defaultLoadStorefrontData = async (shopId: string, api: CatalogApi): Promise<CatalogStorefrontData> => {
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

const createEditor = (data: CatalogStorefrontData, target: CatalogStorefrontEditorTarget): CatalogStorefrontEditor | null => {
  if (target.type === "shop") {
    return {
      title: "Edit shop",
      submitLabel: "Save shop",
      target,
      fields: [
        { name: "name", label: "Shop name", value: data.shop.name, inputMode: "text" },
        { name: "description", label: "Description", value: data.shop.description ?? "", inputMode: "textarea" },
        { name: "headerImageUrl", label: "Header image URL", value: data.shop.headerImageUrl ?? "", inputMode: "text" },
        { name: "backgroundImageUrl", label: "Background image URL", value: data.shop.backgroundImageUrl ?? "", inputMode: "text" },
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
        { name: "imageUrl", label: "Image URL", value: product.imageUrl ?? "", inputMode: "text" },
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
      { name: "imageUrl", label: "Image URL", value: "", inputMode: "text" },
      { name: "priceMinor", label: "Price (minor units)", value: "0", inputMode: "number" },
    ],
  };
};

const buildStorefrontViewModel = (state: CatalogStorefrontState): CatalogStorefrontViewModel | undefined => {
  if (state.data === null) {
    return undefined;
  }

  return {
    shop: state.data.shop,
    access: {
      canEdit: state.data.canEdit,
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

const buildStorefrontCatalogViewModel = (
  state: CatalogStorefrontState,
  language: Parameters<typeof createLoadingCatalogViewModel>[0],
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

  return createCatalogViewModel(
    [
      {
        id: state.data.shop.id,
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
};

const defaultPersistStorefrontEdit = async (
  edit: CatalogStorefrontEdit,
  data: CatalogStorefrontData,
  api: CatalogApi,
): Promise<{ confirmationMessage: string }> => {
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

export const CatalogRoute = ({
  api,
  pathname = getCurrentPathname(),
  loadStorefrontData = defaultLoadStorefrontData,
  persistStorefrontEdit = defaultPersistStorefrontEdit,
}: CatalogRouteProps) => {
  const { state } = useLanguageContext();
  const catalogApi = useMemo(() => api ?? createCatalogApi(), [api]);
  const browseViewModel = useCatalogViewModel(state.language, catalogApi);
  const shopId = useMemo(() => getStorefrontShopId(pathname), [pathname]);
  const [storefrontState, setStorefrontState] = useState<CatalogStorefrontState>({
    isLoading: false,
    errorMessage: null,
    data: null,
    editor: null,
    successMessage: null,
    saveErrorMessage: null,
    isSaving: false,
  });

  useEffect(() => {
    if (shopId === null) {
      setStorefrontState({
        isLoading: false,
        errorMessage: null,
        data: null,
        editor: null,
        successMessage: null,
        saveErrorMessage: null,
        isSaving: false,
      });
      return;
    }

    let isActive = true;

    setStorefrontState({
      isLoading: true,
      errorMessage: null,
      data: null,
      editor: null,
      successMessage: null,
      saveErrorMessage: null,
      isSaving: false,
    });

    void loadStorefrontData(shopId, catalogApi)
      .then((data) => {
        if (!isActive) {
          return;
        }

        setStorefrontState({
          isLoading: false,
          errorMessage: null,
          data,
          editor: null,
          successMessage: null,
          saveErrorMessage: null,
          isSaving: false,
        });
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        setStorefrontState({
          isLoading: false,
          errorMessage: error instanceof Error ? error.message : storefrontUnavailableMessage,
          data: null,
          editor: null,
          successMessage: null,
          saveErrorMessage: null,
          isSaving: false,
        });
      });

    return () => {
      isActive = false;
    };
  }, [catalogApi, loadStorefrontData, shopId]);

  const viewModel = shopId === null ? browseViewModel : buildStorefrontCatalogViewModel(storefrontState, state.language);

  const handleActivateEditor = (target: CatalogStorefrontEditorTarget) => {
    setStorefrontState((currentState) => {
      if (currentState.data === null || !currentState.data.canEdit) {
        return currentState;
      }

      return {
        ...currentState,
        editor: createEditor(currentState.data, target),
        successMessage: null,
        saveErrorMessage: null,
      };
    });
  };

  const handleEditorFieldChange = (name: string, value: string) => {
    setStorefrontState((currentState) => {
      if (currentState.editor === null) {
        return currentState;
      }

      return {
        ...currentState,
        editor: {
          ...currentState.editor,
          fields: currentState.editor.fields.map((field) => (field.name === name ? { ...field, value } : field)),
        },
      };
    });
  };

  const handleSubmitEditor = async () => {
    if (shopId === null) {
      return;
    }

    const currentEditor = storefrontState.editor;

    if (currentEditor === null || storefrontState.data === null || storefrontState.isSaving) {
      return;
    }

    setStorefrontState((currentState) => ({
      ...currentState,
      isSaving: true,
      successMessage: null,
      saveErrorMessage: null,
    }));

    try {
      const edit: CatalogStorefrontEdit = {
        shopId,
        target: currentEditor.target,
        fields: currentEditor.fields,
      };
      const result = await persistStorefrontEdit(edit, storefrontState.data, catalogApi);
      const reloadedData = await loadStorefrontData(shopId, catalogApi);

      setStorefrontState((currentState) => {
        if (currentState.data === null) {
          return currentState;
        }

        return {
          ...currentState,
          data: reloadedData,
          editor: null,
          isSaving: false,
          successMessage: result.confirmationMessage,
          saveErrorMessage: null,
        };
      });
    } catch (error) {
      setStorefrontState((currentState) => ({
        ...currentState,
        isSaving: false,
        saveErrorMessage: error instanceof Error ? error.message : "Storefront save failed.",
      }));
    }
  };

  return (
    <CatalogPage
      viewModel={viewModel}
      storefront={shopId === null ? undefined : buildStorefrontViewModel(storefrontState)}
      onActivateEditor={handleActivateEditor}
      onEditorFieldChange={handleEditorFieldChange}
      onCancelEditor={() => {
        setStorefrontState((currentState) => ({
          ...currentState,
          editor: null,
          saveErrorMessage: null,
        }));
      }}
      onSubmitEditor={() => {
        void handleSubmitEditor();
      }}
    />
  );
};
