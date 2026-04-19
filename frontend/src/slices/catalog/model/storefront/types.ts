import type { CatalogApi } from "../../api/catalog-api";
import type {
  CatalogStorefrontEditor,
  CatalogStorefrontEditorField,
  CatalogStorefrontEditorTarget,
} from "../../components/catalog-page";

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
  currentTelegramId: string | null;
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
