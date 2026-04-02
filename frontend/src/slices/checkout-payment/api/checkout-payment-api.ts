import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { getCopy } from "../../../shared/i18n/copy";

export type CheckoutPaymentBootstrap = {
  headline: string;
  statusLabel: string;
  supportingNotes: string[];
  primaryActionLabel: string;
};

export type CheckoutPaymentAuthResult = {
  transport: "httpOnlyCookie";
  requiresOriginCheck: boolean;
  telegramId: string;
};

export type CheckoutPaymentLanguageSyncInput = {
  telegramId: string;
  language: SupportedLanguage;
};

export type CheckoutPaymentOrderResult = {
  orderId: string;
  paymentStatus: "PAID";
  confirmationLabel: string;
};

export class CheckoutPaymentApiError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly retryAction: string | null;

  constructor(code: string, message: string, retryable = false, retryAction: string | null = null) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.retryAction = retryAction;
  }
}

export type CheckoutPaymentApi = {
  loadCheckoutBootstrap: (language?: SupportedLanguage) => Promise<CheckoutPaymentBootstrap>;
  authenticateTelegram: (initData: string) => Promise<CheckoutPaymentAuthResult>;
  syncLanguagePreference: (input: CheckoutPaymentLanguageSyncInput) => Promise<void>;
  submitCheckout: () => Promise<CheckoutPaymentOrderResult>;
};

export const createCheckoutPaymentApi = (): CheckoutPaymentApi => ({
  loadCheckoutBootstrap: async (language) => ({
    headline: getCopy(language).checkout.headline,
    statusLabel: getCopy(language).checkout.readyStatus,
    supportingNotes: [
      getCopy(language).checkout.noteAuth,
      getCopy(language).checkout.noteTrustedPayment,
    ],
    primaryActionLabel: getCopy(language).checkout.primaryAction,
  }),
  authenticateTelegram: async (initData: string) => {
    if (initData.trim().length === 0) {
      throw new CheckoutPaymentApiError("AUTH_REQUIRED", "Telegram init data is missing.");
    }

    return {
      transport: "httpOnlyCookie",
      requiresOriginCheck: true,
      telegramId: "42",
    };
  },
  syncLanguagePreference: async () => undefined,
  submitCheckout: async () => ({
    orderId: "order-demo-1",
    paymentStatus: "PAID",
    confirmationLabel: getCopy().checkout.successConfirmation,
  }),
});
