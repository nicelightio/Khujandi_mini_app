import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { createCatalogApi, type CatalogApi } from "../api/catalog-api";
import {
  createErrorStartShowcaseViewModel,
  createLoadingStartShowcaseViewModel,
  createStartShowcaseViewModel,
  type StartShowcaseViewModel,
} from "../model/showcase-view-model";

export const useStartShowcaseViewModel = (
  language: SupportedLanguage,
  api?: CatalogApi,
  reloadKey = 0,
): StartShowcaseViewModel => {
  const [viewModel, setViewModel] = useState<StartShowcaseViewModel>(() =>
    createLoadingStartShowcaseViewModel(language),
  );

  useEffect(() => {
    const catalogApi = api ?? createCatalogApi();
    let isCancelled = false;

    const loadShowcase = async () => {
      setViewModel(createLoadingStartShowcaseViewModel(language));

      try {
        const [showcase, adminStateResult] = await Promise.all([
          catalogApi.getStartShowcase(),
          catalogApi.getShowcaseAdminState().catch(() => ({ canCurate: false })),
        ]);

        if (!isCancelled) {
          setViewModel(createStartShowcaseViewModel(showcase, adminStateResult.canCurate, language));
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : undefined;
          setViewModel(createErrorStartShowcaseViewModel(message, language));
        }
      }
    };

    void loadShowcase();

    return () => {
      isCancelled = true;
    };
  }, [api, language, reloadKey]);

  return viewModel;
};
