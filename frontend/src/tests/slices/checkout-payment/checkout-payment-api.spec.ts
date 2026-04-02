import {
  CheckoutPaymentApiError,
  createCheckoutPaymentApi,
} from "../../../slices/checkout-payment/api/checkout-payment-api";

describe("checkout-payment api scaffold", () => {
  it("returns a static checkout bootstrap plus backend-facing auth and checkout helpers", async () => {
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
    await expect(createCheckoutPaymentApi().submitCheckout()).resolves.toEqual({
      orderId: "order-demo-1",
      paymentStatus: "PAID",
      confirmationLabel: "Заказ создан после доверенного подтверждения оплаты.",
    });
  });

  it("rejects missing Telegram init data before auth is considered complete", async () => {
    await expect(createCheckoutPaymentApi().authenticateTelegram("   ")).rejects.toEqual(
      new CheckoutPaymentApiError("AUTH_REQUIRED", "Telegram init data is missing."),
    );
  });
});
