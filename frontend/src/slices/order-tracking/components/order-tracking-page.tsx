import { PageShell } from "../../../shared/ui/page-shell";
import { routes } from "../../../shared/lib/routes";
import type { OrderTrackingViewModel } from "../model/order-tracking-view-model";

type OrderTrackingPageProps = {
  viewModel: OrderTrackingViewModel;
  onSubmitCourierAction: (nextStatus: "PICKED_UP" | "IN_PROGRESS" | "DELIVERED") => void;
};

export const OrderTrackingPage = ({ viewModel, onSubmitCourierAction }: OrderTrackingPageProps) => {
  return (
    <PageShell
      title={viewModel.headline}
      backHref={routes.catalog}
      actionLabel={viewModel.isSubmitting ? viewModel.statusLabel : undefined}
    >
      <section aria-live="polite">
        <p>{viewModel.statusLabel}</p>
        <h2>{viewModel.customerLifecycleTitle}</h2>
        <p>{viewModel.customerLifecycleBody}</p>
        {viewModel.isLoading ? <p>Loading...</p> : null}
        {viewModel.orderId !== null ? <p>{`Order: ${viewModel.orderId}`}</p> : null}
        <p>{viewModel.updatesLabel}</p>
        <p>{viewModel.cursorLabel}</p>
        <p>{viewModel.latestRevisionLabel}</p>
        <p>{viewModel.boundaryNote}</p>
        {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
        {viewModel.recoveryHref !== null && viewModel.recoveryLabel !== null ? (
          <p>
            <a href={viewModel.recoveryHref}>{viewModel.recoveryLabel}</a>
          </p>
        ) : null}
      </section>

      {viewModel.actions.length === 0 ? null : (
        <section>
          <h2>{viewModel.actionsLabel}</h2>
          <div>
            {viewModel.actions.map((action) => (
              <button
                key={action.nextStatus}
                type="button"
                onClick={() => onSubmitCourierAction(action.nextStatus)}
                disabled={viewModel.isSubmitting}
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
};
