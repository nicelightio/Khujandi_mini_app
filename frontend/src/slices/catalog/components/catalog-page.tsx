import { PageShell } from "../../../shared/ui/page-shell";
import type { CatalogViewModel } from "../model/catalog-view-model";

type CatalogPageProps = {
  viewModel: CatalogViewModel;
};

export const CatalogPage = ({ viewModel }: CatalogPageProps) => {
  return (
    <PageShell title="Catalog">
      <section>
        <p>{viewModel.headline}</p>
        <p>{viewModel.statusLabel}</p>
      </section>
    </PageShell>
  );
};
