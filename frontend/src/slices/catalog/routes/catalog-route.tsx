import { CatalogPage } from "../components/catalog-page";
import { useCatalogViewModel } from "../hooks/use-catalog-view-model";

export const CatalogRoute = () => {
  const viewModel = useCatalogViewModel();

  return <CatalogPage viewModel={viewModel} />;
};
