import { AdminPageShell } from "./admin-page-shell";
import type {
  AdminCourierStaffCard,
  AdminCourierStaffCardOrder,
  AdminCourierStaffRow,
  AdminOperatorStaffCard,
  AdminOperatorStaffCardOrder,
  AdminOperatorStaffRow,
  AdminStaffActiveStatus,
  AdminStaffLifecycleAction,
  AdminStaffLifecycleHistoryItem,
  AdminStaffRatingDelta,
  AdminStaffRatingAdjustmentHistoryItem,
} from "../api/admin-staff-api";

export type AdminStaffTab = "couriers" | "operators";

export type AdminStaffDetailSelection =
  | {
      kind: "courier";
      staffId: string;
    }
  | {
      kind: "operator";
      staffId: string;
    };

export type AdminStaffDetailView =
  | {
      kind: "courier";
      detail: AdminCourierStaffCard;
    }
  | {
      kind: "operator";
      detail: AdminOperatorStaffCard;
    };

export type AdminStaffCreateCourierFormValue = {
  telegramUserId: string;
  nickname: string;
};

export type AdminStaffCreateOperatorFormValue = {
  email: string;
  nickname: string;
  password: string;
};

export type AdminStaffOneTimePasswordNotice = {
  label: string;
  value: string;
};

export type AdminStaffPageProps = {
  role: "admin" | "boss";
  activeTab: AdminStaffTab;
  includeInactive: boolean;
  isLoading: boolean;
  isCommandSubmitting: boolean;
  errorMessage: string | null;
  commandSuccessMessage: string | null;
  commandErrorMessage: string | null;
  oneTimePasswordNotice: AdminStaffOneTimePasswordNotice | null;
  detailStatus: "idle" | "loading" | "ready" | "error";
  detailSelection: AdminStaffDetailSelection | null;
  detail: AdminStaffDetailView | null;
  detailErrorMessage: string | null;
  createCourierForm: AdminStaffCreateCourierFormValue;
  createOperatorForm: AdminStaffCreateOperatorFormValue;
  operatorNicknameDrafts: Record<string, string>;
  operatorPasswordDrafts: Record<string, string>;
  couriers: AdminCourierStaffRow[];
  operators: AdminOperatorStaffRow[];
  onTabChange: (tab: AdminStaffTab) => void;
  onIncludeInactiveChange: (includeInactive: boolean) => void;
  onCreateCourierChange: <TKey extends keyof AdminStaffCreateCourierFormValue>(
    field: TKey,
    value: AdminStaffCreateCourierFormValue[TKey],
  ) => void;
  onCreateOperatorChange: <TKey extends keyof AdminStaffCreateOperatorFormValue>(
    field: TKey,
    value: AdminStaffCreateOperatorFormValue[TKey],
  ) => void;
  onCreateCourier: () => void;
  onCreateOperator: () => void;
  onOpenCourierDetail: (courierUserId: string) => void;
  onOpenOperatorDetail: (operatorAdminAccountId: string) => void;
  onCloseDetail: () => void;
  onDeactivateCourier: (courierUserId: string) => void;
  onDeactivateOperator: (operatorAdminAccountId: string) => void;
  onReactivateCourier: (courierUserId: string) => void;
  onReactivateOperator: (operatorAdminAccountId: string) => void;
  onAdjustCourierRating: (courierUserId: string, delta: AdminStaffRatingDelta) => void;
  onAdjustOperatorRating: (operatorAdminAccountId: string, delta: AdminStaffRatingDelta) => void;
  onOperatorNicknameDraftChange: (operatorAdminAccountId: string, nickname: string) => void;
  onOperatorPasswordDraftChange: (operatorAdminAccountId: string, password: string) => void;
  onUpdateOperatorNickname: (operatorAdminAccountId: string) => void;
  onResetOperatorPassword: (operatorAdminAccountId: string) => void;
  onDismissOneTimePassword: () => void;
  onCopyOneTimePassword: () => void;
};

const formatStatusLabel = (status: AdminStaffActiveStatus): string =>
  status === "active" ? "Активен" : "Архив";

const statusTone = (status: AdminStaffActiveStatus): "success" | "neutral" =>
  status === "active" ? "success" : "neutral";

const formatSignedNumber = (value: number): string => (value > 0 ? `+${value}` : String(value));

