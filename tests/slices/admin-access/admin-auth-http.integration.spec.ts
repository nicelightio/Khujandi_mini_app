import { startAdminAuthRuntimeServer } from "./admin-auth-runtime.test-helpers";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("admin auth HTTP runtime", () => {
  it("issues secure HttpOnly cookie pair on login, rotates refresh on refresh, and clears cookies on logout", async () => {
    const runtime = await startAdminAuthRuntimeServer();

    try {
      const client = runtime.createClient();
      const loginResponse = await client.request({
        path: "/api/v1/admin/auth/login",
        origin: "https://admin.example",
        body: {
          login: "boss@example.com",
          password: "super-secret-01",
        },
      });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toEqual({
        session: {
          adminAccountId: "admin-account-1",
          role: "boss",
          accessTokenExpiresAt: expect.any(String),
          refreshTokenExpiresAt: expect.any(String),
          idleExpiresAt: expect.any(String),
        },
      });

      const loginCookies = String(loginResponse.headers["set-cookie"] ?? "");
      expect(loginCookies).toContain("khujandi_admin_access_token=");
      expect(loginCookies).toContain("khujandi_admin_refresh_token=");
      expect(loginCookies).toContain("HttpOnly");
      expect(loginCookies).toContain("SameSite=Lax");
      expect(loginCookies).toContain("Secure");

      const loginRefreshCookie = client.readCookieValue("khujandi_admin_refresh_token");
      expect(loginRefreshCookie).not.toBeNull();

      const refreshResponse = await client.request({
        path: "/api/v1/admin/auth/refresh",
        origin: "https://admin.example",
      });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toEqual({
        session: {
          adminAccountId: "admin-account-1",
          role: "boss",
          accessTokenExpiresAt: expect.any(String),
          refreshTokenExpiresAt: expect.any(String),
          idleExpiresAt: expect.any(String),
        },
      });
      expect(client.readCookieValue("khujandi_admin_refresh_token")).not.toBe(loginRefreshCookie);

      const logoutResponse = await client.request({
        path: "/api/v1/admin/auth/logout",
        origin: "https://admin.example",
      });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body).toEqual({
        loggedOut: true,
      });
      expect(String(logoutResponse.headers["set-cookie"] ?? "")).toContain("Max-Age=0");
      expect(client.readCookieValue("khujandi_admin_refresh_token")).toBeNull();
      expect(runtime.prisma.state.audits.map((audit) => audit.action)).toEqual(["LOGIN_SUCCESS", "LOGOUT"]);
    } finally {
      await runtime.stop();
    }
  });

  it("rejects state-changing auth requests when Origin or Referer is outside the allowed admin boundary", async () => {
    const runtime = await startAdminAuthRuntimeServer();

    try {
      const client = runtime.createClient();
      const response = await client.request({
        path: "/api/v1/admin/auth/login",
        origin: "https://evil.example",
        body: {
          login: "boss@example.com",
          password: "super-secret-01",
        },
      });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Origin or Referer is not allowed",
          details: undefined,
        },
        trace_id: "trace-admin-runtime",
      });
      expect(runtime.prisma.state.sessions).toHaveLength(0);
    } finally {
      await runtime.stop();
    }
  });

  it("keeps the admin session valid after runtime restart on the same persisted DB path", async () => {
    const adminDatabasePath = join(
      tmpdir(),
      `khujandi-admin-auth-restart-${process.pid}-${Date.now()}.sqlite`,
    );
    let accessToken: string | null = null;
    let refreshToken: string | null = null;
    const firstRuntime = await startAdminAuthRuntimeServer({
      adminDatabasePath,
    });

    try {
      const firstClient = firstRuntime.createClient();
      const loginResponse = await firstClient.request({
        path: "/api/v1/admin/auth/login",
        origin: "https://admin.example",
        body: {
          login: "boss@example.com",
          password: "super-secret-01",
        },
      });

      expect(loginResponse.status).toBe(200);

      accessToken = firstClient.readCookieValue("khujandi_admin_access_token");
      refreshToken = firstClient.readCookieValue("khujandi_admin_refresh_token");

      expect(accessToken).not.toBeNull();
      expect(refreshToken).not.toBeNull();
    } finally {
      await firstRuntime.stop();
    }

    const restartedRuntime = await startAdminAuthRuntimeServer({
      adminDatabasePath,
    });

    try {
      const restartedClient = restartedRuntime.createClient();
      restartedClient.setCookieValue("khujandi_admin_access_token", accessToken ?? "");
      restartedClient.setCookieValue("khujandi_admin_refresh_token", refreshToken ?? "");

      const refreshResponse = await restartedClient.request({
        path: "/api/v1/admin/auth/refresh",
        origin: "https://admin.example",
      });

      expect(restartedRuntime.prisma.state.sessions).toHaveLength(1);
      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body).toEqual({
        session: {
          adminAccountId: "admin-account-1",
          role: "boss",
          accessTokenExpiresAt: expect.any(String),
          refreshTokenExpiresAt: expect.any(String),
          idleExpiresAt: expect.any(String),
        },
      });
    } finally {
      await restartedRuntime.stop();
    }
  });
});
