import { useEffect, useState } from "react";
import { createCatalogApi, type CatalogApi } from "../api/catalog-api";
import {
  createCatalogViewModel,
  createErrorCatalogViewModel,
  createLoadingCatalogViewModel,
  type CatalogViewModel,
} from "../model/catalog-view-model";

export const useCatalogViewModel = (api?: CatalogApi): CatalogViewModel => {
  const [viewModel, setViewModel] = useState<CatalogViewModel>(() => createLoadingCatalogViewModel());

  useEffect(() => {
    const catalogApi = api ?? createCatalogApi();
    let isCancelled = false;

    const loadCatalog = async () => {
      setViewModel(createLoadingCatalogViewModel());

      try {
        const catalog = await catalogApi.listCatalog();

        if (!isCancelled) {
          setViewModel(createCatalogViewModel(catalog));
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : "Catalog is temporarily unavailable.";
          setViewModel(createErrorCatalogViewModel(message));
        }
      }
    };

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, [api]);

  return viewModel;
};
