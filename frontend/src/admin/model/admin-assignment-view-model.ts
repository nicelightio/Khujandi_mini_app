import type {
  AdminOperatorDeliveryOrder,
  AdminOperatorDeliveryOrdersResult,
  AdminOperatorDeliveryOrderStatus,
  AdminOperatorDeliverySeverity,
} from "../api/admin-assignment-api";

export type AdminOperatorDeliveryOrderViewModel = {
  orderId: string;
  publicOrderNumber: string;
  summaryLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  statusLabel: string;
  severityLabel: string;
  severityTone: "danger" | "info" | "neutral" | "orange" | "purple" | "success" | "warning";
  isDelayedAlert: boolean;
  courierLabel: string;
  courierMarkerLabel: string;
  assignedAtLabel: string;
  claimedAtLabel: string;
  latestMessageLabel: string;
  latestMessageMetaLabel: string;
  statusRevisionLabel: string;
  isExpanded: boolean;
  actionCells: AdminOperatorDeliveryActionCellViewModel[];
  history: AdminOperatorDeliveryHistoryViewModel[];
};

export type AdminOperatorDeliveryActionCellViewModel = {
  key: "targeted_offer" | "broadcast_offer" | "status_control" | "bot_chat";
  label: string;
  stateLabel: string;
  detailLabel: string;
  isEnabled: boolean;
  nextStatus?: AdminOperatorDeliveryOrderStatus;
};

export type AdminAssignmentOfferMutationState = {
  orderId: string | null;
  kind: "targeted" | "broadcast" | null;
  status: "idle" | "submitting" | "succeeded" | "failed";
  message: string | null;
};

export type AdminAssignmentStatusMutationState = {
  orderId: string | null;
  nextStatus: AdminOperatorDeliveryOrderStatus | null;
  status: "idle" | "submitting" | "succeeded" | "failed";
  message: string | null;
};

export type AdminAssignmentSortKey =
  | "urgency"
  | "created_at"
  | "status"
  | "courier"
  | "assigned_at"
  | "message_presence";

export type AdminAssignmentSortControlViewModel = {
  key: AdminAssignmentSortKey;
  label: string;
  description: string;
  isActive: boolean;
};

export type AdminAssignmentAlertOrderViewModel = {
  orderId: string;
  publicOrderNumber: string;
  reasonLabel: string;
  severityLabel: string;
  severityTone: AdminOperatorDeliveryOrderViewModel["severityTone"];
};

export type AdminOperatorDeliveryHistoryViewModel = {
  id: string;
  statusLabel: string;
  previousStatusLabel: string;
  changedAtLabel: string;
  actorLabel: string;
  timeInStatusLabel: string;
  timeSinceCreatedLabel: string;
  commentsLabel: string;
};

export type AdminAssignmentViewModel = {
  headline: string;
  statusLabel: string;
  windowLabel: string;
  generatedAtLabel: string;
  revisionLabel: string;
  emptyLabel: string;
  alertLabel: string;
  alertOrders: AdminAssignmentAlertOrderViewModel[];
  sortControls: AdminAssignmentSortControlViewModel[];
  isLoading: boolean;
  errorMessage: string | null;
  orders: AdminOperatorDeliveryOrderViewModel[];
};

const assignmentHeadline = "Операторские заказы доставки";
const noMessagesLabel = "Сообщений пока нет";
const emptyWindowLabel = "Сегодня и предыдущие 3 дня";
export const defaultAdminAssignmentSortKey: AdminAssignmentSortKey = "urgency";
const pendingBackendLabel = "Серверная команда еще не включена";
const pendingRuntimeLabel = "Среда еще не включена";
export const idleAdminAssignmentOfferMutationState: AdminAssignmentOfferMutationState = {
  orderId: null,
  kind: null,
  status: "idle",
  message: null,
};
export const idleAdminAssignmentStatusMutationState: AdminAssignmentStatusMutationState = {
  orderId: null,
  nextStatus: null,
  status: "idle",
  message: null,
};

const nextOperatorStatusByStatus: Partial<Record<AdminOperatorDeliveryOrderStatus, AdminOperatorDeliveryOrderStatus>> = {
  ASSIGNED: "PICKED_UP",
  PICKED_UP: "IN_PROGRESS",
  IN_PROGRESS: "DELIVERED",
  DELIVERED: "COMPLETED",
};

