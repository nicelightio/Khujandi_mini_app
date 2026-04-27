import {
  CheckoutPaymentApiError,
  createCheckoutPaymentApi,
} from "../../../slices/checkout-payment/api/checkout-payment-api";

const composition = {
  shop_public_path: "khujand-bakery",
  shop_id: "shop-1",
  items: [
    {
      product_id: "product-1",
      quantity: 1,
      display_snapshot: {
        product_name: "Somsa",
        unit_price_minor: 1500,
        currency: "TJS" as const,
      },
    },
  ],
  preview_total: {
    amount_minor: 1500,
    currency: "TJS" as const,
  },
  created_at: "2026-04-25T00:00:00.000Z",
};

describe("checkout-payment api scaffold", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("returns a static checkout bootstrap plus backend-facing auth and checkout helpers", async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          user: {
            telegramId: "42",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          user: {
            telegramId: "42",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({
          orderId: "order-1",
          paymentStatus: "PAID",
          updated_at: "2026-04-26T00:00:00.000Z",
          revision: "101",
          confirmationLabel: "Заказ создан после доверенного подтверждения оплаты.",
        }),
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(createCheckoutPaymentApi().loadCheckoutBootstrap()).resolves.toEqual({
      headline: "Оформление заказа",
      statusLabel: "Безопасное оформление заказа готово.",
      supportingNotes: [
        "Авторизация через Telegram запрашивается только после начала оформления.",
        "Заказ создается только после доверенного серверного подтверждения оплаты.",
      ],
      primaryActionLabel: "Перейти к оплате",
    });
    await expect(createCheckoutPaymentApi().loadCheckoutBootstrap("ru")).resolves.toEqual({
      headline: "Оформление заказа",
      statusLabel: "Безопасное оформление заказа готово.",
      supportingNotes: [
        "Авторизация через Telegram запрашивается только после начала оформления.",
        "Заказ создается только после доверенного серверного подтверждения оплаты.",
      ],
      primaryActionLabel: "Перейти к оплате",
    });
    await expect(createCheckoutPaymentApi().authenticateTelegram("query_id=raw")).resolves.toEqual({
      transport: "httpOnlyCookie",
      requiresOriginCheck: true,
      telegramId: "42",
    });
    await expect(
      createCheckoutPaymentApi().syncLanguagePreference({
        telegramId: "42",
        language: "en",
      }),
    ).resolves.toBeUndefined();
    await expect(createCheckoutPaymentApi().submitCheckout(composition)).resolves.toEqual({
      orderId: "order-1",
      paymentStatus: "PAID",
      updatedAt: "2026-04-26T00:00:00.000Z",
      revision: "101",
      confirmationLabel: "Заказ создан после доверенного подтверждения оплаты.",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/telegram", expect.objectContaining({
      credentials: "same-origin",
      method: "POST",
    }));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/auth/telegram/language", expect.objectContaining({
      credentials: "same-origin",
      method: "POST",
    }));
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/orders/checkout", expect.objectContaining({
      credentials: "same-origin",
      method: "POST",
    }));
  });

  it("rejects missing Telegram init data before auth is considered complete", async () => {
    await expect(createCheckoutPaymentApi().authenticateTelegram("   ")).rejects.toEqual(
      new CheckoutPaymentApiError("AUTH_REQUIRED", "Telegram init data is missing."),
    );
  });

  it("maps mounted runtime errors to retry-aware checkout errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({
        error: {
          code: "PAYMENT_CONFIRMATION_REQUIRED",
          message: "Trusted payment confirmation is required before order creation",
          details: {
            retryable: true,
            retryAction: "retry_checkout",
            orderCreated: false,
          },
        },
        trace_id: "trace-checkout-payment-runtime",
      }),
    }) as unknown as typeof fetch;

    await expect(createCheckoutPaymentApi().submitCheckout(composition)).rejects.toMatchObject({
      code: "PAYMENT_CONFIRMATION_REQUIRED",
      message: "Trusted payment confirmation is required before order creation",
      retryable: true,
      retryAction: "retry_checkout",
    });
  });

  it("maps composition repair responses to repair-aware checkout errors", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => JSON.stringify({
        error: {
          code: "COMPOSITION_REPAIR_REQUIRED",
          message: "Checkout composition is invalid",
          details: {
            reason: "composition_invalid",
            repairAction: "repair_composition",
            orderCreated: false,
          },
        },
        trace_id: "trace-checkout-payment-runtime",
      }),
    }) as unknown as typeof fetch;

    await expect(createCheckoutPaymentApi().submitCheckout(composition)).rejects.toMatchObject({
      code: "COMPOSITION_REPAIR_REQUIRED",
      message: "Checkout composition is invalid",
      retryable: false,
      retryAction: null,
      repairAction: "repair_composition",
    });
  });
});
