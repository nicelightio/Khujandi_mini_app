import { AdminPageShell } from "./admin-page-shell";
import type { AdminOrderCancellationViewModel } from "../model/admin-order-cancellation-view-model";

type AdminOrderCancellationPageProps = {
  viewModel: AdminOrderCancellationViewModel;
  onReasonChange: (reasonCode: string) => void;
  onCancellationSubmit: () => void;
  onRefundOutcomeChange: (refundStatus: "DONE" | "REJECTED") => void;
  onRefundNoteChange: (value: string) => void;
  onRefundSubmit: () => void;
};

export const AdminOrderCancellationPage = ({
  viewModel,
  onReasonChange,
  onCancellationSubmit,
  onRefundOutcomeChange,
  onRefundNoteChange,
  onRefundSubmit,
}: AdminOrderCancellationPageProps) => (
  <AdminPageShell title={viewModel.headline}>
    <section aria-live="polite">
      <p>{viewModel.statusLabel}</p>
      <p>{viewModel.orderStatusLabel}</p>
      <p>{viewModel.authBoundaryNote}</p>
      <p>
        Refund state: <strong>{viewModel.refundStatus}</strong>
      </p>
      <p>{viewModel.refundStatusLabel}</p>
      <p>{viewModel.refundVisibilityNote}</p>
      {viewModel.refundNote !== null ? <p>Latest refund note: {viewModel.refundNote}</p> : null}
      {viewModel.successMessage !== null ? <p role="status">{viewModel.successMessage}</p> : null}
      {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
    </section>

    <form
      onSubmit={(event) => {
        event.preventDefault();
        onCancellationSubmit();
      }}
    >
      <fieldset disabled={viewModel.isLoading || viewModel.isCancellationSubmitting}>
        <legend>{viewModel.orderLabel}</legend>
        <label>
          Cancellation reason
          <select
            value={viewModel.selectedReasonCode}
            onChange={(event) => onReasonChange(event.target.value)}
          >
            {viewModel.cancellationReasons.map((reason) => (
              <option key={reason.code} value={reason.code}>
                {reason.label} - {reason.detail}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <button type="submit" disabled={viewModel.isCancellationSubmitDisabled}>
        {viewModel.cancellationSubmitLabel}
      </button>
    </form>

    <form
      onSubmit={(event) => {
        event.preventDefault();
        onRefundSubmit();
      }}
    >
      <fieldset disabled={viewModel.isLoading || viewModel.isRefundSubmitting}>
        <legend>Manual refund tracking</legend>
        <label>
          Refund outcome
          <select
            value={viewModel.selectedRefundOutcome}
            onChange={(event) =>
              onRefundOutcomeChange(event.target.value as "DONE" | "REJECTED")
            }
          >
            {viewModel.refundOutcomeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Refund note
          <textarea
            value={viewModel.refundNoteInput}
            onChange={(event) => onRefundNoteChange(event.target.value)}
          />
        </label>
      </fieldset>
      <button type="submit" disabled={viewModel.isRefundSubmitDisabled}>
        {viewModel.refundSubmitLabel}
      </button>
    </form>
  </AdminPageShell>
);