const statusOrder: Record<string, number> = {
  DELAYED: 0,
  CREATED: 1,
  ASSIGNED: 2,
  PICKED_UP: 3,
  IN_PROGRESS: 4,
  DELIVERED: 5,
  COMPLETED: 6,
  CANCELLED_BY_ADMIN: 7,
  CANCELLED_BY_COURIER_UNAVAILABLE: 8,
};

const sortControlDefinitions: Array<Omit<AdminAssignmentSortControlViewModel, "isActive">> = [
  {
    key: "urgency",
    label: "Срочность",
    description: "Сначала задержанные, без курьера и требующие внимания",
  },
  {
    key: "created_at",
    label: "Время создания",
    description: "Сначала новые заказы",
  },
  {
    key: "status",
    label: "Статус",
    description: "Порядок статусов жизненного цикла",
  },
  {
    key: "courier",
    label: "Курьер",
    description: "Сначала без курьера, затем по имени курьера",
  },
  {
    key: "assigned_at",
    label: "Время назначения",
    description: "Сначала неназначенные, затем ранние назначения",
  },
  {
    key: "message_presence",
    label: "Сообщения",
    description: "Сначала строки с превью сообщения; пустые записи в конце",
  },
];

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

const formatWindow = (result: AdminOperatorDeliveryOrdersResult | null): string => {
  if (result === null) {
    return emptyWindowLabel;
  }

  return `Сегодня и предыдущие 3 дня / ${formatTimestamp(result.window.from)} - ${formatTimestamp(result.window.to)}`;
};

const formatMoney = (amountMinor: number, currency: string): string => {
  const major = amountMinor / 100;
  return `${major.toLocaleString("ru-RU", {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
};

const formatDuration = (seconds: number | null): string => {
  if (seconds === null) {
    return "Открыт";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 1) {
    return `${seconds} с`;
  }

  if (minutes < 60) {
    return `${minutes} мин`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours} ч` : `${hours} ч ${remainingMinutes} мин`;
};

const formatStatus = (status: string): string => {
  switch (status) {
    case "CREATED":
      return "Создан";
    case "DELAYED":
      return "Задержан";
    case "ASSIGNED":
      return "Назначен";
    case "PICKED_UP":
      return "Забран";
    case "IN_PROGRESS":
      return "В доставке";
    case "DELIVERED":
      return "Доставлен";
    case "COMPLETED":
      return "Завершен";
    case "CANCELLED_BY_ADMIN":
      return "Отменен админом";
    case "CANCELLED_BY_COURIER_UNAVAILABLE":
      return "Отменен: курьер недоступен";
    default:
      return status.replaceAll("_", " ");
  }
};

const toSeverityLabel = (severity: AdminOperatorDeliverySeverity): string => {
  switch (severity) {
    case "active_under_30":
      return "Активен <30 мин";
    case "active_30_60":
      return "Активен 30-60 мин";
    case "active_60_plus":
      return "Активен 60+ мин";
    case "unassigned":
      return "Без курьера";
    case "delayed":
      return "Задержан";
    case "cancelled":
      return "Отменен";
    case "completed":
      return "Завершен";
    case "attention":
      return "Требует закрытия";
  }
};

const toSeverityTone = (
  severity: AdminOperatorDeliverySeverity,
): AdminOperatorDeliveryOrderViewModel["severityTone"] => {
  switch (severity) {
    case "delayed":
      return "danger";
    case "active_30_60":
      return "orange";
    case "active_under_30":
      return "warning";
    case "unassigned":
      return "info";
    case "active_60_plus":
    case "attention":
      return "danger";
    case "cancelled":
      return "purple";
    case "completed":
      return "neutral";
  }
};

const isDelayedOperatorOrder = (order: Pick<AdminOperatorDeliveryOrder, "status" | "severity">): boolean =>
  order.status === "DELAYED" || order.severity === "delayed";

const toOrderSeverityLabel = (order: AdminOperatorDeliveryOrder): string =>
  isDelayedOperatorOrder(order) ? "Задержан" : toSeverityLabel(order.severity);

const toOrderSeverityTone = (order: AdminOperatorDeliveryOrder): AdminOperatorDeliveryOrderViewModel["severityTone"] =>
  isDelayedOperatorOrder(order) ? "danger" : toSeverityTone(order.severity);

