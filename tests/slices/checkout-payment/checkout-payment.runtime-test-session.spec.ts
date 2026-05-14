import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { adminOrigin } from "../catalog/catalog.runtime.test-helpers";

const testToken = "test-runtime-token";

jest.setTimeout(15000);

const startStagingRuntime = async () =>
  startDevApiServer({
    host: "127.0.0.1",
    port: 0,
    appEnv: "staging",
    nodeEnv: "test",
    isE2eTestModeEnabled: true,
    e2eTestToken: testToken,
    paymentProvider: "mock",
  });

describe("dev runtime fixed-persona test sessions", () => {
  it("keeps personas and session routes absent outside enabled staging test mode", async () => {
    const disabledRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      appEnv: "staging",
      nodeEnv: "test",
      isE2eTestModeEnabled: false,
      e2eTestToken: testToken,
    });

    try {
      const client = disabledRuntime.createClient();
      const personasResponse = await client.request({
        path: "/api/v1/test/personas",
        method: "GET",
        headers: {
          "x-e2e-test-token": testToken,
        },
      });
      const sessionResponse = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "client_alina",
        },
      });

      expect(personasResponse.status).toBe(404);
      expect(sessionResponse.status).toBe(404);
    } finally {
      await disabledRuntime.stop();
    }

    const productionRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      appEnv: "production",
      nodeEnv: "production",
      e2eTestToken: testToken,
    });

    try {
      const response = await productionRuntime.createClient().request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "client_alina",
        },
      });

      expect(response.status).toBe(404);
    } finally {
      await productionRuntime.stop();
    }
  });

  it("requires X-E2E-Test-Token for personas and session routes", async () => {
    const runtime = await startStagingRuntime();

    try {
      const client = runtime.createClient();
      const missingTokenResponse = await client.request({
        path: "/api/v1/test/personas",
        method: "GET",
      });
      const wrongTokenResponse = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": "wrong-token",
        },
        body: {
          persona: "client_alina",
        },
      });

      expect(missingTokenResponse.status).toBe(403);
      expect(wrongTokenResponse.status).toBe(403);
    } finally {
      await runtime.stop();
    }
  });

  it("returns only safe fixed persona metadata", async () => {
    const runtime = await startStagingRuntime();

    try {
      const response = await runtime.createClient().request({
        path: "/api/v1/test/personas",
        method: "GET",
        headers: {
          "x-e2e-test-token": testToken,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        personas: [
          { key: "client_alina", contour: "mini-app", role: "client" },
          { key: "seller_plov", contour: "mini-app", role: "seller" },
          { key: "admin_boss", contour: "admin-web", role: "admin" },
          { key: "courier_7", contour: "telegram-bot", role: "courier" },
        ],
      });
      expect(response.text).not.toContain("TOKEN");
      expect(response.text).not.toContain("cookie");
      expect(response.text).not.toContain("sessionToken");
      expect(response.text).not.toContain(testToken);
    } finally {
      await runtime.stop();
    }
  });

  it("creates mini-app cookie sessions for client and seller personas without granting seller by body authority", async () => {
    const runtime = await startStagingRuntime();

    try {
      const client = runtime.createClient();
      const clientSessionResponse = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "client_alina",
        },
      });
      const clientCookie = client.readCookieValue("khujandi_mini_app_session");

      expect(clientSessionResponse.status).toBe(200);
      expect(clientCookie).not.toBeNull();
      expect(clientSessionResponse.body).toMatchObject({
        persona: "client_alina",
        contour: "mini-app",
        role: "client",
        session: {
          transport: "httpOnlyCookie",
        },
      });
      expect(clientSessionResponse.text).not.toContain(clientCookie ?? "missing-cookie");

      const languageResponse = await client.request({
        path: "/api/v1/auth/telegram/language",
        body: {
          language: "en",
        },
      });
      expect(languageResponse.status).toBe(200);
      expect(languageResponse.body).toMatchObject({
        user: {
          telegramId: "910001",
          language: "en",
        },
      });

      const sellerWithoutSeed = runtime.createClient();
      await sellerWithoutSeed.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "seller_plov",
        },
      });
      const noSeedSellerShops = await sellerWithoutSeed.request({
        path: "/api/v1/seller/shops",
        method: "GET",
      });
      expect(noSeedSellerShops.status).toBe(403);
      expect(noSeedSellerShops.body).toMatchObject({
        error: {
          code: "FORBIDDEN",
        },
      });

      await runtime.createClient().request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "seller_owned_shop",
        },
      });

      const seededSeller = runtime.createClient();
      const sellerSessionResponse = await seededSeller.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "seller_plov",
        },
      });
      const sellerShopsResponse = await seededSeller.request({
        path: "/api/v1/seller/shops",
        method: "GET",
      });

      expect(sellerSessionResponse.status).toBe(200);
      expect(seededSeller.readCookieValue("khujandi_mini_app_session")).not.toBeNull();
      expect(sellerShopsResponse.status).toBe(200);
      expect(sellerShopsResponse.body).toEqual([
        expect.objectContaining({
          id: "shop-1",
        }),
      ]);
    } finally {
      await runtime.stop();
    }
  });

  it("creates an admin-access cookie session for admin_boss without leaking cookie values", async () => {
    const runtime = await startStagingRuntime();

    try {
      const client = runtime.createClient();
      const response = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "admin_boss",
        },
      });
      const accessCookie = client.readCookieValue("khujandi_admin_access_token");
      const refreshCookie = client.readCookieValue("khujandi_admin_refresh_token");

      expect(response.status).toBe(200);
      expect(accessCookie).not.toBeNull();
      expect(refreshCookie).not.toBeNull();
      expect(response.body).toMatchObject({
        persona: "admin_boss",
        contour: "admin-web",
        role: "admin",
        session: {
          transport: "httpOnlyCookie",
        },
      });
      expect(response.text).not.toContain(accessCookie ?? "missing-access-cookie");
      expect(response.text).not.toContain(refreshCookie ?? "missing-refresh-cookie");

      const protectedResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(protectedResponse.status).toBe(200);
    } finally {
      await runtime.stop();
    }
  });

  it("rejects unknown personas, unsupported operator persona, and arbitrary identity fields", async () => {
    const runtime = await startStagingRuntime();

    try {
      const client = runtime.createClient();
      const unknownResponse = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "custom_user",
        },
      });
      const unsupportedOperatorResponse = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "operator",
        },
      });
      const identityOverrideResponse = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "client_alina",
          telegramId: "999999",
          role: "boss",
          password: "not-accepted",
        },
      });

      expect(unknownResponse.status).toBe(400);
      expect(unknownResponse.body).toMatchObject({
        error: {
          code: "VALIDATION_ERROR",
        },
      });
      expect(unsupportedOperatorResponse.status).toBe(400);
      expect(unsupportedOperatorResponse.body).toMatchObject({
        error: {
          code: "VALIDATION_ERROR",
          details: {
            persona: "operator",
          },
        },
      });
      expect(identityOverrideResponse.status).toBe(400);
      expect(identityOverrideResponse.body).toMatchObject({
        error: {
          code: "VALIDATION_ERROR",
          details: {
            rejectedFields: ["telegramId", "role", "password"],
          },
        },
      });
      expect(runtime.checkoutPaymentState.users.some((user) => user.telegramId === "999999")).toBe(false);
    } finally {
      await runtime.stop();
    }
  });

  it("keeps courier persona to narrow test metadata without Telegram transport claims", async () => {
    const runtime = await startStagingRuntime();

    try {
      const client = runtime.createClient();
      const response = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "courier_7",
        },
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        persona: "courier_7",
        contour: "telegram-bot",
        role: "courier",
        session: {
          transport: "testMetadata",
        },
      });
      expect(response.headers["set-cookie"] ?? []).toEqual([]);
      expect(client.readCookieValue("khujandi_mini_app_session")).toBeNull();
      expect(client.readCookieValue("khujandi_admin_access_token")).toBeNull();
      expect(
        runtime.checkoutPaymentState.users.some(
          (user) =>
            user.telegramId === "70007" &&
            user.role === "courier",
        ),
      ).toBe(true);
      expect(runtime.checkoutPaymentState.users).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
          telegramId: "70007",
          role: "courier",
          }),
        ]),
      );
    } finally {
      await runtime.stop();
    }
  });
});
