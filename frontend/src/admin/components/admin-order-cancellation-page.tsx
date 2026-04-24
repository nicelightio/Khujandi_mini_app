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
    <section aria-live="polite" data-admin-panel="context">
      <span data-admin-ui="micro-label">Cancellation status</span>
      <p>{viewModel.statusLabel}</p>
      <div data-admin-ui="fact-list">
        <div>
          <span>Order</span>
          <strong>{viewModel.orderLabel}</strong>
        </div>
        <div>
          <span>Current state</span>
          <strong>
            <span data-admin-ui="status-chip" data-admin-status-tone="accent">
              {viewModel.orderStatusLabel}
            </span>
          </strong>
        </div>
        <div>
          <span>Refund state</span>
          <strong>
            <span
              data-admin-ui="status-chip"
              data-admin-status-tone={viewModel.refundStatus === "DONE" ? "success" : viewModel.refundStatus === "REJECTED" ? "danger" : "neutral"}
            >
              {viewModel.refundStatus}
            </span>
          </strong>
        </div>
      </div>
      <p>
        Refund state:{" "}
        <strong>
          <span
            data-admin-ui="status-chip"
            data-admin-status-tone={viewModel.refundStatus === "DONE" ? "success" : viewModel.refundStatus === "REJECTED" ? "danger" : "neutral"}
          >
            {viewModel.refundStatus}
          </span>
        </strong>
      </p>
      <p>{viewModel.refundStatusLabel}</p>
      <p>{viewModel.refundVisibilityNote}</p>
      <p>{viewModel.authBoundaryNote}</p>
      {viewModel.refundNote !== null ? <p>Latest refund note: {viewModel.refundNote}</p> : null}
      {viewModel.successMessage !== null ? <p role="status">{viewModel.successMessage}</p> : null}
      {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
    </section>

    <form
      onSubmit={(event) => {
        event.preventDefault();
        onCancellationSubmit();
      }}
      data-admin-panel="workspace"
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
      <div data-admin-ui="selection-table">
        {viewModel.cancellationReasons.map((reason) => (
          <div
            key={reason.code}
            data-admin-ui="selection-row"
            data-selected={reason.code === viewModel.selectedReasonCode ? "true" : "false"}
          >
            <strong>{reason.label}</strong>
            <span>{reason.detail}</span>
            <span>{reason.code}</span>
          </div>
        ))}
      </div>
      <button type="submit" data-magnetic="true" disabled={viewModel.isCancellationSubmitDisabled}>
        {viewModel.cancellationSubmitLabel}
      </button>
    </form>

    <form
      onSubmit={(event) => {
        event.preventDefault();
        onRefundSubmit();
      }}
      data-admin-panel="workspace"
    >
      <fieldset disabled={viewModel.isLoading || viewModel.isRefundSubmitting}>
        <legend>Manual refund tracking</legend>
        <div data-admin-ui="fact-list">
          <div>
            <span>Visible state</span>
            <strong>
              <span
                data-admin-ui="status-chip"
                data-admin-status-tone={viewModel.refundStatus === "DONE" ? "success" : viewModel.refundStatus === "REJECTED" ? "danger" : "neutral"}
              >
                {viewModel.refundStatus}
              </span>
            </strong>
          </div>
          <div>
            <span>Operator note</span>
            <strong>{viewModel.refundNote === null ? "Not recorded" : "Available"}</strong>
          </div>
        </div>
        <label>
          Refund outcome
          <select
            value={viewModel.selectedRefundOutcome}
            onChange={(event) => onRefundOutcomeChange(event.target.value as "DONE" | "REJECTED")}
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
      <button type="submit" data-magnetic="true" disabled={viewModel.isRefundSubmitDisabled}>
        {viewModel.refundSubmitLabel}
      </button>
    </form>
  </AdminPageShell>
);
