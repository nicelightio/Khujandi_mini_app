import { Fragment } from "react";
import { AdminPageShell } from "./admin-page-shell";
import type { AdminAssignmentSortKey, AdminAssignmentViewModel } from "../model/admin-assignment-view-model";
import type { AdminOperatorDeliveryOrderStatus } from "../api/admin-assignment-api";

type AdminAssignmentPageProps = {
  viewModel: AdminAssignmentViewModel;
  onSortChange: (sortKey: AdminAssignmentSortKey) => void;
  onToggleHistory: (orderId: string) => void;
  onCreateTargetedOffer: (orderId: string) => void;
  onCreateBroadcastOffer: (orderId: string) => void;
  onConfirmStatusChange: (orderId: string, nextStatus: AdminOperatorDeliveryOrderStatus) => void;
};

export const AdminAssignmentPage = ({
  viewModel,
  onSortChange,
  onToggleHistory,
  onCreateTargetedOffer,
  onCreateBroadcastOffer,
  onConfirmStatusChange,
}: AdminAssignmentPageProps) => (
  <AdminPageShell title={viewModel.headline}>
    <section aria-live="polite" data-admin-panel="context">
      <span data-admin-ui="micro-label">Read-only operator window</span>
      <p>{viewModel.statusLabel}</p>
      <div data-admin-ui="fact-list">
        <div>
          <span>Window</span>
          <strong>{viewModel.windowLabel}</strong>
        </div>
        <div>
          <span>Generated</span>
          <strong>{viewModel.generatedAtLabel}</strong>
        </div>
        <div>
          <span>Status cursor</span>
          <strong>{viewModel.revisionLabel}</strong>
        </div>
      </div>
      {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
    </section>

    <section data-admin-panel="workspace" data-admin-assignment="orders">
      <span data-admin-ui="micro-label">Delivery operations</span>
      <div
        role="alert"
        data-admin-assignment="courier-alert"
        data-admin-alert-state={viewModel.alertOrders.length === 0 ? "clear" : "active"}
      >
        <strong>{viewModel.alertLabel}</strong>
        {viewModel.alertOrders.length === 0 ? <span>Clear</span> : null}
        {viewModel.alertOrders.length > 0 ? (
          <ul>
            {viewModel.alertOrders.map((order) => (
              <li key={order.orderId}>
                <strong>{order.publicOrderNumber}</strong>
                <span>{order.reasonLabel}</span>
                <span data-admin-ui="status-chip" data-admin-status-tone={order.severityTone}>
                  {order.severityLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div data-admin-assignment="sort-controls" aria-label="Sort operator delivery orders">
        {viewModel.sortControls.map((control) => (
          <button
            key={control.key}
            type="button"
            data-magnetic="true"
            data-admin-sort-key={control.key}
            aria-pressed={control.isActive}
            title={control.description}
            onClick={() => onSortChange(control.key)}
          >
            {control.label}
          </button>
        ))}
      </div>
      {viewModel.orders.length === 0 ? <p>{viewModel.emptyLabel}</p> : null}
      {viewModel.orders.length > 0 ? (
        <div data-admin-assignment="table-wrap">
          <table data-admin-ui="table" data-admin-assignment="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Courier</th>
                <th>Assigned / claimed</th>
                <th>Latest message</th>
                <th>Actions</th>
                <th>History</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.orders.map((order) => (
                <Fragment key={order.orderId}>
                  <tr key={order.orderId} data-admin-assignment-row={order.orderId}>
                    <td>
                      <strong>{order.publicOrderNumber}</strong>
                      <span>{order.summaryLabel}</span>
                      <span>Created {order.createdAtLabel}</span>
                    </td>
                    <td>
                      <span
                        data-admin-ui="status-chip"
                        data-admin-status-tone={order.severityTone}
                        data-admin-severity={order.severityLabel}
                        data-admin-delayed-alert={order.isDelayedAlert ? "true" : "false"}
                      >
                        {order.severityLabel}
                      </span>
                    </td>
                    <td>
                      <strong>{order.statusLabel}</strong>
                      <span>{order.statusRevisionLabel}</span>
                    </td>
                    <td>
                      <strong>{order.courierLabel}</strong>
                      <span
                        data-admin-ui="status-chip"
                        data-admin-status-tone={order.courierMarkerLabel === "Absent" ? "accent" : "success"}
                      >
                        {order.courierMarkerLabel}
                      </span>
                    </td>
                    <td>
                      <span>Assigned {order.assignedAtLabel}</span>
                      <span>Claimed {order.claimedAtLabel}</span>
                    </td>
                    <td>
                      <strong>{order.latestMessageLabel}</strong>
                      <span>{order.latestMessageMetaLabel}</span>
                    </td>
                    <td>
                      <div data-admin-assignment="action-cells" aria-label={`Guarded actions for ${order.publicOrderNumber}`}>
                        {order.actionCells.map((action) => (
                          <button
                            key={action.key}
                            type="button"
                            disabled={!action.isEnabled}
                            data-admin-action-cell={action.key}
                            title={action.detailLabel}
                            onClick={() => {
                              if (action.key === "targeted_offer") {
                                onCreateTargetedOffer(order.orderId);
                              } else if (action.key === "broadcast_offer") {
                                onCreateBroadcastOffer(order.orderId);
                              } else if (action.key === "status_control" && action.nextStatus !== undefined) {
                                onConfirmStatusChange(order.orderId, action.nextStatus);
                              }
                            }}
                          >
                            <span>{action.label}</span>
                            <strong>{action.stateLabel}</strong>
                          </button>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        data-magnetic="true"
                        aria-expanded={order.isExpanded}
                        onClick={() => onToggleHistory(order.orderId)}
                      >
                        {order.isExpanded ? "Hide history" : "Show history"}
                      </button>
                    </td>
                  </tr>
                  {order.isExpanded ? (
                    <tr key={`${order.orderId}-history`} data-admin-assignment-history={order.orderId}>
                      <td colSpan={8}>
                        {order.history.length === 0 ? <p>No status history yet.</p> : null}
                        {order.history.length > 0 ? (
                          <table data-admin-ui="table" data-admin-assignment="history-table">
                            <thead>
                              <tr>
                                <th>Status</th>
                                <th>Previous</th>
                                <th>Changed</th>
                                <th>Actor</th>
                                <th>Time in status</th>
                                <th>Since created</th>
                                <th>Comments</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.history.map((history) => (
                                <tr key={history.id}>
                                  <td>{history.statusLabel}</td>
                                  <td>{history.previousStatusLabel}</td>
                                  <td>{history.changedAtLabel}</td>
                                  <td>{history.actorLabel}</td>
                                  <td>{history.timeInStatusLabel}</td>
                                  <td>{history.timeSinceCreatedLabel}</td>
                                  <td>{history.commentsLabel}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : null}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  </AdminPageShell>
);
