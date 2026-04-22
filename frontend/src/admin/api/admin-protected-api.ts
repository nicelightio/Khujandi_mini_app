type AdminProtectedHttpResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type AdminProtectedFetch = (
  input: string,
  init?: RequestInit,
) => Promise<AdminProtectedHttpResponse>;

type AdminErrorPayload = {
  error?: {
    code?: unknown;
  };
};

const ensureObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const isAuthRequiredPayload = (payload: unknown): boolean => {
  const record = ensureObject(payload) as AdminErrorPayload | null;
  return record?.error?.code === "AUTH_REQUIRED";
};

const toReplayableResponse = (payload: unknown, status: number): AdminProtectedHttpResponse => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => payload,
});

export const fetchProtectedAdminRoute = async (
  fetchImpl: AdminProtectedFetch,
  baseUrl: string,
  input: string,
  init: RequestInit,
): Promise<AdminProtectedHttpResponse> => {
  const response = await fetchImpl(input, init);

  if (response.ok || response.status !== 401) {
    return response;
  }

  const payload = await response.json();

  if (!isAuthRequiredPayload(payload)) {
    return toReplayableResponse(payload, response.status);
  }

  const refreshResponse = await fetchImpl(`${baseUrl}/api/v1/admin/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refreshResponse.ok) {
    return toReplayableResponse(payload, response.status);
  }

  return fetchImpl(input, init);
};
