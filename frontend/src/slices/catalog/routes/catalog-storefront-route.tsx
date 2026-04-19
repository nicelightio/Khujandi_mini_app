import type { SupportedLanguage } from "../../../shared/i18n/languages";
import type { CatalogApi } from "../api/catalog-api";
import { CatalogPage } from "../components/catalog-page";
import { useCatalogStorefront } from "../hooks/use-catalog-storefront";
import type { LoadCatalogStorefrontData, PersistCatalogStorefrontEdit } from "../model/storefront";

type CatalogStorefrontRouteProps = {
  shopId: string;
  api: CatalogApi;
  language: SupportedLanguage;
  loadStorefrontData?: LoadCatalogStorefrontData;
  persistStorefrontEdit?: PersistCatalogStorefrontEdit;
};

export const CatalogStorefrontRoute = ({
  shopId,
  api,
  language,
  loadStorefrontData,
  persistStorefrontEdit,
}: CatalogStorefrontRouteProps) => {
  const storefront = useCatalogStorefront({
    shopId,
    api,
    language,
    loadStorefrontData,
    persistStorefrontEdit,
  });

  return (
    <CatalogPage
      viewModel={storefront.viewModel}
      storefront={storefront.storefront}
      onActivateEditor={storefront.handleActivateEditor}
      onEditorFieldChange={storefront.handleEditorFieldChange}
      onCancelEditor={storefront.handleCancelEditor}
      onSubmitEditor={() => {
        void storefront.handleSubmitEditor();
      }}
    />
  );
};
