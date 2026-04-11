export type SellerShopStatusRecord = {
  id: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  backgroundImageUrl: string | null;
  status: "WORKING" | "NOT_WORKING";
};

export type UpdateSellerShopStatusInput = {
  id: string;
  status: "WORKING" | "NOT_WORKING";
};

type SellerShopStatusErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  trace_id?: unknown;
};

export class SellerShopStatusApiError extends Error {
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

type SellerShopStatusHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type SellerShopStatusFetch = (input: string, init?: RequestInit) => Promise<SellerShopStatusHttpResponse>;

type SellerShopStatusApiOptions = {
  baseUrl?: string;
  fetch?: SellerShopStatusFetch;
};

export type SellerShopStatusApi = {
  listOwnedShops: () => Promise<SellerShopStatusRecord[]>;
  updateShopStatus: (input: UpdateSellerShopStatusInput) => Promise<SellerShopStatusRecord>;
};

const defaultFetch: SellerShopStatusFetch = async (input, init) => {
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

const toShopRecord = (value: unknown): SellerShopStatusRecord | null => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    (record.description !== null && typeof record.description !== "string") ||
    (record.headerImageUrl !== null && typeof record.headerImageUrl !== "string") ||
    (record.backgroundImageUrl !== null && typeof record.backgroundImageUrl !== "string") ||
    (record.status !== "WORKING" && record.status !== "NOT_WORKING")
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    description: record.description,
    headerImageUrl: record.headerImageUrl,
    backgroundImageUrl: record.backgroundImageUrl,
    status: record.status,
  };
};

const toShopRecords = (value: unknown): SellerShopStatusRecord[] => {
  if (!Array.isArray(value)) {
    throw new Error("Seller shops response payload is invalid.");
  }

  return value.map((entry) => {
    const shop = toShopRecord(entry);

    if (shop === null) {
      throw new Error("Seller shop payload is invalid.");
    }

    return shop;
  });
};

const toApiError = (payload: unknown, status: number): SellerShopStatusApiError => {
  const record = ensureObject(payload) as SellerShopStatusErrorPayload | null;
  const code = typeof record?.error?.code === "string" ? record.error.code : `HTTP_${status}`;
  const message =
    typeof record?.error?.message === "string"
      ? record.error.message
      : "Seller shop status is temporarily unavailable.";
  const traceId = typeof record?.trace_id === "string" ? record.trace_id : null;

  return new SellerShopStatusApiError(code, message, traceId, record?.error?.details ?? null);
};

export const createSellerShopStatusApi = (
  options: SellerShopStatusApiOptions = {},
): SellerShopStatusApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    listOwnedShops: async () => {
      const response = await fetchImpl(`${baseUrl}/api/v1/seller/shops`, {
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toShopRecords(payload);
    },
    updateShopStatus: async (input) => {
      const response = await fetchImpl(`${baseUrl}/api/v1/seller/shops/${encodeURIComponent(input.id)}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: input.status,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      const updatedShop = toShopRecord(payload);

      if (updatedShop === null) {
        throw new Error("Updated seller shop payload is invalid.");
      }

      return updatedShop;
    },
  };
};
