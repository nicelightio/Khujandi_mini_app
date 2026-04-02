import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { createCatalogApi, type CatalogApi } from "../api/catalog-api";
import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
  type CatalogViewModel,
} from "../model/catalog-view-model";

export const useCatalogViewModel = (
  language: SupportedLanguage,
  api?: CatalogApi,
): CatalogViewModel => {
  const [viewModel, setViewModel] = useState<CatalogViewModel>(() => createLoadingCatalogViewModel(language));

  useEffect(() => {
    const catalogApi = api ?? createCatalogApi();
    let isCancelled = false;

    const loadCatalog = async () => {
      setViewModel(createLoadingCatalogViewModel(language));

      try {
        const catalog = await catalogApi.listCatalog();

        if (!isCancelled) {
          setViewModel(createCatalogViewModel(catalog, language));
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : undefined;
          setViewModel(createErrorCatalogViewModel(message, language));
        }
      }
    };

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [api, language]);

  return viewModel;
};
