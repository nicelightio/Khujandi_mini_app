import type { CatalogApi } from "../api/catalog-api";
import { CatalogPage } from "../components/catalog-page";
import { useCatalogViewModel } from "../hooks/use-catalog-view-model";

type CatalogRouteProps = {
  api?: CatalogApi;
};

export const CatalogRoute = ({ api }: CatalogRouteProps) => {
  const viewModel = useCatalogViewModel(api);

  return <CatalogPage viewModel={viewModel} />;
};
