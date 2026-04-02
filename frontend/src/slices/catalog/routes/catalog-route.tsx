import type { CatalogApi } from "../api/catalog-api";
import { useLanguageContext } from "../../../app/language-context";
import { CatalogPage } from "../components/catalog-page";
import { useCatalogViewModel } from "../hooks/use-catalog-view-model";

type CatalogRouteProps = {
  api?: CatalogApi;
};

export const CatalogRoute = ({ api }: CatalogRouteProps) => {
  const { state } = useLanguageContext();
  const viewModel = useCatalogViewModel(state.language, api);

  return <CatalogPage viewModel={viewModel} />;
};
