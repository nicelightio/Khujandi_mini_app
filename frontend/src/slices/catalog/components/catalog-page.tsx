import { useLanguageContext } from "../../../app/language-context";
import { getCopy } from "../../../shared/i18n/copy";
import { PageShell } from "../../../shared/ui/page-shell";
import type { CatalogViewModel } from "../model/catalog-view-model";

type CatalogPageProps = {
  viewModel: CatalogViewModel;
};

export const CatalogPage = ({ viewModel }: CatalogPageProps) => {
  const { state } = useLanguageContext();
  const copy = getCopy(state.language).catalog;

  return (
    <PageShell title={viewModel.headline}>
      <section aria-live="polite">
        <p>{viewModel.statusLabel}</p>
        {viewModel.isLoading ? <p>{copy.loadingBody}</p> : null}
        {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
      </section>

      {viewModel.isLoading || viewModel.errorMessage !== null || viewModel.isEmpty ? null : (
        <section>
          {viewModel.shops.map((shop) => (
            <article key={shop.id} data-shop-id={shop.id}>
              <h2>{shop.name}</h2>

              {shop.emptyLabel !== null ? (
                <p>{shop.emptyLabel}</p>
              ) : (
                <ul>
                  {shop.products.map((product) => (
                    <li key={product.id}>
                      <strong>{product.name}</strong>
                      <span>{` ${product.priceLabel}`}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>
      )}
    </PageShell>
  );
};