const formatReviewRating = (row: AdminCourierStaffRow): string => {
  if (row.courierAverageReviewRating === null || row.courierClientReviewCount === 0) {
    return "Нет оценок";
  }

  return `${row.courierAverageReviewRating.toFixed(1)} / 5 (${row.courierClientReviewCount})`;
};

const formatPercent = (value: number): string => {
  const rounded = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);

  return `${rounded}%`;
};

const formatTimestamp = (value: string | null): string => {
  if (value === null) {
    return "Не записано";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatLifecycleAction = (action: AdminStaffLifecycleAction): string => {
  switch (action) {
    case "created":
      return "Создание";
    case "deactivated":
      return "Деактивация";
    case "reactivated":
      return "Возврат";
    case "nickname_updated":
      return "Nickname";
  }
};

const formatCourierProblemReason = (reason: AdminCourierStaffCardOrder["problemReasons"][number]): string => {
  switch (reason) {
    case "unfinished":
      return "Не завершен";
    case "future_failed":
      return "Future failed bucket";
    case "client_rating_1":
      return "Client rating 1";
  }
};

const formatOperatorProblemReason = (reason: AdminOperatorStaffCardOrder["problemReasons"][number]): string => {
  switch (reason) {
    case "future_failed":
      return "Future failed bucket";
    case "not_personally_completed":
      return "Не завершил лично";
  }
};

const renderDetailFact = (label: string, value: string | number | null) => (
  <div>
    <span>{label}</span>
    <strong>{value ?? "Не записано"}</strong>
  </div>
);

type CourierTableProps = {
  role: "admin" | "boss";
  couriers: AdminCourierStaffRow[];
  isLoading: boolean;
  isCommandSubmitting: boolean;
  detailSelection: AdminStaffDetailSelection | null;
  onOpenCourierDetail: (courierUserId: string) => void;
  onDeactivateCourier: (courierUserId: string) => void;
  onReactivateCourier: (courierUserId: string) => void;
  onAdjustCourierRating: (courierUserId: string, delta: AdminStaffRatingDelta) => void;
};

type OperatorTableProps = {
  role: "admin" | "boss";
  operators: AdminOperatorStaffRow[];
  isLoading: boolean;
  isCommandSubmitting: boolean;
  detailSelection: AdminStaffDetailSelection | null;
  operatorNicknameDrafts: Record<string, string>;
  operatorPasswordDrafts: Record<string, string>;
  onOpenOperatorDetail: (operatorAdminAccountId: string) => void;
  onDeactivateOperator: (operatorAdminAccountId: string) => void;
  onReactivateOperator: (operatorAdminAccountId: string) => void;
  onAdjustOperatorRating: (operatorAdminAccountId: string, delta: AdminStaffRatingDelta) => void;
  onOperatorNicknameDraftChange: (operatorAdminAccountId: string, nickname: string) => void;
  onOperatorPasswordDraftChange: (operatorAdminAccountId: string, password: string) => void;
  onUpdateOperatorNickname: (operatorAdminAccountId: string) => void;
  onResetOperatorPassword: (operatorAdminAccountId: string) => void;
};

const renderCourierActions = ({
  role,
  courier,
  isCommandSubmitting,
  detailSelection,
  onOpenCourierDetail,
  onDeactivateCourier,
  onReactivateCourier,
  onAdjustCourierRating,
}: Omit<CourierTableProps, "couriers" | "isLoading"> & { courier: AdminCourierStaffRow }) => {
  const detailButton = (
    <button
      type="button"
      data-admin-staff-action={`open-courier-detail-${courier.courierUserId}`}
      data-magnetic="true"
      aria-pressed={detailSelection?.kind === "courier" && detailSelection.staffId === courier.courierUserId}
      disabled={isCommandSubmitting}
      onClick={() => onOpenCourierDetail(courier.courierUserId)}
    >
      Карточка
    </button>
  );

  if (courier.activeStatus === "soft_deleted") {
    return (
      <div data-admin-staff="action-stack">
        {detailButton}
        {role === "boss" ? (
          <button
            type="button"
            data-admin-staff-action={`reactivate-courier-${courier.courierUserId}`}
            data-magnetic="true"
            disabled={isCommandSubmitting}
            onClick={() => onReactivateCourier(courier.courierUserId)}
          >
            Вернуть курьера
          </button>
        ) : (
          <span data-admin-staff="action-note">Архив</span>
        )}
      </div>
    );
  }

  return (
    <div data-admin-staff="action-stack">
      {detailButton}
      <button
        type="button"
        data-admin-staff-action={`deactivate-courier-${courier.courierUserId}`}
        data-magnetic="true"
        disabled={isCommandSubmitting}
        onClick={() => onDeactivateCourier(courier.courierUserId)}
      >
        Деактивировать
      </button>
      <div data-admin-staff="rating-actions" aria-label={`Order rating courier ${courier.telegramUserId}`}>
        <button
          type="button"
          data-admin-staff-action={`courier-rating-plus-${courier.courierUserId}`}
          data-magnetic="true"
          disabled={isCommandSubmitting}
          onClick={() => onAdjustCourierRating(courier.courierUserId, 1)}
        >
          +1
        </button>
        <button
          type="button"
          data-admin-staff-action={`courier-rating-minus-${courier.courierUserId}`}
          data-magnetic="true"
          disabled={isCommandSubmitting}
          onClick={() => onAdjustCourierRating(courier.courierUserId, -1)}
        >
          -1
        </button>
      </div>
    </div>
  );
};

const renderOperatorActions = ({
  role,
  operator,
  isCommandSubmitting,
  detailSelection,
  operatorNicknameDrafts,
  operatorPasswordDrafts,
  onOpenOperatorDetail,
  onDeactivateOperator,
  onReactivateOperator,
  onAdjustOperatorRating,
  onOperatorNicknameDraftChange,
  onOperatorPasswordDraftChange,
  onUpdateOperatorNickname,
  onResetOperatorPassword,
}: Omit<OperatorTableProps, "operators" | "isLoading"> & { operator: AdminOperatorStaffRow }) => {
  const detailButton = (
    <button
      type="button"
      data-admin-staff-action={`open-operator-detail-${operator.operatorAdminAccountId}`}
      data-magnetic="true"
      aria-pressed={
        detailSelection?.kind === "operator" && detailSelection.staffId === operator.operatorAdminAccountId
      }
      disabled={isCommandSubmitting}
      onClick={() => onOpenOperatorDetail(operator.operatorAdminAccountId)}
    >
      Карточка
    </button>
  );

  if (operator.activeStatus === "soft_deleted") {
    return (
      <div data-admin-staff="action-stack">
        {detailButton}
        {role === "boss" ? (
          <button
            type="button"
            data-admin-staff-action={`reactivate-operator-${operator.operatorAdminAccountId}`}
            data-magnetic="true"
            disabled={isCommandSubmitting}
            onClick={() => onReactivateOperator(operator.operatorAdminAccountId)}
          >
            Вернуть оператора
          </button>
        ) : (
          <span data-admin-staff="action-note">Архив</span>
        )}
      </div>
    );
  }

  return (
    <div data-admin-staff="action-stack">
      {detailButton}
      <button
        type="button"
        data-admin-staff-action={`deactivate-operator-${operator.operatorAdminAccountId}`}
        data-magnetic="true"
        disabled={isCommandSubmitting}
        onClick={() => onDeactivateOperator(operator.operatorAdminAccountId)}
      >
        Деактивировать
      </button>
      <div data-admin-staff="rating-actions" aria-label={`Processed-order rating ${operator.email}`}>
        <button
          type="button"
          data-admin-staff-action={`operator-rating-plus-${operator.operatorAdminAccountId}`}
          data-magnetic="true"
          disabled={isCommandSubmitting}
          onClick={() => onAdjustOperatorRating(operator.operatorAdminAccountId, 1)}
        >
          +1
        </button>
        <button
          type="button"
          data-admin-staff-action={`operator-rating-minus-${operator.operatorAdminAccountId}`}
          data-magnetic="true"
          disabled={isCommandSubmitting}
          onClick={() => onAdjustOperatorRating(operator.operatorAdminAccountId, -1)}
        >
          -1
        </button>
      </div>
      {role === "boss" ? (
        <>
          <form
            data-admin-staff-inline="operator-nickname"
            onSubmit={(event) => {
              event.preventDefault();
              onUpdateOperatorNickname(operator.operatorAdminAccountId);
            }}
          >
            <label>
              Nickname
              <input
                data-admin-staff-nickname-input={operator.operatorAdminAccountId}
                value={operatorNicknameDrafts[operator.operatorAdminAccountId] ?? operator.nickname ?? ""}
                onChange={(event) =>
                  onOperatorNicknameDraftChange(operator.operatorAdminAccountId, event.target.value)
                }
              />
            </label>
            <button
              type="submit"
              data-admin-staff-action={`update-operator-nickname-${operator.operatorAdminAccountId}`}
              data-magnetic="true"
              disabled={isCommandSubmitting}
            >
              Обновить nickname
            </button>
          </form>
          <form
            data-admin-staff-inline="operator-password-reset"
            onSubmit={(event) => {
              event.preventDefault();
              onResetOperatorPassword(operator.operatorAdminAccountId);
            }}
          >
            <label>
              Новый пароль
              <input
                type="password"
                autoComplete="new-password"
                data-admin-staff-password-reset={operator.operatorAdminAccountId}
                value={operatorPasswordDrafts[operator.operatorAdminAccountId] ?? ""}
                onChange={(event) =>
                  onOperatorPasswordDraftChange(operator.operatorAdminAccountId, event.target.value)
                }
              />
            </label>
            <button
              type="submit"
              data-admin-staff-action={`reset-operator-password-${operator.operatorAdminAccountId}`}
              data-magnetic="true"
              disabled={isCommandSubmitting}
            >
              Сбросить пароль
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
};

const renderCourierTable = ({
  role,
  couriers,
  isLoading,
  isCommandSubmitting,
  detailSelection,
  onOpenCourierDetail,
  onDeactivateCourier,
  onReactivateCourier,
  onAdjustCourierRating,
}: CourierTableProps) => (
  <div data-admin-staff="table-wrap">
    {couriers.length === 0 && !isLoading ? <p>Активные курьеры для Staff panel не найдены.</p> : null}
    {couriers.length > 0 ? (
      <table data-admin-ui="table" data-admin-staff="couriers-table">
        <thead>
          <tr>
            <th>Telegram user id</th>
            <th>Nickname</th>
            <th>Состояние</th>
            <th>Доставлено</th>
            <th>Order rating</th>
            <th>Client rating</th>
            <th>Неуспешно</th>
            <th>Manual</th>
            <th>Команды</th>
          </tr>
        </thead>
        <tbody>
          {couriers.map((courier) => (
            <tr key={courier.courierUserId} data-admin-staff-row={courier.courierUserId}>
              <td>
                <strong>{courier.telegramUserId}</strong>
                <span>{courier.courierUserId}</span>
              </td>
              <td>{courier.nickname ?? "Без nickname"}</td>
              <td>
                <span data-admin-ui="status-chip" data-admin-status-tone={statusTone(courier.activeStatus)}>
                  {formatStatusLabel(courier.activeStatus)}
                </span>
              </td>
              <td>{courier.deliveredOrdersCount}</td>
              <td>{courier.courierOrderRating}</td>
              <td>{formatReviewRating(courier)}</td>
              <td>
                <strong>{formatPercent(courier.unsuccessfulPercent)}</strong>
                <span>{courier.unsuccessfulOrdersCount} заказов</span>
              </td>
              <td>
                <strong>{formatSignedNumber(courier.manualRatingAdjustment)}</strong>
                {courier.automaticPenalties !== 0 ? <span>Авто: {formatSignedNumber(courier.automaticPenalties)}</span> : null}
              </td>
              <td>
                {renderCourierActions({
                  role,
                  courier,
                  isCommandSubmitting,
                  detailSelection,
                  onOpenCourierDetail,
                  onDeactivateCourier,
                  onReactivateCourier,
                  onAdjustCourierRating,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : null}
  </div>
);

const renderOperatorTable = ({
  role,
  operators,
  isLoading,
  isCommandSubmitting,
  detailSelection,
  operatorNicknameDrafts,
  operatorPasswordDrafts,
  onOpenOperatorDetail,
  onDeactivateOperator,
  onReactivateOperator,
  onAdjustOperatorRating,
  onOperatorNicknameDraftChange,
  onOperatorPasswordDraftChange,
  onUpdateOperatorNickname,
  onResetOperatorPassword,
}: OperatorTableProps) => (
  <div data-admin-staff="table-wrap">
    {operators.length === 0 && !isLoading ? <p>Активные операторы для Staff panel не найдены.</p> : null}
    {operators.length > 0 ? (
      <table data-admin-ui="table" data-admin-staff="operators-table">
        <thead>
          <tr>
            <th>Email / login</th>
            <th>Nickname</th>
            <th>Состояние</th>
            <th>Auth</th>
            <th>Обработано</th>
            <th>Processed-order rating</th>
            <th>Manual</th>
            <th>Команды</th>
          </tr>
        </thead>
        <tbody>
          {operators.map((operator) => (
            <tr key={operator.operatorAdminAccountId} data-admin-staff-row={operator.operatorAdminAccountId}>
              <td>
                <strong>{operator.email}</strong>
                <span>{operator.operatorAdminAccountId}</span>
              </td>
              <td>{operator.nickname ?? "Без nickname"}</td>
              <td>
                <span data-admin-ui="status-chip" data-admin-status-tone={statusTone(operator.activeStatus)}>
                  {formatStatusLabel(operator.activeStatus)}
                </span>
              </td>
              <td>{operator.authActive ? "Логин активен" : "Логин выключен"}</td>
              <td>{operator.processedOrdersCount}</td>
              <td>{operator.operatorRating}</td>
              <td>{formatSignedNumber(operator.manualRatingAdjustment)}</td>
              <td>
                {renderOperatorActions({
                  role,
                  operator,
                  isCommandSubmitting,
                  detailSelection,
                  operatorNicknameDrafts,
                  operatorPasswordDrafts,
                  onOpenOperatorDetail,
                  onDeactivateOperator,
                  onReactivateOperator,
                  onAdjustOperatorRating,
                  onOperatorNicknameDraftChange,
                  onOperatorPasswordDraftChange,
                  onUpdateOperatorNickname,
                  onResetOperatorPassword,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : null}
  </div>
);

const renderHistory = (items: AdminStaffLifecycleHistoryItem[], emptyLabel: string) => (
  <div data-admin-staff-detail="history-block">
    <h3>Lifecycle</h3>
    {items.length === 0 ? <p>{emptyLabel}</p> : null}
    {items.length > 0 ? (
      <ul data-admin-staff-detail="history-list">
        {items.map((item) => (
          <li key={`${item.action}-${item.actorAdminAccountId}-${item.createdAt}`}>
            <strong>{formatLifecycleAction(item.action)}</strong>
            <span>{formatTimestamp(item.createdAt)}</span>
            <span>Actor: {item.actorAdminAccountId}</span>
            {item.reason !== null ? <span>Reason: {item.reason}</span> : null}
            {item.newNickname !== null ? <span>Nickname: {item.newNickname}</span> : null}
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const renderRatingHistory = (items: AdminStaffRatingAdjustmentHistoryItem[]) => (
  <div data-admin-staff-detail="history-block">
    <h3>Rating adjustments</h3>
    {items.length === 0 ? <p>Изменений рейтинга нет.</p> : null}
    {items.length > 0 ? (
      <ul data-admin-staff-detail="history-list">
        {items.map((item) => (
          <li key={`${item.actorAdminAccountId}-${item.delta}-${item.createdAt}`}>
            <strong>{formatSignedNumber(item.delta)}</strong>
            <span>{formatTimestamp(item.createdAt)}</span>
            <span>Actor: {item.actorAdminAccountId}</span>
            {item.reason !== null ? <span>Reason: {item.reason}</span> : null}
          </li>
        ))}
      </ul>
    ) : null}
  </div>
);

const renderCourierOrders = (
  title: string,
  orders: AdminCourierStaffCardOrder[],
  emptyLabel: string,
) => (
  <div data-admin-staff-detail="orders-block">
    <h3>{title}</h3>
    {orders.length === 0 ? <p>{emptyLabel}</p> : null}
    {orders.length > 0 ? (
      <ol data-admin-staff-detail="orders-list">
        {orders.map((order) => (
          <li key={`${title}-${order.orderId}`}>
            <div>
              <strong>{order.orderId}</strong>
              <span data-admin-ui="status-chip" data-admin-status-tone="neutral">{order.status}</span>
            </div>
            <span>Создан: {formatTimestamp(order.createdAt)}</span>
            <span>Обновлен: {formatTimestamp(order.updatedAt)}</span>
            <span>Client rating: {order.clientReviewRating ?? "нет"}</span>
            {order.problemReasons.length > 0 ? (
              <span>Reasons: {order.problemReasons.map(formatCourierProblemReason).join(", ")}</span>
            ) : null}
          </li>
        ))}
      </ol>
    ) : null}
  </div>
);

const renderOperatorOrders = (
  title: string,
  orders: AdminOperatorStaffCardOrder[],
  emptyLabel: string,
) => (
  <div data-admin-staff-detail="orders-block">
    <h3>{title}</h3>
    {orders.length === 0 ? <p>{emptyLabel}</p> : null}
    {orders.length > 0 ? (
      <ol data-admin-staff-detail="orders-list">
        {orders.map((order) => (
          <li key={`${title}-${order.orderId}`}>
            <div>
              <strong>{order.orderId}</strong>
              <span data-admin-ui="status-chip" data-admin-status-tone="neutral">{order.status}</span>
            </div>
            <span>Создан: {formatTimestamp(order.createdAt)}</span>
            <span>Обновлен: {formatTimestamp(order.updatedAt)}</span>
            <span>Last write: {formatTimestamp(order.lastWriteAt)}</span>
            <span>Personally completed: {order.personallyCompleted ? "yes" : "no"}</span>
            {order.actionTypes.length > 0 ? <span>Actions: {order.actionTypes.join(", ")}</span> : null}
            {order.problemReasons.length > 0 ? (
              <span>Reasons: {order.problemReasons.map(formatOperatorProblemReason).join(", ")}</span>
            ) : null}
          </li>
        ))}
      </ol>
    ) : null}
  </div>
);

const renderCourierDetail = (detail: AdminCourierStaffCard) => (
  <>
    <div data-admin-staff-detail="identity">
      {renderDetailFact("Telegram user id", detail.telegramUserId)}
      {renderDetailFact("Nickname", detail.nickname)}
      {renderDetailFact("Courier user id", detail.courierUserId)}
      {renderDetailFact("Состояние", formatStatusLabel(detail.activeStatus))}
    </div>
    <div data-admin-staff-detail="metrics">
      {renderDetailFact("Доставлено", detail.deliveredOrdersCount)}
      {renderDetailFact("Order rating", detail.courierOrderRating)}
      {renderDetailFact("Manual", formatSignedNumber(detail.manualRatingAdjustment))}
      {renderDetailFact("Auto penalties", formatSignedNumber(detail.automaticPenalties))}
      {renderDetailFact("Client rating", formatReviewRating(detail))}
      {renderDetailFact("Неуспешно", `${formatPercent(detail.unsuccessfulPercent)} / ${detail.unsuccessfulOrdersCount}`)}
    </div>
    {renderCourierOrders("Последние 10 заказов", detail.lastOrders, "Заказов курьера нет.")}
    {renderCourierOrders("Проблемные заказы", detail.problemOrders, "Проблемных заказов нет.")}
  </>
);

const renderOperatorDetail = (detail: AdminOperatorStaffCard) => (
  <>
    <div data-admin-staff-detail="identity">
      {renderDetailFact("Email / login", detail.email)}
      {renderDetailFact("Nickname", detail.nickname)}
      {renderDetailFact("Operator account id", detail.operatorAdminAccountId)}
      {renderDetailFact("Состояние", formatStatusLabel(detail.activeStatus))}
      {renderDetailFact("Auth", detail.authActive ? "Логин активен" : "Логин выключен")}
    </div>
    <div data-admin-staff-detail="metrics">
      {renderDetailFact("Обработано", detail.processedOrdersCount)}
      {renderDetailFact("Processed-order rating", detail.operatorRating)}
      {renderDetailFact("Manual", formatSignedNumber(detail.manualRatingAdjustment))}
    </div>
    {renderOperatorOrders("Последние 10 обработанных заказов", detail.lastProcessedOrders, "Заказов оператора нет.")}
    {renderOperatorOrders("Проблемные заказы", detail.problemOrders, "Проблемных заказов нет.")}
  </>
);

const renderDetailPanel = ({
  detailStatus,
  detailSelection,
  detail,
  detailErrorMessage,
  onCloseDetail,
}: {
  detailStatus: AdminStaffPageProps["detailStatus"];
  detailSelection: AdminStaffDetailSelection | null;
  detail: AdminStaffDetailView | null;
  detailErrorMessage: string | null;
  onCloseDetail: () => void;
}) => (
  <section data-admin-staff="detail-panel" aria-live="polite">
    <div data-admin-staff-detail="header">
      <div>
        <span data-admin-ui="micro-label">Staff card</span>
        <h2>Карточка сотрудника</h2>
      </div>
      {detailSelection !== null ? (
        <button type="button" data-admin-staff-action="close-detail" data-magnetic="true" onClick={onCloseDetail}>
          Закрыть
        </button>
      ) : null}
    </div>
    {detailStatus === "idle" ? <p>Карточка не выбрана.</p> : null}
    {detailStatus === "loading" ? <p role="status">Загружаем карточку Staff panel...</p> : null}
    {detailStatus === "error" && detailErrorMessage !== null ? <p role="alert">{detailErrorMessage}</p> : null}
    {detailStatus === "ready" && detail !== null ? (
      <div data-admin-staff-detail="content" data-admin-staff-detail-kind={detail.kind}>
        <div data-admin-staff-detail="common">
          {renderDetailFact("Добавил", detail.detail.addedByAdminAccountId)}
          {renderDetailFact("Добавлен", formatTimestamp(detail.detail.addedAt))}
          {renderDetailFact("Деактивировал", detail.detail.deactivatedByAdminAccountId)}
          {renderDetailFact("Деактивирован", formatTimestamp(detail.detail.deactivatedAt))}
          {renderDetailFact("Вернул", detail.detail.reactivatedByAdminAccountId)}
          {renderDetailFact("Возвращен", formatTimestamp(detail.detail.reactivatedAt))}
        </div>
        {detail.kind === "courier" ? renderCourierDetail(detail.detail) : renderOperatorDetail(detail.detail)}
        <div data-admin-staff-detail="history-grid">
          {renderHistory(detail.detail.lifecycleHistory, "Lifecycle history пока пуст.")}
          {renderRatingHistory(detail.detail.manualRatingAdjustmentHistory)}
        </div>
      </div>
    ) : null}
  </section>
);

export const AdminStaffPage = ({
  role,
  activeTab,
  includeInactive,
  isLoading,
  isCommandSubmitting,
  errorMessage,
  commandSuccessMessage,
  commandErrorMessage,
  oneTimePasswordNotice,
  detailStatus,
  detailSelection,
  detail,
  detailErrorMessage,
  createCourierForm,
  createOperatorForm,
  operatorNicknameDrafts,
  operatorPasswordDrafts,
  couriers,
  operators,
  onTabChange,
  onIncludeInactiveChange,
  onCreateCourierChange,
  onCreateOperatorChange,
  onCreateCourier,
  onCreateOperator,
  onOpenCourierDetail,
  onOpenOperatorDetail,
  onCloseDetail,
  onDeactivateCourier,
  onDeactivateOperator,
  onReactivateCourier,
  onReactivateOperator,
  onAdjustCourierRating,
  onAdjustOperatorRating,
  onOperatorNicknameDraftChange,
  onOperatorPasswordDraftChange,
  onUpdateOperatorNickname,
  onResetOperatorPassword,
  onDismissOneTimePassword,
  onCopyOneTimePassword,
}: AdminStaffPageProps) => (
  <AdminPageShell title="Staff panel">
    <section aria-live="polite" data-admin-panel="context" data-admin-staff="summary">
      <span data-admin-ui="micro-label">Staff panel</span>
      <p>Курьеры и операторы управляются отдельными командами Staff panel.</p>
      <div data-admin-ui="fact-list">
        <div>
          <span>Роль</span>
          <strong>{role}</strong>
        </div>
        <div>
          <span>Курьеры</span>
          <strong>{isLoading ? "Загрузка" : couriers.length}</strong>
        </div>
        <div>
          <span>Операторы</span>
          <strong>{isLoading ? "Загрузка" : operators.length}</strong>
        </div>
        <div>
          <span>Архив</span>
          <strong>{includeInactive ? "Включен" : "Скрыт"}</strong>
        </div>
      </div>
      {role === "boss" ? (
        <label data-admin-staff="archive-toggle">
          <input
            type="checkbox"
            data-admin-staff-archive-toggle="true"
            checked={includeInactive}
            onChange={(event) => onIncludeInactiveChange(event.target.checked)}
          />
          <span>Показать архивных сотрудников</span>
        </label>
      ) : null}
      {isLoading ? <p role="status">Загружаем Staff panel...</p> : null}
      {errorMessage !== null ? <p role="alert">{errorMessage}</p> : null}
      {commandSuccessMessage !== null ? <p role="status">{commandSuccessMessage}</p> : null}
      {commandErrorMessage !== null ? <p role="alert">{commandErrorMessage}</p> : null}
      {oneTimePasswordNotice !== null ? (
        <div data-admin-staff="one-time-password" role="status">
          <span data-admin-ui="micro-label">Одноразовый пароль</span>
          <strong>{oneTimePasswordNotice.label}</strong>
          <code>{oneTimePasswordNotice.value}</code>
          <div data-admin-staff="one-time-actions">
            <button
              type="button"
              data-admin-staff-action="copy-one-time-password"
              data-magnetic="true"
              onClick={onCopyOneTimePassword}
            >
              Копировать пароль
            </button>
            <button
              type="button"
              data-admin-staff-action="dismiss-one-time-password"
              data-magnetic="true"
              onClick={onDismissOneTimePassword}
            >
              Скрыть
            </button>
          </div>
        </div>
      ) : null}
    </section>

    <section data-admin-staff="commands" aria-label="Команды Staff panel">
      <form
        data-admin-staff-command="create-courier"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateCourier();
        }}
      >
        <fieldset disabled={isCommandSubmitting}>
          <legend>Добавить курьера</legend>
          <label>
            Telegram user id
            <input
              name="courierTelegramUserId"
              value={createCourierForm.telegramUserId}
              onChange={(event) => onCreateCourierChange("telegramUserId", event.target.value)}
            />
          </label>
          <label>
            Nickname
            <input
              name="courierNickname"
              value={createCourierForm.nickname}
              onChange={(event) => onCreateCourierChange("nickname", event.target.value)}
            />
          </label>
        </fieldset>
        <button type="submit" data-magnetic="true" disabled={isCommandSubmitting}>
          Добавить курьера
        </button>
      </form>

      <form
        data-admin-staff-command="create-operator"
        onSubmit={(event) => {
          event.preventDefault();
          onCreateOperator();
        }}
      >
        <fieldset disabled={isCommandSubmitting}>
          <legend>Добавить оператора</legend>
          <label>
            Email / login
            <input
              name="operatorEmail"
              value={createOperatorForm.email}
              onChange={(event) => onCreateOperatorChange("email", event.target.value)}
            />
          </label>
          <label>
            Nickname
            <input
              name="operatorNickname"
              value={createOperatorForm.nickname}
              onChange={(event) => onCreateOperatorChange("nickname", event.target.value)}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              name="operatorPassword"
              autoComplete="new-password"
              value={createOperatorForm.password}
              onChange={(event) => onCreateOperatorChange("password", event.target.value)}
            />
          </label>
        </fieldset>
        <button type="submit" data-magnetic="true" disabled={isCommandSubmitting}>
          Добавить оператора
        </button>
      </form>
    </section>

    <section data-admin-panel="workspace" data-admin-staff="workspace">
      <div data-admin-staff="tabs" role="tablist" aria-label="Ресурсы Staff panel">
        <button
          type="button"
          role="tab"
          id="admin-staff-tab-couriers"
          aria-controls="admin-staff-panel-couriers"
          aria-selected={activeTab === "couriers"}
          data-admin-staff-tab="couriers"
          data-magnetic="true"
          onClick={() => onTabChange("couriers")}
        >
          Couriers
          <span>{couriers.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="admin-staff-tab-operators"
          aria-controls="admin-staff-panel-operators"
          aria-selected={activeTab === "operators"}
          data-admin-staff-tab="operators"
          data-magnetic="true"
          onClick={() => onTabChange("operators")}
        >
          Operators
          <span>{operators.length}</span>
        </button>
      </div>

      <div
        id={activeTab === "couriers" ? "admin-staff-panel-couriers" : "admin-staff-panel-operators"}
        role="tabpanel"
        aria-labelledby={activeTab === "couriers" ? "admin-staff-tab-couriers" : "admin-staff-tab-operators"}
        data-admin-staff-resource={activeTab}
      >
        {activeTab === "couriers"
          ? renderCourierTable({
              role,
              couriers,
              isLoading,
              isCommandSubmitting,
              detailSelection,
              onOpenCourierDetail,
              onDeactivateCourier,
              onReactivateCourier,
              onAdjustCourierRating,
            })
          : renderOperatorTable({
              role,
              operators,
              isLoading,
              isCommandSubmitting,
              detailSelection,
              operatorNicknameDrafts,
              operatorPasswordDrafts,
              onOpenOperatorDetail,
              onDeactivateOperator,
              onReactivateOperator,
              onAdjustOperatorRating,
              onOperatorNicknameDraftChange,
              onOperatorPasswordDraftChange,
              onUpdateOperatorNickname,
              onResetOperatorPassword,
            })}
      </div>
      {renderDetailPanel({
        detailStatus,
        detailSelection,
        detail,
        detailErrorMessage,
        onCloseDetail,
      })}
    </section>
  </AdminPageShell>
);
