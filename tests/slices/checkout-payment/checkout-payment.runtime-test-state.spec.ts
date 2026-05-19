import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { adminOrigin } from "../catalog/catalog.runtime.test-helpers";

const testToken = "test-runtime-token";

jest.setTimeout(20000);

const startStagingRuntime = async (paths?: {
  adminDatabasePath?: string;
  catalogDatabasePath?: string;
  checkoutPaymentDatabasePath?: string;
  operationalRuntimeDatabasePath?: string;
}) =>
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
          orders: 3,
          sessions: 0,
        },
      });
      expect(runtime.checkoutPaymentState.orders.map((order) => order.id)).toEqual([
        "test-order-created-1001",
        "test-order-delivered-2001",
        "test-order-cancellable-3001",
      ]);

      const sessionResponse = await client.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "admin_boss",
        },
      });
      expect(sessionResponse.status).toBe(200);

      const operatorOrdersResponse = await client.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(operatorOrdersResponse.status).toBe(200);

      const operatorOrders = (operatorOrdersResponse.body as { orders: Array<{ orderId: string; history: Array<{
        status: string;
        previousStatus: string;
        actor: { role: string; name: string };
      }> }> }).orders;
      const createdOrder = operatorOrders.find((order) => order.orderId === "test-order-created-1001");
      const deliveredOrder = operatorOrders.find((order) => order.orderId === "test-order-delivered-2001");
      const cancellableOrder = operatorOrders.find(
        (order) => order.orderId === "test-order-cancellable-3001",
      );

      expect(createdOrder?.history).toEqual([
        expect.objectContaining({
          status: "CREATED",
          previousStatus: "CREATED",
          actor: expect.objectContaining({
            role: "system",
            name: "Staging seed",
          }),
        }),
      ]);
      expect(deliveredOrder?.history.map((history) => history.status)).toEqual([
        "ASSIGNED",
        "PICKED_UP",
        "IN_PROGRESS",
        "DELIVERED",
      ]);
      expect(deliveredOrder?.history[0]).toEqual(
        expect.objectContaining({
          previousStatus: "CREATED",
          actor: expect.objectContaining({
            role: "courier",
            name: "Courier 7",
          }),
        }),
      );
      expect(cancellableOrder?.history.map((history) => history.status)).toEqual([
        "ASSIGNED",
        "PICKED_UP",
        "IN_PROGRESS",
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

  it("persists and clears checkout/operational staging state through reset and seed", async () => {
    const temporaryDirectory = mkdtempSync(join(tmpdir(), "khujandi-staging-runtime-state-"));
    const paths = {
      checkoutPaymentDatabasePath: join(temporaryDirectory, "checkout-payment-runtime.sqlite"),
      operationalRuntimeDatabasePath: join(temporaryDirectory, "operational-runtime.sqlite"),
    };
    let runtime: Awaited<ReturnType<typeof startDevApiServer>> | null = await startStagingRuntime(paths);

    try {
      const client = runtime.createClient();
      const seedResponse = await client.request({
        path: "/api/v1/test/seed",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          scenario: "operator_orders",
        },
      });
      expect(seedResponse.status).toBe(200);
      expect(runtime.checkoutPaymentState.orders.map((order) => order.id)).toEqual([
        "test-order-created-1001",
        "test-order-delivered-2001",
        "test-order-cancellable-3001",
      ]);

      await runtime.stop();
      runtime = await startStagingRuntime(paths);

      expect(runtime.checkoutPaymentState.orders.map((order) => order.id)).toEqual([
        "test-order-created-1001",
        "test-order-delivered-2001",
        "test-order-cancellable-3001",
      ]);

      const resetResponse = await runtime.createClient().request({
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
        checkoutPayment: {
          users: 0,
          orders: 0,
          sessions: 0,
        },
      });

      await runtime.stop();
      runtime = await startStagingRuntime(paths);

      expect(runtime.checkoutPaymentState.users).toHaveLength(0);
      expect(runtime.checkoutPaymentState.orders).toHaveLength(0);

      const adminClient = runtime.createClient();
      const adminSessionResponse = await adminClient.request({
        path: "/api/v1/test/session",
        headers: {
          "x-e2e-test-token": testToken,
        },
        body: {
          persona: "admin_boss",
        },
      });
      expect(adminSessionResponse.status).toBe(200);

      const operatorOrdersResponse = await adminClient.request({
        path: "/api/v1/admin/operator/delivery/orders",
        method: "GET",
        origin: adminOrigin,
      });
      expect(operatorOrdersResponse.status).toBe(200);
      expect(operatorOrdersResponse.body).toMatchObject({
        orders: [],
      });
    } finally {
      if (runtime !== null) {
        await runtime.stop();
      }
      rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  });
});
