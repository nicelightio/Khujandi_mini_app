import {
  createErrorCheckoutPaymentViewModel,
  createLoadingCheckoutPaymentViewModel,
  createReadyCheckoutPaymentViewModel,
  createSubmittingCheckoutPaymentViewModel,
  createSuccessCheckoutPaymentViewModel,
} from "../../../slices/checkout-payment/model/checkout-payment-view-model";

const bootstrap = {
  headline: "Checkout",
  statusLabel: "Secure checkout is ready.",
  supportingNotes: ["Telegram auth is requested only when you start checkout."],
  primaryActionLabel: "Continue to payment",
};

describe("checkout-payment view model", () => {
  it("creates a loading state for the checkout shell", () => {
    expect(createLoadingCheckoutPaymentViewModel()).toEqual({
      headline: "Оформление заказа",
      statusLabel: "Подготавливаем сессию оформления заказа...",
      supportingNotes: [],
      primaryActionLabel: "Перейти к оплате",
      isLoading: true,
      isSubmitting: false,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
    });

    expect(createLoadingCheckoutPaymentViewModel("tj")).toEqual({
      headline: "Пардохт",
      statusLabel: "Сессияи пардохтро омода карда истодаем...",
      supportingNotes: [],
      primaryActionLabel: "Ба пардохт гузаред",
      isLoading: true,
      isSubmitting: false,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
    });
  });

  it("creates a ready state from shell bootstrap data", () => {
    expect(createReadyCheckoutPaymentViewModel(bootstrap)).toEqual({
      headline: "Checkout",
      statusLabel: "Secure checkout is ready.",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      primaryActionLabel: "Continue to payment",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: false,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
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
      primaryActionLabel: "Повторить оплату",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: false,
      errorMessage: "Backend unavailable.",
      retryMessage: "Payment was not completed. You can try again.",
      successMessage: null,
    });
  });

  it("creates submitting and success states for checkout actions", () => {
    expect(createSubmittingCheckoutPaymentViewModel(bootstrap)).toEqual({
      headline: "Checkout",
      statusLabel: "Авторизуем Telegram и подтверждаем оплату...",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      primaryActionLabel: "Обрабатываем оформление...",
      isLoading: false,
      isSubmitting: true,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: null,
    });

    expect(
      createSuccessCheckoutPaymentViewModel(
        bootstrap,
        "Order created after trusted payment confirmation.",
      ),
    ).toEqual({
      headline: "Checkout",
      statusLabel: "Оформление заказа завершено.",
      supportingNotes: ["Telegram auth is requested only when you start checkout."],
      primaryActionLabel: "Заказ создан",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: true,
      errorMessage: null,
      retryMessage: null,
      successMessage: "Order created after trusted payment confirmation.",
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
        },
        "Backend unavailable.",
        "Оплата не завершилась. Попробуйте еще раз.",
        "ru",
      ),
    ).toEqual({
      headline: "Оформление заказа",
      statusLabel: "Сейчас не удалось завершить оформление заказа.",
      supportingNotes: ["Авторизация через Telegram запрашивается только после начала оформления."],
      primaryActionLabel: "Повторить оплату",
      isLoading: false,
      isSubmitting: false,
      isActionDisabled: false,
      errorMessage: "Backend unavailable.",
      retryMessage: "Оплата не завершилась. Попробуйте еще раз.",
      successMessage: null,
    });
  });
});