const toSeverityRank = (order: AdminOperatorDeliveryOrder): number => {
  if (isDelayedOperatorOrder(order)) {
    return 0;
  }

  switch (order.severity) {
    case "delayed":
      return 0;
    case "unassigned":
      return 1;
    case "attention":
      return 2;
    case "active_60_plus":
      return 3;
    case "active_30_60":
      return 4;
    case "active_under_30":
      return 5;
    case "cancelled":
      return 6;
    case "completed":
      return 7;
  }
};

const toEpoch = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const compareStrings = (left: string, right: string): number => left.localeCompare(right, "ru");

const compareNumbers = (left: number, right: number): number => left - right;

const compareNullableEpoch = (
  left: number | null,
  right: number | null,
  nulls: "first" | "last",
): number => {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return nulls === "first" ? -1 : 1;
  }

  if (right === null) {
    return nulls === "first" ? 1 : -1;
  }

  return left - right;
};

const compareStableTieBreakers = (
  left: AdminOperatorDeliveryOrder,
  right: AdminOperatorDeliveryOrder,
): number =>
  compareNumbers(toEpoch(left.createdAt) ?? 0, toEpoch(right.createdAt) ?? 0) ||
  compareStrings(left.publicOrderNumber, right.publicOrderNumber) ||
  compareStrings(left.orderId, right.orderId);

const toCourierSortLabel = (order: AdminOperatorDeliveryOrder): string =>
  order.courier.current === null ? "" : order.courier.current.name.toLocaleLowerCase("en");

const compareOrders = (
  left: AdminOperatorDeliveryOrder,
  right: AdminOperatorDeliveryOrder,
  sortKey: AdminAssignmentSortKey,
): number => {
  switch (sortKey) {
    case "urgency":
      return compareNumbers(toSeverityRank(left), toSeverityRank(right)) || compareStableTieBreakers(left, right);
    case "created_at":
      return compareNumbers(toEpoch(right.createdAt) ?? 0, toEpoch(left.createdAt) ?? 0) || compareStableTieBreakers(left, right);
    case "status":
      return (
        compareNumbers(statusOrder[left.status] ?? 99, statusOrder[right.status] ?? 99) ||
        compareStableTieBreakers(left, right)
      );
    case "courier":
      return (
        compareNumbers(left.courier.current === null ? 0 : 1, right.courier.current === null ? 0 : 1) ||
        compareStrings(toCourierSortLabel(left), toCourierSortLabel(right)) ||
        compareStableTieBreakers(left, right)
      );
    case "assigned_at":
      return compareNullableEpoch(toEpoch(left.assignedAt), toEpoch(right.assignedAt), "first") || compareStableTieBreakers(left, right);
    case "message_presence":
      return (
        compareNumbers(left.latestMessage === null ? 1 : 0, right.latestMessage === null ? 1 : 0) ||
        compareStableTieBreakers(left, right)
      );
  }
};

export const sortAdminOperatorDeliveryOrders = (
  orders: readonly AdminOperatorDeliveryOrder[],
  sortKey: AdminAssignmentSortKey = defaultAdminAssignmentSortKey,
): AdminOperatorDeliveryOrder[] => [...orders].sort((left, right) => compareOrders(left, right, sortKey));

const createSortControls = (sortKey: AdminAssignmentSortKey): AdminAssignmentSortControlViewModel[] =>
  sortControlDefinitions.map((control) => ({
    ...control,
    isActive: control.key === sortKey,
  }));

const toCommentsLabel = (comments: AdminOperatorDeliveryOrder["history"][number]["comments"]): string => {
  const values = [
    comments.courier === null ? null : `Курьер: ${comments.courier}`,
    comments.admin === null ? null : `Админ: ${comments.admin}`,
    comments.customer === null ? null : `Клиент: ${comments.customer}`,
    comments.shopOwner === null ? null : `Магазин: ${comments.shopOwner}`,
  ].filter((value): value is string => value !== null);

  return values.length === 0 ? "Комментариев нет" : values.join(" / ");
};

