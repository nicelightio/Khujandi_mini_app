import { useMemo, useState } from "react";
import { useLanguageContext } from "../../../app/language-context";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { getCopy } from "../../../shared/i18n/copy";
import { createCatalogApi, type CatalogApi } from "../api/catalog-api";
import { CatalogPage } from "../components/catalog-page";
import { useCatalogViewModel } from "../hooks/use-catalog-view-model";
import { useStartShowcaseViewModel } from "../hooks/use-start-showcase-view-model";
import {
  getStorefrontPublicPath,
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

const CatalogShowcaseRoute = ({ api, language }: { api: CatalogApi; language: SupportedLanguage }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [curationState, setCurationState] = useState<{
    isPending: boolean;
    successMessage: string | null;
    errorMessage: string | null;
  }>({
    isPending: false,
    successMessage: null,
    errorMessage: null,
  });
  const showcase = useStartShowcaseViewModel(language, api, reloadKey);
  const copy = getCopy(language).catalog;
  const runCurationMutation = async (mutation: () => Promise<void>) => {
    setCurationState({
      isPending: true,
      successMessage: copy.curationPendingStatus,
      errorMessage: null,
    });

    try {
      await mutation();
      setReloadKey((current) => current + 1);
      setCurationState({
        isPending: false,
        successMessage: copy.curationSuccessStatus,
        errorMessage: null,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : copy.curationFailureStatus;

      setCurationState({
        isPending: false,
        successMessage: null,
        errorMessage: `${copy.curationFailureStatus} ${detail}`,
      });
    }
  };

  return (
    <CatalogPage
      viewModel={{
        headline: copy.showcaseTitle,
        statusLabel: "",
        shops: [],
        isLoading: false,
        errorMessage: null,
        isEmpty: true,
      }}
      showcase={showcase}
      onRemoveShowcaseProduct={(productId) => {
        void runCurationMutation(() => api.removeShowcaseProduct(productId));
      }}
      onUnfavoriteShowcaseShop={(shopId) => {
        void runCurationMutation(() => api.removeShowcaseShop(shopId));
      }}
      curationStatusMessage={curationState.successMessage}
      curationErrorMessage={curationState.errorMessage}
      isCurationPending={curationState.isPending}
    />
  );
};

export const CatalogRoute = ({
  api,
  pathname = getCurrentPathname(),
  loadStorefrontData,
  persistStorefrontEdit,
}: CatalogRouteProps) => {
  const { state } = useLanguageContext();
  const catalogApi = useMemo(() => api ?? createCatalogApi(), [api]);
  const publicPath = useMemo(() => getStorefrontPublicPath(pathname), [pathname]);

  if (publicPath !== null) {
    return (
      <CatalogStorefrontRoute
        shopId={publicPath}
        api={catalogApi}
        language={state.language}
        loadStorefrontData={loadStorefrontData}
        persistStorefrontEdit={persistStorefrontEdit}
      />
    );
  }

  if (pathname === "/") {
    return <CatalogShowcaseRoute api={catalogApi} language={state.language} />;
  }

  return <CatalogBrowseRoute api={catalogApi} language={state.language} />;
};
