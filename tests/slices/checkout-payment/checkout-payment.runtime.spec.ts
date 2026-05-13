import { startDevApiServer } from "../../../backend/src/dev-runtime/dev-api-server";
import { resolveRuntimeCheckoutPaymentProvider } from "../../../backend/src/dev-runtime/payment-provider-runtime";
import { adminOrigin, createTelegramInitData } from "../catalog/catalog.runtime.test-helpers";

const composition = {
  shop_public_path: "seller-runtime-11",
  shop_id: "shop-1",
  items: [
    {
      product_id: "product-1",
      quantity: 1,
      display_snapshot: {
        product_name: "Плов зарвода",
        unit_price_minor: 4500,
        currency: "TJS",
      },
    },
  ],
  preview_total: {
    amount_minor: 4500,
    currency: "TJS",
  },
  created_at: "2026-04-26T00:00:00.000Z",
};

const stalePriceComposition = {
  ...composition,
  items: [
    {
      product_id: "product-1",
      quantity: 1,
      display_snapshot: {
        product_name: "Плов зарвода",
        unit_price_minor: 4400,
        currency: "TJS",
      },
    },
  ],
  preview_total: {
    amount_minor: 4400,
    currency: "TJS",
  },
};

describe("checkout-payment mounted runtime", () => {
  it("accepts explicit PAYMENT_PROVIDER=mock with staging guard and keeps checkout idempotent", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      paymentProvider: "mock",
      nodeEnv: "test",
      appEnv: "staging",
    });

    try {
      const initialOrderCount = runtime.checkoutPaymentState.orders.length;
      const bootstrapResponse = await runtime.createClient().request({
        path: "/api/v1/orders/checkout/bootstrap",
        method: "GET",
        origin: adminOrigin,
      });

      expect(bootstrapResponse.status).toBe(200);
      expect(bootstrapResponse.body).toEqual({
        mockPaymentAvailable: true,
        testSessionAuthAvailable: false,
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);

      const anonymousClient = runtime.createClient();
      const anonymousCheckout = await anonymousClient.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {
          composition,
        },
      });

      expect(anonymousCheckout.status).toBe(401);
      expect(anonymousCheckout.body).toMatchObject({
        error: {
          code: "AUTH_REQUIRED",
        },
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);

      const client = runtime.createClient();
      const authResponse = await client.request({
        path: "/api/v1/auth/telegram",
        origin: adminOrigin,
        body: {
          initData: createTelegramInitData({
            authDate: Math.floor(Date.now() / 1000),
            telegramId: "4204",
            firstName: "Checkout",
            lastName: "Client",
            username: "checkout_client",
          }),
        },
      });

      expect(authResponse.status).toBe(200);
      expect(authResponse.body).toMatchObject({
        user: {
          telegramId: "4204",
        },
      });
      expect(client.readCookieValue("khujandi_mini_app_session")).not.toBeNull();

      const languageResponse = await client.request({
        path: "/api/v1/auth/telegram/language",
        origin: adminOrigin,
        body: {
          telegramId: "different-client-id-is-ignored",
          language: "en",
        },
      });

      expect(languageResponse.status).toBe(200);
      expect(languageResponse.body).toMatchObject({
        user: {
          telegramId: "4204",
          language: "en",
        },
      });

      const checkoutResponse = await client.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {
          composition,
        },
      });

      expect(checkoutResponse.status).toBe(200);
      expect(checkoutResponse.body).toMatchObject({
        orderId: expect.any(String),
        status: "CREATED",
        paymentStatus: "PAID",
        updated_at: expect.any(String),
        revision: expect.any(String),
      });
      expect(checkoutResponse.body.revision).not.toBe(checkoutResponse.body.orderId);
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount + 1);
      expect(runtime.checkoutPaymentState.orders.at(-1)).toMatchObject({
        shopId: "shop-1",
        shopNameSnapshot: "Плов в парке Сомони",
        sellerId: "seller-runtime-1",
        clientId: expect.any(String),
        status: "CREATED",
        itemsTotalMinor: 4500,
        deliveryFeeMinor: 0,
        totalAmountMinor: 4500,
        paymentProvider: "mock",
        paymentStatus: "PAID",
        refundStatus: "NOT_REQUIRED",
      });
      const createdOrderBody = checkoutResponse.body as { orderId: string };

      const duplicateCheckoutResponse = await client.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {
          composition,
        },
      });

      expect(duplicateCheckoutResponse.status).toBe(200);
      expect(duplicateCheckoutResponse.body).toMatchObject({
        orderId: createdOrderBody.orderId,
        status: "CREATED",
        paymentStatus: "PAID",
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount + 1);
    } finally {
      await runtime.stop();
    }
  });

  it("keeps direct checkout and stale server-side revalidation no-order in mock mode", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      paymentProvider: "mock",
      nodeEnv: "test",
      appEnv: "staging",
    });

    try {
      const initialOrderCount = runtime.checkoutPaymentState.orders.length;
      const bootstrapResponse = await runtime.createClient().request({
        path: "/api/v1/orders/checkout/bootstrap",
        method: "GET",
        origin: adminOrigin,
      });

      expect(bootstrapResponse.status).toBe(200);
      expect(bootstrapResponse.body).toEqual({
        mockPaymentAvailable: true,
        testSessionAuthAvailable: false,
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);

      const client = runtime.createClient();
      await client.request({
        path: "/api/v1/auth/telegram",
        origin: adminOrigin,
        body: {
          initData: createTelegramInitData({
            authDate: Math.floor(Date.now() / 1000),
            telegramId: "4407",
            firstName: "Direct",
            lastName: "Client",
            username: "direct_checkout_client",
          }),
        },
      });

      const directCheckoutResponse = await client.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {},
      });

      expect(directCheckoutResponse.status).toBe(409);
      expect(directCheckoutResponse.body).toMatchObject({
        error: {
          code: "COMPOSITION_REPAIR_REQUIRED",
          details: {
            reason: "composition_missing",
            repairAction: "repair_composition",
            orderCreated: false,
          },
        },
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);

      const staleCheckoutResponse = await client.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {
          composition: stalePriceComposition,
        },
      });

      expect(staleCheckoutResponse.status).toBe(409);
      expect(staleCheckoutResponse.body).toMatchObject({
        error: {
          code: "COMPOSITION_REPAIR_REQUIRED",
          details: {
            reason: "price_changed",
            repairAction: "repair_composition",
            orderCreated: false,
          },
        },
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);
    } finally {
      await runtime.stop();
    }
  });

  it("rejects PAYMENT_PROVIDER=mock in production-like runtime before checkout trust", async () => {
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

  it("rejects PAYMENT_PROVIDER=mock without an explicit staging or e2e guard", async () => {
    expect(() =>
      resolveRuntimeCheckoutPaymentProvider({
        paymentProvider: "mock",
        nodeEnv: "development",
      }),
    ).toThrow("Mock payment provider requires APP_ENV=local|test|staging or E2E_TEST_MODE=TRUE");

    await expect(
      startDevApiServer({
        host: "127.0.0.1",
        port: 0,
        paymentProvider: "mock",
        nodeEnv: "development",
      }),
    ).rejects.toThrow("Mock payment provider requires APP_ENV=local|test|staging or E2E_TEST_MODE=TRUE");
  });

  it("accepts PAYMENT_PROVIDER=mock with explicit e2e guard without NODE_ENV=development semantics", () => {
    expect(
      resolveRuntimeCheckoutPaymentProvider({
        paymentProvider: "mock",
        nodeEnv: "test",
        e2eTestMode: true,
      }),
    ).toMatchObject({
      enabled: true,
      provider: "mock",
    });
  });

  it("does not trust DEBUG=true without explicit PAYMENT_PROVIDER=mock", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      isDebugEnabled: true,
      nodeEnv: "development",
    });

    try {
      const initialOrderCount = runtime.checkoutPaymentState.orders.length;
      const bootstrapResponse = await runtime.createClient().request({
        path: "/api/v1/orders/checkout/bootstrap",
        method: "GET",
        origin: adminOrigin,
      });

      expect(bootstrapResponse.status).toBe(200);
      expect(bootstrapResponse.body).toEqual({
        mockPaymentAvailable: false,
        testSessionAuthAvailable: false,
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);

      const client = runtime.createClient();
      await client.request({
        path: "/api/v1/auth/telegram",
        origin: adminOrigin,
        body: {
          initData: createTelegramInitData({
            authDate: Math.floor(Date.now() / 1000),
            telegramId: "4317",
            firstName: "Debug",
            lastName: "Client",
            username: "debug_checkout_client",
          }),
        },
      });

      const checkoutResponse = await client.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {
          composition,
        },
      });

      expect(checkoutResponse.status).toBe(503);
      expect(checkoutResponse.body).toMatchObject({
        error: {
          code: "PAYMENT_PROVIDER_UNAVAILABLE",
          details: {
            orderCreated: false,
          },
        },
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);
    } finally {
      await runtime.stop();
    }
  });

  it.each([
    ["FAILED", "payment_failed"],
    ["CANCELED", "payment_canceled"],
    ["PENDING", "payment_timeout"],
    ["AMBIGUOUS", "payment_ambiguous"],
  ] as const)("keeps %s provider outcomes retry-safe without creating orders", async (status, failureCategory) => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      paymentProvider: "mock",
      nodeEnv: "test",
      appEnv: "staging",
      checkoutPaymentProviderStatusResolver: () => status,
    });

    try {
      const initialOrderCount = runtime.checkoutPaymentState.orders.length;
      const client = runtime.createClient();
      await client.request({
        path: "/api/v1/auth/telegram",
        origin: adminOrigin,
        body: {
          initData: createTelegramInitData({
            authDate: Math.floor(Date.now() / 1000),
            telegramId: `52${status.length}`,
            firstName: "Checkout",
            lastName: "Client",
            username: `checkout_${status.toLowerCase()}`,
          }),
        },
      });

      const checkoutResponse = await client.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {
          composition,
        },
      });

      expect(checkoutResponse.status).toBe(409);
      expect(checkoutResponse.body).toMatchObject({
        error: {
          code: "CONFLICT",
          details: {
            paymentStatus: status,
            failureCategory,
            retryable: true,
            retryAction: "retry_checkout",
            orderCreated: false,
          },
        },
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);
    } finally {
      await runtime.stop();
    }
  });

  it("returns controlled repair feedback for malformed composition instead of a runtime 500", async () => {
    const runtime = await startDevApiServer({
      host: "127.0.0.1",
      port: 0,
      paymentProvider: "mock",
      nodeEnv: "test",
      appEnv: "staging",
    });

    try {
      const initialOrderCount = runtime.checkoutPaymentState.orders.length;
      const client = runtime.createClient();
      await client.request({
        path: "/api/v1/auth/telegram",
        origin: adminOrigin,
        body: {
          initData: createTelegramInitData({
            authDate: Math.floor(Date.now() / 1000),
            telegramId: "4306",
            firstName: "Checkout",
            lastName: "Client",
            username: "checkout_repair",
          }),
        },
      });

      const checkoutResponse = await client.request({
        path: "/api/v1/orders/checkout",
        origin: adminOrigin,
        body: {
          composition: {
            shop_public_path: "seller-runtime-11",
            items: [],
            preview_total: {
              amount_minor: 0,
              currency: "TJS",
            },
          },
        },
      });

      expect(checkoutResponse.status).toBe(409);
      expect(checkoutResponse.body).toMatchObject({
        error: {
          code: "COMPOSITION_REPAIR_REQUIRED",
          details: {
            reason: "composition_invalid",
            repairAction: "repair_composition",
            orderCreated: false,
          },
        },
      });
      expect(runtime.checkoutPaymentState.orders).toHaveLength(initialOrderCount);
    } finally {
      await runtime.stop();
    }
  });
});