const toHistoryViewModel = (
  history: AdminOperatorDeliveryOrder["history"][number],
): AdminOperatorDeliveryHistoryViewModel => ({
  id: history.id,
  statusLabel: formatStatus(history.status),
  previousStatusLabel: formatStatus(history.previousStatus),
  changedAtLabel: formatTimestamp(history.changedAt),
  actorLabel: `${history.actor.name} (${history.actor.role})`,
  timeInStatusLabel: formatDuration(history.timeInStatusSeconds),
  timeSinceCreatedLabel: formatDuration(history.timeSinceOrderCreatedSeconds),
  commentsLabel: toCommentsLabel(history.comments),
});

const canCreateTargetedOffer = (order: AdminOperatorDeliveryOrder): boolean =>
  order.courier.current === null && (order.status === "CREATED" || order.status === "DELAYED");

const createTargetedOfferAction = (
  order: AdminOperatorDeliveryOrder,
  offerMutation: AdminAssignmentOfferMutationState,
): AdminOperatorDeliveryActionCellViewModel => {
  const isCurrentOrder = offerMutation.orderId === order.orderId;
  const isCurrentTargeted = isCurrentOrder && offerMutation.kind === "targeted";
  const isCurrentOrderSubmitting = isCurrentOrder && offerMutation.status === "submitting";

  if (isCurrentTargeted && offerMutation.status === "submitting") {
    return {
      key: "targeted_offer",
      label: "Персональное предложение",
      stateLabel: "Создаем предложение",
      detailLabel: "Создание ручного персонального предложения выполняется.",
      isEnabled: false,
    };
  }

  if (isCurrentOrderSubmitting) {
    return {
      key: "targeted_offer",
      label: "Персональное предложение",
      stateLabel: "Действие уже выполняется",
      detailLabel: "Для этого заказа уже выполняется другое действие с предложением.",
      isEnabled: false,
    };
  }

  if (isCurrentTargeted && offerMutation.status === "succeeded") {
    return {
      key: "targeted_offer",
      label: "Персональное предложение",
      stateLabel: "Предложение создано",
      detailLabel: offerMutation.message ?? "Ожидающее предложение курьеру создано.",
      isEnabled: canCreateTargetedOffer(order),
    };
  }

  if (isCurrentTargeted && offerMutation.status === "failed") {
    return {
      key: "targeted_offer",
      label: "Персональное предложение",
      stateLabel: "Ошибка предложения",
      detailLabel: offerMutation.message ?? "Ручное персональное предложение не удалось создать.",
      isEnabled: canCreateTargetedOffer(order),
    };
  }

  return {
    key: "targeted_offer",
    label: "Персональное предложение",
      stateLabel: canCreateTargetedOffer(order) ? "Создать ожидающее предложение" : pendingBackendLabel,
    detailLabel:
      order.courier.current === null
        ? "Создает ожидающее предложение курьеру. Подтверждение курьером будет отдельным шагом, заказ пока остается неназначенным."
        : "Курьер уже принял заказ; ручное предложение недоступно.",
    isEnabled: canCreateTargetedOffer(order),
  };
};

const createBroadcastOfferAction = (
  order: AdminOperatorDeliveryOrder,
  offerMutation: AdminAssignmentOfferMutationState,
): AdminOperatorDeliveryActionCellViewModel => {
  const canBroadcast = canCreateTargetedOffer(order);
  const isCurrentOrder = offerMutation.orderId === order.orderId;
  const isCurrentBroadcast = isCurrentOrder && offerMutation.kind === "broadcast";
  const isCurrentOrderSubmitting = isCurrentOrder && offerMutation.status === "submitting";

  if (isCurrentBroadcast && offerMutation.status === "submitting") {
    return {
      key: "broadcast_offer",
      label: "Массовое предложение",
      stateLabel: "Создаем предложения",
      detailLabel: "Явное массовое auto-offer действие выполняется.",
      isEnabled: false,
    };
  }

  if (isCurrentOrderSubmitting) {
    return {
      key: "broadcast_offer",
      label: "Массовое предложение",
      stateLabel: "Действие уже выполняется",
      detailLabel: "Для этого заказа уже выполняется другое действие с предложением.",
      isEnabled: false,
    };
  }

  if (isCurrentBroadcast && offerMutation.status === "succeeded") {
    return {
      key: "broadcast_offer",
      label: "Массовое предложение",
      stateLabel: "Предложения созданы",
      detailLabel: offerMutation.message ?? "Ожидающие массовые предложения созданы.",
      isEnabled: canBroadcast,
    };
  }

  if (isCurrentBroadcast && offerMutation.status === "failed") {
    return {
      key: "broadcast_offer",
      label: "Массовое предложение",
      stateLabel: "Ошибка массового предложения",
      detailLabel: offerMutation.message ?? "Массовое auto-offer действие не удалось создать.",
      isEnabled: canBroadcast,
    };
  }

  return {
    key: "broadcast_offer",
    label: "Массовое предложение",
    stateLabel: canBroadcast ? "Запустить явно" : pendingBackendLabel,
    detailLabel:
      order.courier.current === null
        ? "Явно создает ожидающие массовые предложения для активных свободных auto-offer курьеров. Иначе auto-offer выключен."
        : "Курьер уже принял заказ; массовое предложение недоступно.",
    isEnabled: canBroadcast,
  };
};

