import {
  AdminAuthApiError,
  createAdminAuthApi,
} from "../../admin/api/admin-auth-api";

describe("admin auth api", () => {
  it("posts login and parses the cookie-session metadata payload", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        adminAccountId: "admin-account-7",
        role: "manager",
        accessTokenExpiresAt: "2026-04-05T10:15:00.000Z",
        refreshTokenExpiresAt: "2026-04-08T10:00:00.000Z",
        idleExpiresAt: "2026-04-05T10:30:00.000Z",
      }),
    });

    await expect(
      createAdminAuthApi({ fetch: fetchMock }).login({
        login: "ops.manager",
        password: "correct-horse-battery",
      }),
    ).resolves.toEqual({
      adminAccountId: "admin-account-7",
      role: "manager",
      accessTokenExpiresAt: "2026-04-05T10:15:00.000Z",
      refreshTokenExpiresAt: "2026-04-08T10:00:00.000Z",
      idleExpiresAt: "2026-04-05T10:30:00.000Z",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        login: "ops.manager",
        password: "correct-horse-battery",
      }),
    });
  });

  it("posts refresh with credentials included", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        session: {
          admin_account_id: "admin-account-7",
          role: "admin",
          access_token_expires_at: "2026-04-05T10:15:00.000Z",
          refresh_token_expires_at: "2026-04-08T10:00:00.000Z",
          idle_expires_at: "2026-04-05T10:30:00.000Z",
        },
      }),
    });

    await expect(createAdminAuthApi({ fetch: fetchMock }).refresh()).resolves.toEqual({
      adminAccountId: "admin-account-7",
      role: "admin",
      accessTokenExpiresAt: "2026-04-05T10:15:00.000Z",
      refreshTokenExpiresAt: "2026-04-08T10:00:00.000Z",
      idleExpiresAt: "2026-04-05T10:30:00.000Z",
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
  });

  it("maps lockout responses into the project error contract", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Admin account is temporarily locked",
          details: {
            locked_until: "2026-04-05T10:30:00.000Z",
          },
        },
        trace_id: "trace-locked",
      }),
    });

    await expect(
      createAdminAuthApi({ fetch: fetchMock }).login({
        login: "ops.manager",
        password: "wrong-password",
      }),
    ).rejects.toEqual(
      new AdminAuthApiError("TOO_MANY_REQUESTS", "Admin account is temporarily locked", "trace-locked", {
        locked_until: "2026-04-05T10:30:00.000Z",
      }),
    );
  });

  it("posts logout and treats empty success payloads as a valid sign-out", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => null,
    });

    await expect(createAdminAuthApi({ fetch: fetchMock }).logout()).resolves.toEqual({
      loggedOut: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/v1/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });
});
