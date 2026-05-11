import { fetchProtectedAdminRoute } from "./admin-protected-api";

export type AdminOrderCancellationCommandInput = {
  orderId: string;
  reasonCode: string;
};

export type AdminOrderCancellationCommandResult = {
  orderId: string;
  status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE";
  refundStatus: "NOT_REQUIRED" | "PENDING_MANUAL" | "DONE" | "REJECTED";
  updatedAt: string;
  revision: string;
};

export type AdminOrderRefundUpdateCommandInput = {
  orderId: string;
  refundStatus: "DONE" | "REJECTED";
  refundNote: string;
};

export type AdminOrderRefundUpdateCommandResult = {
  orderId: string;
  status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE";
  refundStatus: "DONE" | "REJECTED";
  refundNote: string | null;
  updatedAt: string;
  revision: string;
};

type AdminOrderCancellationErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  trace_id?: unknown;
};

export class AdminOrderCancellationApiError extends Error {
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

type AdminOrderCancellationHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type AdminOrderCancellationFetch = (
  input: string,
  init?: RequestInit,
) => Promise<AdminOrderCancellationHttpResponse>;

type AdminOrderCancellationApiOptions = {
  baseUrl?: string;
  fetch?: AdminOrderCancellationFetch;
};

export type AdminOrderCancellationApi = {
  submitCancellation: (
    input: AdminOrderCancellationCommandInput,
  ) => Promise<AdminOrderCancellationCommandResult>;
  submitRefundUpdate: (
    input: AdminOrderRefundUpdateCommandInput,
  ) => Promise<AdminOrderRefundUpdateCommandResult>;
};

const defaultFetch: AdminOrderCancellationFetch = async (input, init) => {
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

const toUpdatedAt = (record: Record<string, unknown> | null): string | null => {
  const updatedAt = record?.updatedAt;
  const updatedAtSnake = record?.updated_at;

  return typeof updatedAt === "string"
    ? updatedAt
    : typeof updatedAtSnake === "string"
      ? updatedAtSnake
      : null;
};

const toCancellationResult = (value: unknown): AdminOrderCancellationCommandResult => {
  const record = ensureObject(value);
  const updatedAt = toUpdatedAt(record);

  if (
    record === null ||
    typeof record.orderId !== "string" ||
    (record.status !== "CANCELLED_BY_ADMIN" && record.status !== "CANCELLED_BY_COURIER_UNAVAILABLE") ||
    (record.refundStatus !== "NOT_REQUIRED" &&
      record.refundStatus !== "PENDING_MANUAL" &&
      record.refundStatus !== "DONE" &&
      record.refundStatus !== "REJECTED") ||
    updatedAt === null ||
    typeof record.revision !== "string"
  ) {
    throw new Error("Некорректный payload ответа отмены.");
  }

  return {
    orderId: record.orderId,
    status: record.status,
    refundStatus: record.refundStatus,
    updatedAt,
    revision: record.revision,
  };
};

const toRefundUpdateResult = (value: unknown): AdminOrderRefundUpdateCommandResult => {
  const record = ensureObject(value);
  const updatedAt = toUpdatedAt(record);

  if (
    record === null ||
    typeof record.orderId !== "string" ||
    (record.status !== "CANCELLED_BY_ADMIN" && record.status !== "CANCELLED_BY_COURIER_UNAVAILABLE") ||
    (record.refundStatus !== "DONE" && record.refundStatus !== "REJECTED") ||
    (record.refundNote !== null && typeof record.refundNote !== "string") ||
    updatedAt === null ||
    typeof record.revision !== "string"
  ) {
    throw new Error("Некорректный payload ответа обновления возврата.");
  }

  return {
    orderId: record.orderId,
    status: record.status,
    refundStatus: record.refundStatus,
    refundNote: record.refundNote,
    updatedAt,
    revision: record.revision,
  };
};

const toApiError = (payload: unknown, status: number): AdminOrderCancellationApiError => {
  const record = ensureObject(payload) as AdminOrderCancellationErrorPayload | null;
  const code = typeof record?.error?.code === "string" ? record.error.code : `HTTP_${status}`;
  const message =
    typeof record?.error?.message === "string"
      ? record.error.message
      : "Workflow отмены временно недоступен.";
  const traceId = typeof record?.trace_id === "string" ? record.trace_id : null;

  return new AdminOrderCancellationApiError(code, message, traceId, record?.error?.details ?? null);
};

export const createAdminOrderCancellationApi = (
  options: AdminOrderCancellationApiOptions = {},
): AdminOrderCancellationApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    submitCancellation: async (input) => {
      const response = await fetchProtectedAdminRoute(
        fetchImpl,
        baseUrl,
        `${baseUrl}/api/v1/admin/orders/${encodeURIComponent(input.orderId)}/cancellation`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            reasonCode: input.reasonCode,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toCancellationResult(payload);
    },
    submitRefundUpdate: async (input) => {
      const response = await fetchProtectedAdminRoute(
        fetchImpl,
        baseUrl,
        `${baseUrl}/api/v1/admin/orders/${encodeURIComponent(input.orderId)}/refund`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            refundStatus: input.refundStatus,
            refundNote: input.refundNote,
          }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toRefundUpdateResult(payload);
    },
  };
};