const createActionCells = (
  order: AdminOperatorDeliveryOrder,
  offerMutation: AdminAssignmentOfferMutationState,
  statusMutation: AdminAssignmentStatusMutationState,
): AdminOperatorDeliveryActionCellViewModel[] => [
  createTargetedOfferAction(order, offerMutation),
  createBroadcastOfferAction(order, offerMutation),
  createStatusControlAction(order, statusMutation),
  {
    key: "bot_chat",
    label: "Чат в боте",
    stateLabel: pendingRuntimeLabel,
    detailLabel: "Редирект в бот не выполняется, пока не подключены привязанная к заказу среда Telegram и сохранение сообщений.",
    isEnabled: false,
  },
];

const createStatusControlAction = (
  order: AdminOperatorDeliveryOrder,
  statusMutation: AdminAssignmentStatusMutationState,
): AdminOperatorDeliveryActionCellViewModel => {
  const nextStatus = nextOperatorStatusByStatus[order.status] ?? null;
  const isCurrentStatusCommand = statusMutation.orderId === order.orderId;
  const baseLabel = order.status === "DELIVERED" ? "Завершить заказ" : "Продвинуть статус";

  if (isCurrentStatusCommand && statusMutation.status === "submitting") {
    return {
      key: "status_control",
      label: "Управление статусом",
      stateLabel: "Обновляем статус",
      detailLabel: "Операторская команда записывает разрешенный следующий переход.",
      isEnabled: false,
      nextStatus: statusMutation.nextStatus ?? undefined,
    };
  }

  if (isCurrentStatusCommand && statusMutation.status === "succeeded") {
    return {
      key: "status_control",
      label: "Управление статусом",
      stateLabel: "Статус обновлен",
      detailLabel: statusMutation.message ?? "Переход статуса записан в историю.",
      isEnabled: nextStatus !== null,
      nextStatus: nextStatus ?? undefined,
    };
  }

  if (isCurrentStatusCommand && statusMutation.status === "failed") {
    return {
      key: "status_control",
      label: "Управление статусом",
      stateLabel: "Ошибка статуса",
      detailLabel: statusMutation.message ?? "Переход статуса не удалось записать.",
      isEnabled: nextStatus !== null,
      nextStatus: nextStatus ?? undefined,
    };
  }

  return {
    key: "status_control",
    label: "Управление статусом",
    stateLabel: nextStatus === null ? pendingBackendLabel : `${baseLabel} -> ${formatStatus(nextStatus)}`,
    detailLabel:
      nextStatus === null
        ? "Для текущего статуса заказа нет разрешенного перехода оператора/админа."
        : "Требует подтверждения и записывает оператора/админа в историю статусов.",
    isEnabled: nextStatus !== null,
    nextStatus: nextStatus ?? undefined,
  };
};

