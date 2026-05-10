import {
  createCheckoutPaymentCompositionSummary,
  createErrorCheckoutPaymentViewModel,
  createLoadingCheckoutPaymentViewModel,
  createRecoveryCheckoutPaymentViewModel,
  createReadyCheckoutPaymentViewModel,
  createSubmittingCheckoutPaymentViewModel,
  createSuccessCheckoutPaymentViewModel,
} from "../../../slices/checkout-payment/model/checkout-payment-view-model";

const bootstrap = {
  headline: "Checkout",
  statusLabel: "Secure checkout is ready.",
  supportingNotes: ["Telegram auth is requested only when you start checkout."],
  primaryActionLabel: "Continue to payment",
  mockPaymentAvailable: false,
};

const composition = {
  shop_public_path: "khujand-bakery",
  shop_id: "shop-1",
  items: [
    {
      product_id: "product-1",
      quantity: 2,
      display_snapshot: {
        product_name: "Somsa",
        unit_price_minor: 1500,
        currency: "TJS" as const,
      },
    },
  ],
  preview_total: {
    amount_minor: 3000,
    currency: "TJS" as const,
  },
  created_at: "2026-04-25T00:00:00.000Z",
};

describe("checkout-payment view model", () => {
  it("creates a loading state for the checkout shell", () => {
    expect(createLoadingCheckoutPaymentViewModel()).toEqual({
      headline: "Оформление заказа",
      statusLabel: "Подготавливаем сессию оформления заказа...",
      supportingNotes: [],
      mockPaymentAffordance: null,
      primaryActionLabel: "Перейти к оплате",
      isLoading: true,
      isSubmitting: false,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
      recoveryMessage: null,
      compositionSummary: null,
      statusEntry: null,
    });

    expect(createLoadingCheckoutPaymentViewModel("tj")).toEqual({
      headline: "Пардохт",
      statusLabel: "Сессияи пардохтро омода карда истодаем...",
      supportingNotes: [],
      mockPaymentAffordance: null,
      primaryActionLabel: "Ба пардохт гузаред",
      isLoading: true,
      isSubmitting: false,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
      recoveryMessage: null,
      compositionSummary: null,
      statusEntry: null,
    });
  });

  it("creates a ready state from shell bootstrap data", () => {
    expect(createReadyCheckoutPaymentViewModel(bootstrap, composition)).toEqual({
      headline: "Checkout",
      statusLabel: "Secure checkout is ready.",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      mockPaymentAffordance: null,
      primaryActionLabel: "Continue to payment",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: false,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
      recoveryMessage: null,
      compositionSummary: createCheckoutPaymentCompositionSummary(composition),
      statusEntry: null,
    });
  });

  it("creates a controlled recovery state when checkout has no composition draft", () => {
    expect(createRecoveryCheckoutPaymentViewModel(bootstrap, "en")).toEqual({
      headline: "Checkout",
      statusLabel: "Build your cart in the catalog first.",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      mockPaymentAffordance: null,
      primaryActionLabel: "Return to catalog",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: false,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
      recoveryMessage:
        "Checkout opens only from a non-empty cart. Return to the catalog and choose products before payment.",
      compositionSummary: null,
      statusEntry: null,
    });
  });

  it("creates a controlled error state for the checkout shell", () => {
    expect(
      createErrorCheckoutPaymentViewModel(
        bootstrap,
        "Backend unavailable.",
        "Payment was not completed. You can try again.",
      ),
    ).toEqual({
      headline: "Checkout",
      statusLabel: "Сейчас не удалось завершить оформление заказа.",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      mockPaymentAffordance: null,
      primaryActionLabel: "Повторить оплату",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: false,
      errorMessage: "Backend unavailable.",
      retryMessage: "Payment was not completed. You can try again.",
      successMessage: null,
      recoveryMessage: null,
      compositionSummary: null,
      statusEntry: null,
    });
  });

  it("creates submitting and success states for checkout actions", () => {
    expect(createSubmittingCheckoutPaymentViewModel(bootstrap)).toEqual({
      headline: "Checkout",
      statusLabel: "Авторизуем Telegram и подтверждаем оплату...",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      mockPaymentAffordance: null,
      primaryActionLabel: "Обрабатываем оформление...",
      isLoading: false,
      isSubmitting: true,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
      recoveryMessage: null,
      compositionSummary: null,
      statusEntry: null,
    });

    expect(
      createSuccessCheckoutPaymentViewModel(
        bootstrap,
        {
          orderId: "order-1",
          paymentStatus: "PAID",
          updatedAt: "2026-04-26T00:00:00.000Z",
          revision: "101",
          confirmationLabel: "Order created after trusted payment confirmation.",
        },
      ),
    ).toEqual({
      headline: "Checkout",
      statusLabel: "Оформление заказа завершено.",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      mockPaymentAffordance: null,
      primaryActionLabel: "Заказ создан",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: "Order created after trusted payment confirmation.",
      recoveryMessage: null,
      compositionSummary: null,
      statusEntry: {
        href: "/tracking?orderId=order-1&cursor=101",
        label: "Следить за статусом заказа",
        metadataLabel: "Заказ order-1 готов к отслеживанию с revision 101.",
      },
    });
  });

  it("creates localized retry copy for the selected language", () => {
    expect(
      createErrorCheckoutPaymentViewModel(
        {
          headline: "Оформление заказа",
          statusLabel: "Безопасное оформление заказа готово.",
          supportingNotes: ["Авторизация через Telegram запрашивается только после начала оформления."],
          primaryActionLabel: "Перейти к оплате",
          mockPaymentAvailable: false,
        },
        "Backend unavailable.",
        "Оплата не завершилась. Попробуйте еще раз.",
        "ru",
      ),
    ).toEqual({
      headline: "Оформление заказа",
      statusLabel: "Сейчас не удалось завершить оформление заказа.",
      supportingNotes: ["Авторизация через Telegram запрашивается только после начала оформления."],
      mockPaymentAffordance: null,
      primaryActionLabel: "Повторить оплату",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: false,
      errorMessage: "Backend unavailable.",
      retryMessage: "Оплата не завершилась. Попробуйте еще раз.",
      successMessage: null,
      recoveryMessage: null,
      compositionSummary: null,
      statusEntry: null,
    });
  });

  it("creates a mock payment affordance only when backend availability is true", () => {
    expect(
      createReadyCheckoutPaymentViewModel(
        {
          ...bootstrap,
          mockPaymentAvailable: true,
        },
        composition,
        "en",
      ),
    ).toMatchObject({
      mockPaymentAffordance: {
        label: "E2E mock payment is active.",
        body: "The backend mock provider is available. The existing checkout button still submits to the backend.",
      },
      primaryActionLabel: "Continue to payment",
      isActionDisabled: false,
    });
  });
});
