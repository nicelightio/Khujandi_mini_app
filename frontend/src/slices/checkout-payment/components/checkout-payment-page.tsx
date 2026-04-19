import { useLanguageContext } from "../../../app/language-context";
import { getCopy } from "../../../shared/i18n/copy";
import { routes } from "../../../shared/lib/routes";
import { PageShell } from "../../../shared/ui/page-shell";
import type { CheckoutPaymentViewModel } from "../model/checkout-payment-view-model";

type CheckoutPaymentPageProps = {
  viewModel: CheckoutPaymentViewModel;
  onPrimaryAction: () => void;
};

export const CheckoutPaymentPage = ({ viewModel, onPrimaryAction }: CheckoutPaymentPageProps) => {
  const { state } = useLanguageContext();
  const copy = getCopy(state.language);

  return (
    <PageShell
      title={viewModel.headline}
      backHref={routes.catalog}
      backLabel={copy.catalog.headline}
      actionLabel={viewModel.primaryActionLabel}
      isActionPending={viewModel.isSubmitting}
      isActionDisabled={viewModel.isActionDisabled}
      bottomAction={viewModel.isLoading ? undefined : (
        <button type="button" disabled={viewModel.isActionDisabled} onClick={onPrimaryAction}>
          {viewModel.primaryActionLabel}
        </button>
      )}
      swipeBehavior="locked"
    >
      <section aria-live="polite">
        <p>{viewModel.statusLabel}</p>
        {viewModel.isLoading || viewModel.isSubmitting ? <p>{copy.checkout.loadingBody}</p> : null}
        {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
        {viewModel.retryMessage !== null ? <p>{viewModel.retryMessage}</p> : null}
        {viewModel.successMessage !== null ? <p>{viewModel.successMessage}</p> : null}
      </section>

      {viewModel.isLoading ? null : (
        <section>
          <p>{copy.checkout.backendBoundaryNote}</p>
          <ul>
            {viewModel.supportingNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      )}
    </PageShell>
  );
};