const toOrderViewModel = (
  order: AdminOperatorDeliveryOrder,
  expandedOrderIds: ReadonlySet<string>,
  offerMutation: AdminAssignmentOfferMutationState,
  statusMutation: AdminAssignmentStatusMutationState,
): AdminOperatorDeliveryOrderViewModel => ({
  orderId: order.orderId,
  publicOrderNumber: order.publicOrderNumber,
  summaryLabel: `${order.summary.shopName} / ${formatMoney(order.summary.totalAmountMinor, order.summary.currency)}`,
  createdAtLabel: formatTimestamp(order.createdAt),
  updatedAtLabel: formatTimestamp(order.updatedAt),
  statusLabel: formatStatus(order.status),
  severityLabel: toOrderSeverityLabel(order),
  severityTone: toOrderSeverityTone(order),
  isDelayedAlert: isDelayedOperatorOrder(order),
  courierLabel:
    order.courier.current === null
      ? "Нет принявшего курьера"
      : `${order.courier.current.name}${order.courier.current.telegramId === null ? "" : ` / tg ${order.courier.current.telegramId}`}`,
  courierMarkerLabel: order.courier.marker === "absent" ? "Нет" : "Текущий",
  assignedAtLabel: formatTimestamp(order.assignedAt),
  claimedAtLabel: formatTimestamp(order.claimedAt),
  latestMessageLabel: order.latestMessagePreview ?? order.latestMessage ?? noMessagesLabel,
  latestMessageMetaLabel: order.latestMessageSenderRole === null ? "Сообщения пока нет" : order.latestMessageSenderRole,
  statusRevisionLabel: order.statusRevision,
  isExpanded: expandedOrderIds.has(order.orderId),
  actionCells: createActionCells(order, offerMutation, statusMutation),
  history: order.history.map(toHistoryViewModel),
});

const toAlertReasonLabel = (order: AdminOperatorDeliveryOrder): string => {
  if (isDelayedOperatorOrder(order)) {
    return "Задержан";
  }

    return "Нет принявшего курьера";
};

const toAlertOrders = (orders: readonly AdminOperatorDeliveryOrder[]): AdminAssignmentAlertOrderViewModel[] =>
  sortAdminOperatorDeliveryOrders(
    orders.filter((order) => isDelayedOperatorOrder(order) || order.courier.current === null),
    "urgency",
  ).map((order) => ({
    orderId: order.orderId,
    publicOrderNumber: order.publicOrderNumber,
    reasonLabel: toAlertReasonLabel(order),
    severityLabel: toOrderSeverityLabel(order),
    severityTone: toOrderSeverityTone(order),
  }));

export const createLoadingAdminAssignmentViewModel = (): AdminAssignmentViewModel => ({
  headline: assignmentHeadline,
  statusLabel: "Загружаем операторские заказы доставки...",
  windowLabel: emptyWindowLabel,
  generatedAtLabel: "Ждем backend read model",
  revisionLabel: "Нет revision",
  emptyLabel: "В 4-дневном операторском окне заказов нет.",
  alertLabel: "В текущем окне нет задержанных заказов или заказов без курьера.",
  alertOrders: [],
  sortControls: createSortControls(defaultAdminAssignmentSortKey),
  isLoading: true,
  errorMessage: null,
  orders: [],
});

export const createReadyAdminAssignmentViewModel = (
  result: AdminOperatorDeliveryOrdersResult,
  expandedOrderIds: ReadonlySet<string> = new Set<string>(),
  sortKey: AdminAssignmentSortKey = defaultAdminAssignmentSortKey,
  offerMutation: AdminAssignmentOfferMutationState = idleAdminAssignmentOfferMutationState,
  statusMutation: AdminAssignmentStatusMutationState = idleAdminAssignmentStatusMutationState,
): AdminAssignmentViewModel => ({
  headline: assignmentHeadline,
  statusLabel: `Загружено заказов из операторской модели чтения: ${result.orders.length}.`,
  windowLabel: formatWindow(result),
  generatedAtLabel: `Сформировано ${formatTimestamp(result.generatedAt)}`,
  revisionLabel: `Ревизия ${result.revision}`,
  emptyLabel: "В 4-дневном операторском окне заказов нет.",
  alertLabel: "Внимание к курьерам",
  alertOrders: toAlertOrders(result.orders),
  sortControls: createSortControls(sortKey),
  isLoading: false,
  errorMessage: null,
  orders: sortAdminOperatorDeliveryOrders(result.orders, sortKey).map((order) =>
    toOrderViewModel(order, expandedOrderIds, offerMutation, statusMutation),
  ),
});

export const createErrorAdminAssignmentViewModel = (message: string): AdminAssignmentViewModel => ({
  ...createLoadingAdminAssignmentViewModel(),
  statusLabel: "Операторские заказы доставки не удалось загрузить.",
  isLoading: false,
  errorMessage: message,
});
