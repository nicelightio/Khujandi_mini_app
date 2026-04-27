import type { CatalogApi } from "../../api/catalog-api";

export type CatalogStorefrontEditorField = {
  name: string;
  label: string;
  value: string;
  inputMode: "text" | "textarea" | "number" | "image";
};

export type CatalogStorefrontEditorTarget =
  | {
      type: "shop";
    }
  | {
      type: "menu-page";
      menuPageId: string;
    }
  | {
      type: "product";
      menuPageId: string | null;
      productId: string;
    }
  | {
      type: "new-menu-page";
    }
  | {
      type: "new-product";
      menuPageId: string;
    };

export type CatalogStorefrontEditor = {
  title: string;
  submitLabel: string;
  target: CatalogStorefrontEditorTarget;
  fields: CatalogStorefrontEditorField[];
};

export type CatalogStorefrontViewModel = {
  shop: {
    id: string;
    publicPath: string;
    name: string;
    description: string | null;
    headerImageUrl: string | null;
    backgroundImageUrl: string | null;
    renameReviewNote: string | null;
  };
  access: {
    canEdit: boolean;
    currentTelegramId: string | null;
    authDebugLabel: string | null;
    statusLabel: string;
    activationHint: string | null;
  };
  menuPages: Array<{
    id: string;
    name: string;
    products: Array<{
      id: string;
      name: string;
      description: string | null;
      imageUrl: string | null;
      priceMinor: number;
      priceLabel: string;
    }>;
  }>;
  unpagedProducts: Array<{
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    priceMinor: number;
    priceLabel: string;
    menuPageId: string | null;
  }>;
  emptyMenuPagesLabel: string;
  emptyProductsLabel: string;
  addMenuPageLabel: string;
  addProductLabel: string;
  successMessage: string | null;
  errorMessage: string | null;
  isSaving: boolean;
  editor: CatalogStorefrontEditor | null;
  debugLogs: string[];
};

export type CatalogStorefrontData = {
  shop: {
    id: string;
    publicPath: string;
    name: string;
    description: string | null;
    headerImageUrl: string | null;
    backgroundImageUrl: string | null;
    renameReviewNote: string | null;
  };
  canEdit: boolean;
  currentTelegramId: string | null;
  authDebugLabel: string | null;
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
  debugLogs: string[];
};

export type CatalogStorefrontState = {
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

export type LoadCatalogStorefrontData = (
  shopId: string,
  api: CatalogApi,
) => Promise<CatalogStorefrontData>;

export type PersistCatalogStorefrontEdit = (
  edit: CatalogStorefrontEdit,
  data: CatalogStorefrontData,
  api: CatalogApi,
) => Promise<{ confirmationMessage: string }>;

export const storefrontNotFoundMessage = "Storefront was not found.";
export const storefrontUnavailableMessage = "Storefront is temporarily unavailable.";

export const createInitialCatalogStorefrontState = (): CatalogStorefrontState => ({
  isLoading: false,
  errorMessage: null,
  data: null,
  editor: null,
  successMessage: null,
  saveErrorMessage: null,
  isSaving: false,
});

export const createLoadingCatalogStorefrontState = (): CatalogStorefrontState => ({
  isLoading: true,
  errorMessage: null,
  data: null,
  editor: null,
  successMessage: null,
  saveErrorMessage: null,
  isSaving: false,
});

export const createLoadedCatalogStorefrontState = (data: CatalogStorefrontData): CatalogStorefrontState => ({
  isLoading: false,
  errorMessage: null,
  data,
  editor: null,
  successMessage: null,
  saveErrorMessage: null,
  isSaving: false,
});

export const createCatalogStorefrontErrorState = (errorMessage: string): CatalogStorefrontState => ({
  isLoading: false,
  errorMessage,
  data: null,
  editor: null,
  successMessage: null,
  saveErrorMessage: null,
  isSaving: false,
});
