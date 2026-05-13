import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { resolveRuntimeMode } from "../../../backend/src/dev-runtime/runtime-mode";
import { resolveRuntimeCheckoutPaymentProvider } from "../../../backend/src/dev-runtime/payment-provider-runtime";

describe("dev runtime mode guards and health", () => {
  it("returns only non-secret runtime facts from health", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      appEnv: "staging",
      nodeEnv: "staging",
      isDebugEnabled: true,
      isE2eTestModeEnabled: true,
      paymentProvider: "mock",
    });

    try {
      const response = await runtime.createClient().request({
        path: "/api/v1/health",
        method: "GET",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        appEnv: "staging",
        nodeEnv: "staging",
        debug: true,
        paymentProvider: "mock",
        e2eTestMode: true,
        version: "dev",
      });

      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain("DATABASE_URL");
      expect(serialized).not.toContain("TOKEN");
      expect(serialized).not.toContain("cookie");
      expect(serialized).not.toContain("session");
      expect(serialized).not.toContain("initData");
      expect(serialized).not.toContain("secret");
    } finally {
      await runtime.stop();
    }
  });

  it("exposes checkout test session auth metadata only for explicit staging debug e2e runtime", async () => {
    const stagingRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      appEnv: "staging",
      nodeEnv: "staging",
      isDebugEnabled: true,
      isE2eTestModeEnabled: true,
      paymentProvider: "mock",
    });

    try {
      const response = await stagingRuntime.createClient().request({
        path: "/api/v1/orders/checkout/bootstrap",
        method: "GET",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        mockPaymentAvailable: true,
        testSessionAuthAvailable: true,
      });
    } finally {
      await stagingRuntime.stop();
    }

    const debugOnlyRuntime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      appEnv: "staging",
      nodeEnv: "staging",
      isDebugEnabled: true,
      paymentProvider: "mock",
    });

    try {
      const response = await debugOnlyRuntime.createClient().request({
        path: "/api/v1/orders/checkout/bootstrap",
        method: "GET",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        mockPaymentAvailable: true,
        testSessionAuthAvailable: false,
      });
    } finally {
      await debugOnlyRuntime.stop();
    }
  });

  it("fails closed when E2E_TEST_MODE is enabled in production", async () => {
    expect(() =>
      resolveRuntimeMode({
        nodeEnv: "production",
        appEnv: "production",
        e2eTestMode: true,
      }),
    ).toThrow("E2E_TEST_MODE is not allowed in production");

    await expect(
      startDevApiServer({
        host: "127.0.0.1",
        port: 0,
        nodeEnv: "production",
        appEnv: "production",
        isE2eTestModeEnabled: true,
      }),
    ).rejects.toThrow("E2E_TEST_MODE is not allowed in production");
  });

  it("refuses mock payment provider in production even with staging flags", async () => {
    expect(() =>
      resolveRuntimeCheckoutPaymentProvider({
        paymentProvider: "mock",
        nodeEnv: "production",
        appEnv: "staging",
        e2eTestMode: true,
      }),
    ).toThrow("Mock payment provider is not allowed in production");

    await expect(
      startDevApiServer({
        host: "127.0.0.1",
        port: 0,
        paymentProvider: "mock",
        nodeEnv: "production",
        appEnv: "staging",
      }),
    ).rejects.toThrow("Mock payment provider is not allowed in production");
  });

  it("disables DEBUG diagnostics in production and keeps test routes absent", async () => {
    expect(
      resolveRuntimeMode({
        nodeEnv: "production",
        appEnv: "production",
        debug: true,
      }),
    ).toMatchObject({
      debug: false,
    });

    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      nodeEnv: "production",
      appEnv: "production",
      isDebugEnabled: true,
    });

    try {
      const healthResponse = await runtime.createClient().request({
        path: "/api/v1/health",
        method: "GET",
      });
      const testRouteResponse = await runtime.createClient().request({
        path: "/api/v1/test/personas",
        method: "GET",
      });

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toMatchObject({
        debug: false,
        e2eTestMode: false,
      });
      expect(testRouteResponse.status).toBe(404);
    } finally {
      await runtime.stop();
    }
  });
});
