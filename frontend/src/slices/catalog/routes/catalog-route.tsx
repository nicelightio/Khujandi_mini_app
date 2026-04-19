import { useMemo } from "react";
import { useLanguageContext } from "../../../app/language-context";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { createCatalogApi, type CatalogApi } from "../api/catalog-api";
import { CatalogPage } from "../components/catalog-page";
import { useCatalogViewModel } from "../hooks/use-catalog-view-model";
import {
  getStorefrontShopId,
  type LoadCatalogStorefrontData,
  type PersistCatalogStorefrontEdit,
} from "../model/storefront";
import { CatalogStorefrontRoute } from "./catalog-storefront-route";

type CatalogRouteProps = {
  api?: CatalogApi;
  pathname?: string;
  loadStorefrontData?: LoadCatalogStorefrontData;
  persistStorefrontEdit?: PersistCatalogStorefrontEdit;
};

const getCurrentPathname = (): string => {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname;
};

const CatalogBrowseRoute = ({ api, language }: { api: CatalogApi; language: SupportedLanguage }) => {
  const viewModel = useCatalogViewModel(language, api);

  return <CatalogPage viewModel={viewModel} />;
};

export const CatalogRoute = ({
  api,
  pathname = getCurrentPathname(),
  loadStorefrontData,
  persistStorefrontEdit,
}: CatalogRouteProps) => {
  const { state } = useLanguageContext();
  const catalogApi = useMemo(() => api ?? createCatalogApi(), [api]);
  const shopId = useMemo(() => getStorefrontShopId(pathname), [pathname]);

  if (shopId !== null) {
    return (
      <CatalogStorefrontRoute
        shopId={shopId}
        api={catalogApi}
        language={state.language}
        loadStorefrontData={loadStorefrontData}
        persistStorefrontEdit={persistStorefrontEdit}
      />
    );
  }

  return <CatalogBrowseRoute api={catalogApi} language={state.language} />;
};
