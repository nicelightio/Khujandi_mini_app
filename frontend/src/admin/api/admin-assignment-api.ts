import { fetchProtectedAdminRoute } from "./admin-protected-api";

export type AdminOperatorDeliverySeverity =
  | "delayed"
  | "cancelled"
  | "completed"
  | "unassigned"
  | "active_under_30"
  | "active_30_60"
  | "active_60_plus"
  | "attention";

export type AdminOperatorDeliveryOrderStatus =
  | "CREATED"
  | "DELAYED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED_BY_ADMIN"
  | "CANCELLED_BY_COURIER_UNAVAILABLE";

export type AdminOperatorDeliveryCourier = {
  marker: "absent" | "current";
  current: {
    id: string;
    name: string;
    telegramId: string | null;
  } | null;
};

export type AdminOperatorDeliveryHistoryRow = {
  id: string;
  status: AdminOperatorDeliveryOrderStatus;
  previousStatus: AdminOperatorDeliveryOrderStatus | string;
  changedAt: string;
  actor: {
    userId: string;
    role: string;
    name: string;
  };
  timeInStatusSeconds: number | null;
  timeSinceOrderCreatedSeconds: number;
  comments: {
    courier: string | null;
    admin: string | null;
    customer: string | null;
    shopOwner: string | null;
  };
};

export type AdminOperatorDeliveryOrder = {
  orderId: string;
  publicOrderNumber: string;
  summary: {
    shopName: string;
    totalAmountMinor: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
  status: AdminOperatorDeliveryOrderStatus;
  severity: AdminOperatorDeliverySeverity;
  courier: AdminOperatorDeliveryCourier;
  assignedAt: string | null;
  claimedAt: string | null;
  latestMessage: string | null;
  latestMessagePreview: string | null;
  latestMessageSenderRole: string | null;
  statusRevision: string;
  history: AdminOperatorDeliveryHistoryRow[];
};

export type AdminOperatorDeliveryOrdersResult = {
  window: {
    from: string;
    to: string;
  };
  generatedAt: string;
  revision: string;
  orders: AdminOperatorDeliveryOrder[];
};

export type AdminManualTargetedOfferResult = {
  orderId: string;
  offerId: string;
  targetCourierId: string;
  kind: "manual" | "broadcast";
  status: "pending";
  orderStatus: "CREATED" | "DELAYED";
  updatedAt: string;
  revision: string;
};

export type AdminBroadcastOfferResult = {
  orderId: string;
  kind: "broadcast";
  status: "pending";
  orderStatus: "CREATED" | "DELAYED";
  eligibleCourierCount: number;
  offers: AdminManualTargetedOfferResult[];
  updatedAt: string;
  revision: string;
};

export type AdminOperatorStatusCommandResult = {
  orderId: string;
  status: AdminOperatorDeliveryOrderStatus;
  updatedAt: string;
  revision: string;
};

type AdminAssignmentErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  trace_id?: unknown;
};

export class AdminAssignmentApiError extends Error {
  readonly code: string;
  readonly traceId: string | null;
  readonly details: unknown;

  constructor(code: string, message: string, traceId: string | null = null, details: unknown = null) {
    super(traceId === null ? message : `${message} (trace: ${traceId})`);
    this.code = code;
    this.traceId = traceId;
    this.details = details;
  }
}

type AdminAssignmentHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type AdminAssignmentFetch = (input: string, init?: RequestInit) => Promise<AdminAssignmentHttpResponse>;

type AdminAssignmentApiOptions = {
  baseUrl?: string;
  fetch?: AdminAssignmentFetch;
};

export type AdminAssignmentApi = {
  listOperatorDeliveryOrders: () => Promise<AdminOperatorDeliveryOrdersResult>;
  createManualTargetedOffer: (input: {
    orderId: string;
    courierId: string;
  }) => Promise<AdminManualTargetedOfferResult>;
  createBroadcastOffer: (input: {
    orderId: string;
  }) => Promise<AdminBroadcastOfferResult>;
  updateOperatorOrderStatus: (input: {
    orderId: string;
    nextStatus: AdminOperatorDeliveryOrderStatus;
  }) => Promise<AdminOperatorStatusCommandResult>;
};

const defaultFetch: AdminAssignmentFetch = async (input, init) => {
  const response = await fetch(input, init);

  return {
    ok: response.ok,
    status: response.status,
    json: async () => response.json(),
  };
};

const ensureObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const ensureString = (value: unknown, field: string): string => {
  if (typeof value !== "string") {
    throw new Error(`Operator delivery orders payload is invalid: ${field}.`);
  }

  return value;
};

const ensureNullableString = (value: unknown, field: string): string | null => {
  if (value === null || typeof value === "string") {
    return value;
  }

  throw new Error(`Operator delivery orders payload is invalid: ${field}.`);
};

const ensureNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Operator delivery orders payload is invalid: ${field}.`);
  }

  return value;
};

const toHistoryRow = (value: unknown): AdminOperatorDeliveryHistoryRow => {
  const record = ensureObject(value);
  const actor = ensureObject(record?.actor);
  const comments = ensureObject(record?.comments);

  if (record === null || actor === null || comments === null) {
    throw new Error("Operator delivery orders payload is invalid: history.");
  }

  return {
    id: ensureString(record.id, "history.id"),
    status: ensureString(record.status, "history.status") as AdminOperatorDeliveryOrderStatus,
    previousStatus: ensureString(record.previousStatus, "history.previousStatus"),
    changedAt: ensureString(record.changedAt, "history.changedAt"),
    actor: {
      userId: ensureString(actor.userId, "history.actor.userId"),
      role: ensureString(actor.role, "history.actor.role"),
      name: ensureString(actor.name, "history.actor.name"),
    },
    timeInStatusSeconds:
      record.timeInStatusSeconds === null ? null : ensureNumber(record.timeInStatusSeconds, "history.timeInStatusSeconds"),
    timeSinceOrderCreatedSeconds: ensureNumber(record.timeSinceOrderCreatedSeconds, "history.timeSinceOrderCreatedSeconds"),
    comments: {
      courier: ensureNullableString(comments.courier, "history.comments.courier"),
      admin: ensureNullableString(comments.admin, "history.comments.admin"),
      customer: ensureNullableString(comments.customer, "history.comments.customer"),
      shopOwner: ensureNullableString(comments.shopOwner, "history.comments.shopOwner"),
    },
  };
};

const toOperatorOrder = (value: unknown): AdminOperatorDeliveryOrder => {
  const record = ensureObject(value);
  const summary = ensureObject(record?.summary);
  const courier = ensureObject(record?.courier);
  const currentCourier = courier?.current === null ? null : ensureObject(courier?.current);

  if (
    record === null ||
    summary === null ||
    courier === null ||
    (courier.current !== null && currentCourier === null) ||
    !Array.isArray(record.history)
  ) {
    throw new Error("Operator delivery orders payload is invalid: order.");
  }

  const marker = ensureString(courier.marker, "courier.marker");

  if (marker !== "absent" && marker !== "current") {
    throw new Error("Operator delivery orders payload is invalid: courier.marker.");
  }

  return {
    orderId: ensureString(record.orderId, "orderId"),
    publicOrderNumber: ensureString(record.publicOrderNumber, "publicOrderNumber"),
    summary: {
      shopName: ensureString(summary.shopName, "summary.shopName"),
      totalAmountMinor: ensureNumber(summary.totalAmountMinor, "summary.totalAmountMinor"),
      currency: ensureString(summary.currency, "summary.currency"),
    },
    createdAt: ensureString(record.createdAt, "createdAt"),
    updatedAt: ensureString(record.updatedAt, "updatedAt"),
    status: ensureString(record.status, "status") as AdminOperatorDeliveryOrderStatus,
    severity: ensureString(record.severity, "severity") as AdminOperatorDeliverySeverity,
    courier: {
      marker,
      current:
        currentCourier === null
          ? null
          : {
              id: ensureString(currentCourier.id, "courier.current.id"),
              name: ensureString(currentCourier.name, "courier.current.name"),
              telegramId: ensureNullableString(currentCourier.telegramId, "courier.current.telegramId"),
            },
    },
    assignedAt: ensureNullableString(record.assignedAt, "assignedAt"),
    claimedAt: ensureNullableString(record.claimedAt, "claimedAt"),
    latestMessage: ensureNullableString(record.latestMessage, "latestMessage"),
    latestMessagePreview: ensureNullableString(record.latestMessagePreview, "latestMessagePreview"),
    latestMessageSenderRole: ensureNullableString(record.latestMessageSenderRole, "latestMessageSenderRole"),
    statusRevision: ensureString(record.statusRevision, "statusRevision"),
    history: record.history.map(toHistoryRow),
  };
};

const toOperatorOrdersResult = (value: unknown): AdminOperatorDeliveryOrdersResult => {
  const record = ensureObject(value);
  const window = ensureObject(record?.window);

  if (record === null || window === null || !Array.isArray(record.orders)) {
    throw new Error("Operator delivery orders payload is invalid.");
  }

  return {
    window: {
      from: ensureString(window.from, "window.from"),
      to: ensureString(window.to, "window.to"),
    },
    generatedAt: ensureString(record.generatedAt, "generatedAt"),
    revision: ensureString(record.revision, "revision"),
    orders: record.orders.map(toOperatorOrder),
  };
};

const toManualTargetedOfferResult = (value: unknown): AdminManualTargetedOfferResult => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Manual targeted offer payload is invalid.");
  }

  return {
    orderId: ensureString(record.orderId, "orderId"),
    offerId: ensureString(record.offerId, "offerId"),
    targetCourierId: ensureString(record.targetCourierId, "targetCourierId"),
    kind: ensureString(record.kind, "kind") as "manual" | "broadcast",
    status: ensureString(record.status, "status") as "pending",
    orderStatus: ensureString(record.orderStatus, "orderStatus") as "CREATED" | "DELAYED",
    updatedAt: ensureString(record.updatedAt, "updatedAt"),
    revision: ensureString(record.revision, "revision"),
  };
};

const toBroadcastOfferResult = (value: unknown): AdminBroadcastOfferResult => {
  const record = ensureObject(value);

  if (record === null || !Array.isArray(record.offers)) {
    throw new Error("Broadcast offer payload is invalid.");
  }

  return {
    orderId: ensureString(record.orderId, "orderId"),
    kind: ensureString(record.kind, "kind") as "broadcast",
    status: ensureString(record.status, "status") as "pending",
    orderStatus: ensureString(record.orderStatus, "orderStatus") as "CREATED" | "DELAYED",
    eligibleCourierCount: ensureNumber(record.eligibleCourierCount, "eligibleCourierCount"),
    offers: record.offers.map(toManualTargetedOfferResult),
    updatedAt: ensureString(record.updatedAt, "updatedAt"),
    revision: ensureString(record.revision, "revision"),
  };
};

const toOperatorStatusCommandResult = (value: unknown): AdminOperatorStatusCommandResult => {
  const record = ensureObject(value);

  if (record === null) {
    throw new Error("Operator status command payload is invalid.");
  }

  return {
    orderId: ensureString(record.orderId, "orderId"),
    status: ensureString(record.status, "status") as AdminOperatorDeliveryOrderStatus,
    updatedAt: ensureString(record.updatedAt, "updatedAt"),
    revision: ensureString(record.revision, "revision"),
  };
};

const toApiError = (payload: unknown, status: number): AdminAssignmentApiError => {
  const record = ensureObject(payload) as AdminAssignmentErrorPayload | null;
  const code = typeof record?.error?.code === "string" ? record.error.code : `HTTP_${status}`;
  const message =
    typeof record?.error?.message === "string"
      ? record.error.message
      : "Operator delivery orders are temporarily unavailable.";
  const traceId = typeof record?.trace_id === "string" ? record.trace_id : null;

  return new AdminAssignmentApiError(code, message, traceId, record?.error?.details ?? null);
};

export const createAdminAssignmentApi = (options: AdminAssignmentApiOptions = {}): AdminAssignmentApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    listOperatorDeliveryOrders: async () => {
      const response = await fetchProtectedAdminRoute(
        fetchImpl,
        baseUrl,
        `${baseUrl}/api/v1/admin/operator/delivery/orders`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toOperatorOrdersResult(payload);
    },
    createManualTargetedOffer: async ({ orderId, courierId }) => {
      const response = await fetchProtectedAdminRoute(
        fetchImpl,
        baseUrl,
        `${baseUrl}/api/v1/admin/orders/${encodeURIComponent(orderId)}/assignment-offers`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courierId,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toManualTargetedOfferResult(payload);
    },
    createBroadcastOffer: async ({ orderId }) => {
      const response = await fetchProtectedAdminRoute(
        fetchImpl,
        baseUrl,
        `${baseUrl}/api/v1/admin/orders/${encodeURIComponent(orderId)}/auto-offers`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toBroadcastOfferResult(payload);
    },
    updateOperatorOrderStatus: async ({ orderId, nextStatus }) => {
      const response = await fetchProtectedAdminRoute(
        fetchImpl,
        baseUrl,
        `${baseUrl}/api/v1/admin/operator/delivery/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nextStatus,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toOperatorStatusCommandResult(payload);
    },
  };
};
