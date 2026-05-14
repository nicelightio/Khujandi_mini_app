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
      <span data-admin-ui="micro-label">Операторское окно только для чтения</span>
      <p>{viewModel.statusLabel}</p>
      <div data-admin-ui="fact-list">
        <div>
          <span>Окно</span>
          <strong>{viewModel.windowLabel}</strong>
        </div>
        <div>
          <span>Сформировано</span>
          <strong>{viewModel.generatedAtLabel}</strong>
        </div>
        <div>
          <span>Курсор статуса</span>
          <strong>{viewModel.revisionLabel}</strong>
        </div>
      </div>
      {viewModel.errorMessage !== null ? <p role="alert">{viewModel.errorMessage}</p> : null}
    </section>

    <section data-admin-panel="workspace" data-admin-assignment="orders">
      <span data-admin-ui="micro-label">Операции доставки</span>
      <div
        role="alert"
        data-admin-assignment="courier-alert"
        data-admin-alert-state={viewModel.alertOrders.length === 0 ? "clear" : "active"}
      >
        <div data-admin-assignment="courier-alert-head">
          <strong>{viewModel.alertLabel}</strong>
          <span>Заказов: {viewModel.alertOrders.length}</span>
        </div>
        {viewModel.alertOrders.length === 0 ? <span data-admin-assignment="courier-alert-clear">Нет проблем</span> : null}
        {viewModel.alertOrders.length > 0 ? (
          <ul>
            {viewModel.alertOrders.map((order) => (
              <li
                key={order.orderId}
                aria-label={`${order.publicOrderNumber}: ${order.reasonLabel}, ${order.severityLabel}`}
                title={order.reasonLabel}
              >
                <strong>{order.publicOrderNumber}</strong>
                <span data-admin-ui="status-chip" data-admin-status-tone={order.severityTone}>
                  {order.severityLabel}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div data-admin-assignment="sort-controls" aria-label="Сортировка заказов доставки">
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
                <th>Заказ</th>
                <th>Курьер</th>
                <th>Последнее сообщение</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {viewModel.orders.map((order) => (
                <Fragment key={order.orderId}>
                  <tr data-admin-assignment-row={order.orderId}>
                    <td data-admin-assignment-cell="order" data-cell-label="Заказ">
                      <div data-admin-assignment="order-main">
                        <strong>{order.publicOrderNumber}</strong>
                        <span>{order.summaryLabel}</span>
                      </div>
                      <div data-admin-assignment="order-meta">
                        <span>Создан {order.createdAtLabel}</span>
                        <span
                          data-admin-ui="status-chip"
                          data-admin-status-tone={order.severityTone}
                          data-admin-severity={order.severityLabel}
                          data-admin-delayed-alert={order.isDelayedAlert ? "true" : "false"}
                        >
                          {order.severityLabel}
                        </span>
                      </div>
                      <div data-admin-assignment="order-secondary">
                        <span>{order.statusLabel}</span>
                        <span>Ревизия {order.statusRevisionLabel}</span>
                      </div>
                    </td>
                    <td data-admin-assignment-cell="courier" data-cell-label="Курьер">
                      <div data-admin-assignment="courier-main">
                        <strong>{order.courierLabel}</strong>
                        <span
                          data-admin-ui="status-chip"
                          data-admin-status-tone={order.courierMarkerLabel === "Нет" ? "accent" : "success"}
                        >
                          {order.courierMarkerLabel}
                        </span>
                      </div>
                      <div data-admin-assignment="courier-times">
                        <span>Назначен {order.assignedAtLabel}</span>
                        <span>Принят {order.claimedAtLabel}</span>
                      </div>
                    </td>
                    <td data-admin-assignment-cell="message" data-cell-label="Последнее сообщение">
                      <strong>{order.latestMessageLabel}</strong>
                      <span>{order.latestMessageMetaLabel}</span>
                    </td>
                    <td data-admin-assignment-cell="actions" data-cell-label="Действия">
                      <div data-admin-assignment="action-cells" aria-label={`Защищенные действия для ${order.publicOrderNumber}`}>
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
                        <button
                          type="button"
                          data-magnetic="true"
                          data-admin-assignment="history-toggle"
                          aria-expanded={order.isExpanded}
                          onClick={() => onToggleHistory(order.orderId)}
                        >
                          {order.isExpanded ? "Скрыть историю" : "Показать историю"}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {order.isExpanded ? (
                    <tr key={`${order.orderId}-history`} data-admin-assignment-history={order.orderId}>
                      <td colSpan={4}>
                        {order.history.length === 0 ? <p>Истории статусов пока нет.</p> : null}
                        {order.history.length > 0 ? (
                          <table data-admin-ui="table" data-admin-assignment="history-table">
                            <thead>
                              <tr>
                                <th>Статус</th>
                                <th>Предыдущий</th>
                                <th>Изменен</th>
                                <th>Автор</th>
                                <th>В статусе</th>
                                <th>С создания</th>
                                <th>Комментарии</th>
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
