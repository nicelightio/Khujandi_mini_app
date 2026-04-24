import { AdminPageShell } from "./admin-page-shell";
import type { AdminAssignmentViewModel } from "../model/admin-assignment-view-model";

type AdminAssignmentPageProps = {
  viewModel: AdminAssignmentViewModel;
  onCourierChange: (courierId: string) => void;
  onSubmit: () => void;
};

export const AdminAssignmentPage = ({
  viewModel,
  onCourierChange,
  onSubmit,
}: AdminAssignmentPageProps) => {
  const selectedCourier = viewModel.couriers.find((courier) => courier.id === viewModel.selectedCourierId) ?? null;

  return (
    <AdminPageShell title={viewModel.headline}>
      <section aria-live="polite" data-admin-panel="context">
        <span data-admin-ui="micro-label">Assignment status</span>
        <p>{viewModel.statusLabel}</p>
        <div data-admin-ui="fact-list">
          <div>
            <span>Order</span>
            <strong>{viewModel.orderLabel}</strong>
          </div>
          <div>
            <span>Selected courier</span>
            <strong>
              <span data-admin-ui="status-chip" data-admin-status-tone={selectedCourier === null ? "neutral" : "accent"}>
                {selectedCourier === null ? "Not selected" : selectedCourier.label}
              </span>
            </strong>
          </div>
          <div>
            <span>Session boundary</span>
            <strong>{viewModel.authBoundaryNote}</strong>
          </div>
        </div>
        {viewModel.successMessage !== null ? <p role="status">{viewModel.successMessage}</p> : null}
        {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
      </section>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        data-admin-panel="workspace"
      >
        <fieldset disabled={viewModel.isLoading || viewModel.isSubmitting}>
          <legend>{viewModel.orderLabel}</legend>
          <label>
            Courier
            <select
              value={viewModel.selectedCourierId}
              onChange={(event) => onCourierChange(event.target.value)}
            >
              {viewModel.couriers.map((courier) => (
                <option key={courier.id} value={courier.id}>
                  {courier.label} - {courier.detail}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
        <div data-admin-ui="selection-table">
          {viewModel.couriers.map((courier) => (
            <div
              key={courier.id}
              data-admin-ui="selection-row"
              data-selected={courier.id === viewModel.selectedCourierId ? "true" : "false"}
            >
              <strong>{courier.label}</strong>
              <span>{courier.detail}</span>
              <span>{courier.id}</span>
            </div>
          ))}
        </div>
        <button type="submit" data-magnetic="true" disabled={viewModel.isSubmitDisabled}>
          {viewModel.submitLabel}
        </button>
      </form>
    </AdminPageShell>
  );
};
