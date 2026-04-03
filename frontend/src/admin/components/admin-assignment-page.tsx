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
}: AdminAssignmentPageProps) => (
  <AdminPageShell title={viewModel.headline}>
    <section aria-live="polite">
      <p>{viewModel.statusLabel}</p>
      <p>{viewModel.authBoundaryNote}</p>
      {viewModel.successMessage !== null ? <p role="status">{viewModel.successMessage}</p> : null}
      {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
    </section>

    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
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
      <button type="submit" disabled={viewModel.isSubmitDisabled}>
        {viewModel.submitLabel}
      </button>
    </form>
  </AdminPageShell>
);
