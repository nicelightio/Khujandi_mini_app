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

const assignmentHeadline = "Operator delivery orders";
const noMessagesLabel = "No messages yet";
const emptyWindowLabel = "Today plus previous 3 days";
export const defaultAdminAssignmentSortKey: AdminAssignmentSortKey = "urgency";
const pendingBackendLabel = "Backend not yet enabled";
const pendingRuntimeLabel = "Runtime not yet enabled";
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
    label: "Urgency",
    description: "Delayed, no-courier and attention rows first",
  },
  {
    key: "created_at",
    label: "Created time",
    description: "Newest orders first",
  },
  {
    key: "status",
    label: "Status",
    description: "Lifecycle status order",
  },
  {
    key: "courier",
    label: "Courier",
    description: "Absent courier first, then courier name",
  },
  {
    key: "assigned_at",
    label: "Assigned time",
    description: "Unassigned first, then earliest assignment",
  },
  {
    key: "message_presence",
    label: "Message presence",
    description: "Rows with a known message preview first; placeholders last",
  },
];

const formatTimestamp = (value: string | null): string => {
  if (value === null) {
    return "Not recorded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-GB", {
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

  return `Today plus previous 3 days / ${formatTimestamp(result.window.from)} - ${formatTimestamp(result.window.to)}`;
};

const formatMoney = (amountMinor: number, currency: string): string => {
  const major = amountMinor / 100;
  return `${major.toLocaleString("en-US", {
    minimumFractionDigits: major % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
};

const formatDuration = (seconds: number | null): string => {
  if (seconds === null) {
    return "Open";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 1) {
    return `${seconds}s`;
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
};

const formatStatus = (status: string): string => status.replaceAll("_", " ");

const toSeverityLabel = (severity: AdminOperatorDeliverySeverity): string => {
  switch (severity) {
    case "active_under_30":
      return "Active <30m";
    case "active_30_60":
      return "Active 30-60m";
    case "active_60_plus":
      return "Active 60m+";
    case "unassigned":
      return "No courier";
    case "delayed":
      return "Delayed";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "attention":
      return "Needs closure";
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
  isDelayedOperatorOrder(order) ? "Delayed" : toSeverityLabel(order.severity);

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

const compareStrings = (left: string, right: string): number => left.localeCompare(right, "en");

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
    comments.courier === null ? null : `Courier: ${comments.courier}`,
    comments.admin === null ? null : `Admin: ${comments.admin}`,
    comments.customer === null ? null : `Customer: ${comments.customer}`,
    comments.shopOwner === null ? null : `Shop: ${comments.shopOwner}`,
  ].filter((value): value is string => value !== null);

  return values.length === 0 ? "No comments" : values.join(" / ");
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
      label: "Targeted offer",
      stateLabel: "Creating offer",
      detailLabel: "Manual targeted offer creation is in progress.",
      isEnabled: false,
    };
  }

  if (isCurrentOrderSubmitting) {
    return {
      key: "targeted_offer",
      label: "Targeted offer",
      stateLabel: "Offer action in progress",
      detailLabel: "Another offer action is already in progress for this order.",
      isEnabled: false,
    };
  }

  if (isCurrentTargeted && offerMutation.status === "succeeded") {
    return {
      key: "targeted_offer",
      label: "Targeted offer",
      stateLabel: "Offer created",
      detailLabel: offerMutation.message ?? "Pending courier offer was created.",
      isEnabled: canCreateTargetedOffer(order),
    };
  }

  if (isCurrentTargeted && offerMutation.status === "failed") {
    return {
      key: "targeted_offer",
      label: "Targeted offer",
      stateLabel: "Offer failed",
      detailLabel: offerMutation.message ?? "Manual targeted offer could not be created.",
      isEnabled: canCreateTargetedOffer(order),
    };
  }

  return {
    key: "targeted_offer",
    label: "Targeted offer",
    stateLabel: canCreateTargetedOffer(order) ? "Create pending offer" : pendingBackendLabel,
    detailLabel:
      order.courier.current === null
        ? "Creates a pending courier offer. Courier claim is a later step and the order stays unassigned."
        : "Courier already accepted; manual offer is unavailable for this order.",
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
      label: "Broadcast offer",
      stateLabel: "Creating offers",
      detailLabel: "Explicit auto-offer broadcast is in progress.",
      isEnabled: false,
    };
  }

  if (isCurrentOrderSubmitting) {
    return {
      key: "broadcast_offer",
      label: "Broadcast offer",
      stateLabel: "Offer action in progress",
      detailLabel: "Another offer action is already in progress for this order.",
      isEnabled: false,
    };
  }

  if (isCurrentBroadcast && offerMutation.status === "succeeded") {
    return {
      key: "broadcast_offer",
      label: "Broadcast offer",
      stateLabel: "Offers created",
      detailLabel: offerMutation.message ?? "Pending broadcast offers were created.",
      isEnabled: canBroadcast,
    };
  }

  if (isCurrentBroadcast && offerMutation.status === "failed") {
    return {
      key: "broadcast_offer",
      label: "Broadcast offer",
      stateLabel: "Broadcast failed",
      detailLabel: offerMutation.message ?? "Auto-offer broadcast could not be created.",
      isEnabled: canBroadcast,
    };
  }

  return {
    key: "broadcast_offer",
    label: "Broadcast offer",
    stateLabel: canBroadcast ? "Trigger explicitly" : pendingBackendLabel,
    detailLabel:
      order.courier.current === null
        ? "Explicitly creates pending broadcast offers for active free auto-offer couriers. Auto-offer is otherwise OFF."
        : "Courier already accepted; broadcast offer is unavailable for this order.",
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
    label: "Bot chat",
    stateLabel: pendingRuntimeLabel,
    detailLabel: "Bot redirect is not executed until order-bound Telegram runtime and message persistence land.",
    isEnabled: false,
  },
];

const createStatusControlAction = (
  order: AdminOperatorDeliveryOrder,
  statusMutation: AdminAssignmentStatusMutationState,
): AdminOperatorDeliveryActionCellViewModel => {
  const nextStatus = nextOperatorStatusByStatus[order.status] ?? null;
  const isCurrentStatusCommand = statusMutation.orderId === order.orderId;
  const baseLabel = order.status === "DELIVERED" ? "Complete order" : "Advance status";

  if (isCurrentStatusCommand && statusMutation.status === "submitting") {
    return {
      key: "status_control",
      label: "Status control",
      stateLabel: "Updating status",
      detailLabel: "Operator status control is writing the allowed next transition.",
      isEnabled: false,
      nextStatus: statusMutation.nextStatus ?? undefined,
    };
  }

  if (isCurrentStatusCommand && statusMutation.status === "succeeded") {
    return {
      key: "status_control",
      label: "Status control",
      stateLabel: "Status updated",
      detailLabel: statusMutation.message ?? "Status transition was written to history.",
      isEnabled: nextStatus !== null,
      nextStatus: nextStatus ?? undefined,
    };
  }

  if (isCurrentStatusCommand && statusMutation.status === "failed") {
    return {
      key: "status_control",
      label: "Status control",
      stateLabel: "Status failed",
      detailLabel: statusMutation.message ?? "Status transition could not be written.",
      isEnabled: nextStatus !== null,
      nextStatus: nextStatus ?? undefined,
    };
  }

  return {
    key: "status_control",
    label: "Status control",
    stateLabel: nextStatus === null ? pendingBackendLabel : `${baseLabel} -> ${formatStatus(nextStatus)}`,
    detailLabel:
      nextStatus === null
        ? "No allowed operator/admin next transition is available for this order status."
        : "Requires confirmation and writes the operator/admin actor to status history.",
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
      ? "No accepted courier"
      : `${order.courier.current.name}${order.courier.current.telegramId === null ? "" : ` / tg ${order.courier.current.telegramId}`}`,
  courierMarkerLabel: order.courier.marker === "absent" ? "Absent" : "Current",
  assignedAtLabel: formatTimestamp(order.assignedAt),
  claimedAtLabel: formatTimestamp(order.claimedAt),
  latestMessageLabel: order.latestMessagePreview ?? order.latestMessage ?? noMessagesLabel,
  latestMessageMetaLabel: order.latestMessageSenderRole === null ? "Message placeholder" : order.latestMessageSenderRole,
  statusRevisionLabel: order.statusRevision,
  isExpanded: expandedOrderIds.has(order.orderId),
  actionCells: createActionCells(order, offerMutation, statusMutation),
  history: order.history.map(toHistoryViewModel),
});

const toAlertReasonLabel = (order: AdminOperatorDeliveryOrder): string => {
  if (isDelayedOperatorOrder(order)) {
    return "DELAYED";
  }

  return "No accepted courier";
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
  statusLabel: "Loading operator delivery orders...",
  windowLabel: emptyWindowLabel,
  generatedAtLabel: "Waiting for backend read model",
  revisionLabel: "No revision",
  emptyLabel: "No orders in the 4-day operator window.",
  alertLabel: "No delayed or no-courier orders in the current operator window.",
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
  statusLabel: `${result.orders.length} orders loaded from the operator read model.`,
  windowLabel: formatWindow(result),
  generatedAtLabel: `Generated ${formatTimestamp(result.generatedAt)}`,
  revisionLabel: `Revision ${result.revision}`,
  emptyLabel: "No orders in the 4-day operator window.",
  alertLabel: "Courier attention",
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
  statusLabel: "Operator delivery orders could not be loaded.",
  isLoading: false,
  errorMessage: message,
});
