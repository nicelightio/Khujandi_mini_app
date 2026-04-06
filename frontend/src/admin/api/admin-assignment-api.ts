export type AdminAssignmentCommandInput = {
  orderId: string;
  courierId: string;
};

export type AdminAssignmentCommandResult = {
  orderId: string;
  courierId: string;
  status: "ASSIGNED";
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
  submitAssignment: (input: AdminAssignmentCommandInput) => Promise<AdminAssignmentCommandResult>;
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

const toCommandResult = (value: unknown): AdminAssignmentCommandResult => {
  const record = ensureObject(value);
  const updatedAt = record?.updatedAt;
  const updatedAtSnake = record?.updated_at;
  const normalizedUpdatedAt = typeof updatedAt === "string" ? updatedAt : updatedAtSnake;

  if (
    record === null ||
    typeof record.orderId !== "string" ||
    typeof record.courierId !== "string" ||
    record.status !== "ASSIGNED" ||
    typeof normalizedUpdatedAt !== "string" ||
    typeof record.revision !== "string"
  ) {
    throw new Error("Assignment response payload is invalid.");
  }

  return {
    orderId: record.orderId,
    courierId: record.courierId,
    status: "ASSIGNED",
    updatedAt: normalizedUpdatedAt,
    revision: record.revision,
  };
};

const toApiError = (payload: unknown, status: number): AdminAssignmentApiError => {
  const record = ensureObject(payload) as AdminAssignmentErrorPayload | null;
  const code = typeof record?.error?.code === "string" ? record.error.code : `HTTP_${status}`;
  const message =
    typeof record?.error?.message === "string"
      ? record.error.message
      : "Assignment is temporarily unavailable.";
  const traceId = typeof record?.trace_id === "string" ? record.trace_id : null;

  return new AdminAssignmentApiError(code, message, traceId, record?.error?.details ?? null);
};

export const createAdminAssignmentApi = (options: AdminAssignmentApiOptions = {}): AdminAssignmentApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    submitAssignment: async (input) => {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/orders/${encodeURIComponent(input.orderId)}/assignment`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          courierId: input.courierId,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toCommandResult(payload);
    },
  };
};
