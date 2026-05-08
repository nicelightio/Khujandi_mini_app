import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { getCopy } from "../../../shared/i18n/copy";
import { useOptionalUiShell } from "../../../shared/state/ui-shell-context";
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
  const shell = useOptionalUiShell();
  const [canCurateShowcase, setCanCurateShowcase] = useState(false);
  const [isCurrentShopFavorite, setIsCurrentShopFavorite] = useState(false);
  const [curationState, setCurationState] = useState<{
    isPending: boolean;
    successMessage: string | null;
    errorMessage: string | null;
  }>({
    isPending: false,
    successMessage: null,
    errorMessage: null,
  });
  const copy = getCopy(language).catalog;
  const storefront = useCatalogStorefront({
    shopId,
    api,
    language,
    telegramBridge: shell?.telegramBridge,
    loadStorefrontData,
    persistStorefrontEdit,
  });
  const currentShopId = storefront.storefront?.shop.id ?? null;

  useEffect(() => {
    let isCancelled = false;

    const loadCurationState = async () => {
      try {
        const state = await api.getShowcaseAdminState();

        if (!isCancelled) {
          setCanCurateShowcase(state.canCurate);
        }

        if (!state.canCurate || currentShopId === null) {
          if (!isCancelled) {
            setIsCurrentShopFavorite(false);
          }

          return;
        }

        const showcase = await api.getStartShowcase();

        if (!isCancelled) {
          setIsCurrentShopFavorite(showcase.favoriteShops.some((shop) => shop.id === currentShopId));
        }
      } catch {
        if (!isCancelled) {
          setCanCurateShowcase(false);
          setIsCurrentShopFavorite(false);
        }
      }
    };

    void loadCurationState();

    return () => {
      isCancelled = true;
    };
  }, [api, currentShopId]);

  const refreshCurationState = async () => {
    try {
      const state = await api.getShowcaseAdminState();
      setCanCurateShowcase(state.canCurate);

      if (!state.canCurate || currentShopId === null) {
        setIsCurrentShopFavorite(false);

        return;
      }

      const showcase = await api.getStartShowcase();
      setIsCurrentShopFavorite(showcase.favoriteShops.some((shop) => shop.id === currentShopId));
    } catch {
      setCanCurateShowcase(false);
      setIsCurrentShopFavorite(false);
    }
  };

  const runCurationMutation = async (mutation: () => Promise<void>) => {
    setCurationState({
      isPending: true,
      successMessage: copy.curationPendingStatus,
      errorMessage: null,
    });

    try {
      await mutation();
      await refreshCurationState();
      setCurationState({
        isPending: false,
        successMessage: copy.curationSuccessStatus,
        errorMessage: null,
      });
    } catch (error) {
      await refreshCurationState();

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
      viewModel={storefront.viewModel}
      storefront={storefront.storefront}
      onActivateEditor={storefront.handleActivateEditor}
      onEditorFieldChange={storefront.handleEditorFieldChange}
      onCancelEditor={storefront.handleCancelEditor}
      onSubmitEditor={() => {
        void storefront.handleSubmitEditor();
      }}
      canCurateShowcaseFromStorefront={canCurateShowcase}
      isStorefrontShopFavorite={isCurrentShopFavorite}
      onAddStorefrontProductToShowcase={(productId) => {
        void runCurationMutation(() => api.addShowcaseProduct(productId));
      }}
      onFavoriteShowcaseShop={(targetShopId) => {
        void runCurationMutation(() => api.addShowcaseShop(targetShopId));
      }}
      onUnfavoriteShowcaseShop={(targetShopId) => {
        void runCurationMutation(() => api.removeShowcaseShop(targetShopId));
      }}
      curationStatusMessage={curationState.successMessage}
      curationErrorMessage={curationState.errorMessage}
      isCurationPending={curationState.isPending}
    />
  );
};
