import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";

const testToken = "test-runtime-token";

const startStagingRuntime = async (paths?: { adminDatabasePath?: string; catalogDatabasePath?: string }) =>
  startDevApiServer({
    host: "127.0.0.1",
    port: 0,
    appEnv: "staging",
    nodeEnv: "test",
    isE2eTestModeEnabled: true,
    e2eTestToken: testToken,
    paymentProvider: "mock",
    ...paths,
  });

describe("dev runtime staging reset and seed endpoints", () => {
  it("keeps reset and seed routes absent when staging test mode is disabled", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      appEnv: "staging",
      nodeEnv: "test",
      isE2eTestModeEnabled: false,
      e2eTestToken: testToken,
    });

    try {
      const resetResponse = await runtime.createClient().request({
        path: "/api/v1/test/reset",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scope: "all",
        },
      });
      const seedResponse = await runtime.createClient().request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "baseline_catalog",
        },
      });

      expect(resetResponse.status).toBe(404);
      expect(seedResponse.status).toBe(404);
    } finally {
      await runtime.stop();
    }
  });

  it("keeps reset and seed routes absent in production mode", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      appEnv: "production",
      nodeEnv: "production",
      e2eTestToken: testToken,
    });

    try {
      const response = await runtime.createClient().request({
        path: "/api/v1/test/reset",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scope: "all",
        },
      });

      expect(response.status).toBe(404);
    } finally {
      await runtime.stop();
    }
  });

  it("requires X-E2E-Test-Token when reset and seed routes are enabled", async () => {
    const runtime = await startStagingRuntime();

    try {
      const missingTokenResponse = await runtime.createClient().request({
        path: "/api/v1/test/reset",
        body: {
          scope: "all",
        },
      });
      const wrongTokenResponse = await runtime.createClient().request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": "wrong-token",
        },
        body: {
          scenario: "baseline_catalog",
        },
      });

      expect(missingTokenResponse.status).toBe(403);
      expect(wrongTokenResponse.status).toBe(403);
    } finally {
      await runtime.stop();
    }
  });

  it("resets staging runtime state and seeds deterministic scenarios", async () => {
    const runtime = await startStagingRuntime();

    try {
      const client = runtime.createClient();
      const operatorSeedResponse = await client.request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "operator_orders",
        },
      });

      expect(operatorSeedResponse.status).toBe(200);
      expect(operatorSeedResponse.body).toMatchObject({
        ok: true,
        scenario: "operator_orders",
        catalog: {
          shops: 2,
          products: 4,
          bindings: 1,
          showcaseProducts: 2,
          favoriteShops: 2,
        },
        checkoutPayment: {
          users: 3,
          orders: 2,
          sessions: 0,
        },
      });
      expect(runtime.checkoutPaymentState.orders.map((order) => order.id)).toEqual([
        "test-order-created-1001",
        "test-order-delivered-2001",
      ]);

      const resetResponse = await client.request({
        path: "/api/v1/test/reset",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scope: "all",
        },
      });

      expect(resetResponse.status).toBe(200);
      expect(resetResponse.body).toMatchObject({
        ok: true,
        scope: "all",
        catalog: {
          shops: 2,
          products: 4,
          bindings: 0,
        },
        checkoutPayment: {
          users: 0,
          orders: 0,
          sessions: 0,
        },
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(0);

      const firstSeedResponse = await client.request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "checkout_happy",
        },
      });
      const secondSeedResponse = await client.request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "checkout_happy",
        },
      });

      expect(firstSeedResponse.status).toBe(200);
      expect(secondSeedResponse.status).toBe(200);
      expect(secondSeedResponse.body).toEqual(firstSeedResponse.body);
      expect(secondSeedResponse.body).toMatchObject({
        ok: true,
        scenario: "checkout_happy",
        catalog: {
          bindings: 1,
        },
        checkoutPayment: {
          users: 2,
          orders: 0,
          sessions: 0,
        },
      });
    } finally {
      await runtime.stop();
    }
  });

  it("returns controlled validation errors for unknown reset scope or seed scenario", async () => {
    const runtime = await startStagingRuntime();

    try {
      const unknownScopeResponse = await runtime.createClient().request({
        path: "/api/v1/test/reset",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scope: "production",
        },
      });
      const unknownScenarioResponse = await runtime.createClient().request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "custom_identity",
        },
      });

      expect(unknownScopeResponse.status).toBe(400);
      expect(unknownScopeResponse.body).toMatchObject({
        error: {
          code: "VALIDATION_ERROR",
        },
      });
      expect(unknownScenarioResponse.status).toBe(400);
      expect(unknownScenarioResponse.body).toMatchObject({
        error: {
          code: "VALIDATION_ERROR",
        },
      });
    } finally {
      await runtime.stop();
    }
  });

  it("uses explicit staging database paths without deleting unrelated local files", async () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "khujandi-staging-state-"));
    const sentinelPath = join(temporaryDirectory, "sentinel.txt");
    writeFileSync(sentinelPath, "keep", "utf8");

    const runtime = await startStagingRuntime({
      adminDatabasePath: join(temporaryDirectory, "admin-access-runtime.sqlite"),
      catalogDatabasePath: join(temporaryDirectory, "catalog-runtime.sqlite"),
    });

    try {
      expect(runtime.catalogDatabasePath).toBe(join(temporaryDirectory, "catalog-runtime.sqlite"));

      const response = await runtime.createClient().request({
        path: "/api/v1/test/reset",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scope: "all",
        },
      });

      expect(response.status).toBe(200);
      expect(existsSync(sentinelPath)).toBe(true);
    } finally {
      await runtime.stop();
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
