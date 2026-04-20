export type AdminCatalogProvisioningCommandInput = {
  sellerId: string;
  telegramId: string;
  name: string;
  description: string | null;
  headerImageUrl: string | null;
  backgroundImageUrl: string | null;
  status: "WORKING" | "NOT_WORKING";
};

export type AdminCatalogProvisioningCommandResult = {
  shopId: string;
  shopName: string;
  shopStatus: "WORKING" | "NOT_WORKING";
  sellerId: string;
  telegramId: string;
  primaryPublicPath: string;
  secondaryPublicPath: string;
  menuPagesCount: number;
  productsCount: number;
};

export type AdminProvisionedShopSummary = {
  shopId: string;
  shopName: string;
  status: "WORKING" | "NOT_WORKING";
  sellerId: string;
  telegramId: string | null;
  primaryPublicPath: string;
  secondaryPublicPath: string;
};

type AdminCatalogProvisioningErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    details?: unknown;
  };
  trace_id?: unknown;
};

export class AdminCatalogProvisioningApiError extends Error {
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

type AdminCatalogProvisioningHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type AdminCatalogProvisioningFetch = (
  input: string,
  init?: RequestInit,
) => Promise<AdminCatalogProvisioningHttpResponse>;

type AdminCatalogProvisioningApiOptions = {
  baseUrl?: string;
  fetch?: AdminCatalogProvisioningFetch;
};

export type AdminCatalogProvisioningApi = {
  listProvisionedShops: () => Promise<AdminProvisionedShopSummary[]>;
  submitProvisioning: (
    input: AdminCatalogProvisioningCommandInput,
  ) => Promise<AdminCatalogProvisioningCommandResult>;
};

const defaultFetch: AdminCatalogProvisioningFetch = async (input, init) => {
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

const toCommandResult = (value: unknown): AdminCatalogProvisioningCommandResult => {
  const record = ensureObject(value);
  const shop = ensureObject(record?.shop);
  const binding = ensureObject(record?.binding);

  if (
    record === null ||
    shop === null ||
    binding === null ||
    typeof shop.id !== "string" ||
    typeof shop.name !== "string" ||
    typeof shop.primaryPublicPath !== "string" ||
    typeof shop.secondaryPublicPath !== "string" ||
    (shop.status !== "WORKING" && shop.status !== "NOT_WORKING") ||
    typeof binding.sellerId !== "string" ||
    typeof binding.telegramId !== "string" ||
    !Array.isArray(record.menuPages) ||
    !Array.isArray(record.products)
  ) {
    throw new Error("Provisioning response payload is invalid.");
  }

  return {
    shopId: shop.id,
    shopName: shop.name,
    shopStatus: shop.status,
    sellerId: binding.sellerId,
    telegramId: binding.telegramId,
    primaryPublicPath: shop.primaryPublicPath,
    secondaryPublicPath: shop.secondaryPublicPath,
    menuPagesCount: record.menuPages.length,
    productsCount: record.products.length,
  };
};

const toProvisionedShopSummary = (value: unknown): AdminProvisionedShopSummary => {
  const record = ensureObject(value);

  if (
    record === null ||
    typeof record.shopId !== "string" ||
    typeof record.shopName !== "string" ||
    (record.status !== "WORKING" && record.status !== "NOT_WORKING") ||
    typeof record.sellerId !== "string" ||
    typeof record.primaryPublicPath !== "string" ||
    typeof record.secondaryPublicPath !== "string" ||
    (record.telegramId !== null && typeof record.telegramId !== "string")
  ) {
    throw new Error("Provisioned shops payload is invalid.");
  }

  return {
    shopId: record.shopId,
    shopName: record.shopName,
    status: record.status,
    sellerId: record.sellerId,
    telegramId: record.telegramId,
    primaryPublicPath: record.primaryPublicPath,
    secondaryPublicPath: record.secondaryPublicPath,
  };
};

const toProvisionedShops = (value: unknown): AdminProvisionedShopSummary[] => {
  if (!Array.isArray(value)) {
    throw new Error("Provisioned shops payload is invalid.");
  }

  return value.map((shop) => toProvisionedShopSummary(shop));
};

const toApiError = (payload: unknown, status: number): AdminCatalogProvisioningApiError => {
  const record = ensureObject(payload) as AdminCatalogProvisioningErrorPayload | null;
  const code = typeof record?.error?.code === "string" ? record.error.code : `HTTP_${status}`;
  const message =
    typeof record?.error?.message === "string"
      ? record.error.message
      : "Shop provisioning is temporarily unavailable.";
  const traceId = typeof record?.trace_id === "string" ? record.trace_id : null;

  return new AdminCatalogProvisioningApiError(code, message, traceId, record?.error?.details ?? null);
};

export const createAdminCatalogProvisioningApi = (
  options: AdminCatalogProvisioningApiOptions = {},
): AdminCatalogProvisioningApi => {
  const baseUrl = options.baseUrl ?? "";
  const fetchImpl = options.fetch ?? defaultFetch;

  return {
    listProvisionedShops: async () => {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/catalog/shops`, {
        method: "GET",
        credentials: "include",
      });

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toProvisionedShops(payload);
    },
    submitProvisioning: async (input) => {
      const response = await fetchImpl(`${baseUrl}/api/v1/admin/catalog/shops/provision`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(input),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw toApiError(payload, response.status);
      }

      return toCommandResult(payload);
    },
  };
};
