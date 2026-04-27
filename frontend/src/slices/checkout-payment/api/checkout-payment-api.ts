import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { getCopy } from "../../../shared/i18n/copy";
import type { CheckoutCompositionHandoff } from "../model/composition-handoff";

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
  updatedAt: string;
  revision: string;
  confirmationLabel: string;
};

export class CheckoutPaymentApiError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly retryAction: string | null;
  readonly repairAction: string | null;

  constructor(
    code: string,
    message: string,
    retryable = false,
    retryAction: string | null = null,
    repairAction: string | null = null,
  ) {
    super(message);
    this.code = code;
    this.retryable = retryable;
    this.retryAction = retryAction;
    this.repairAction = repairAction;
  }
}

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (text.length === 0) {
    return null;
  }

  return JSON.parse(text) as unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const toApiError = (payload: unknown, fallbackMessage: string): CheckoutPaymentApiError => {
  if (isRecord(payload) && isRecord(payload.error)) {
    const code = typeof payload.error.code === "string" ? payload.error.code : "CHECKOUT_UNAVAILABLE";
    const message = typeof payload.error.message === "string" ? payload.error.message : fallbackMessage;
    const details = isRecord(payload.error.details) ? payload.error.details : {};
    const retryable = details.retryable === true;
    const retryAction = typeof details.retryAction === "string" ? details.retryAction : null;
    const repairAction = typeof details.repairAction === "string" ? details.repairAction : null;

    return new CheckoutPaymentApiError(code, message, retryable, retryAction, repairAction);
  }

  return new CheckoutPaymentApiError("CHECKOUT_UNAVAILABLE", fallbackMessage);
};

const postJson = async (path: string, body: unknown): Promise<unknown> => {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw toApiError(payload, "Checkout is temporarily unavailable.");
  }

  return payload;
};

export type CheckoutPaymentApi = {
  loadCheckoutBootstrap: (language?: SupportedLanguage) => Promise<CheckoutPaymentBootstrap>;
  authenticateTelegram: (initData: string) => Promise<CheckoutPaymentAuthResult>;
  syncLanguagePreference: (input: CheckoutPaymentLanguageSyncInput) => Promise<void>;
  submitCheckout: (composition: CheckoutCompositionHandoff) => Promise<CheckoutPaymentOrderResult>;
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

    const payload = await postJson("/api/v1/auth/telegram", { initData });

    if (!isRecord(payload) || !isRecord(payload.user) || typeof payload.user.telegramId !== "string") {
      throw new CheckoutPaymentApiError("CHECKOUT_UNAVAILABLE", "Telegram auth response is invalid.");
    }

    return {
      transport: "httpOnlyCookie",
      requiresOriginCheck: true,
      telegramId: payload.user.telegramId,
    };
  },
  syncLanguagePreference: async (input) => {
    await postJson("/api/v1/auth/telegram/language", input);
  },
  submitCheckout: async (composition) => {
    const payload = await postJson("/api/v1/orders/checkout", { composition });

    if (
      !isRecord(payload) ||
      typeof payload.orderId !== "string" ||
      payload.paymentStatus !== "PAID" ||
      typeof payload.updated_at !== "string" ||
      typeof payload.revision !== "string"
    ) {
      throw new CheckoutPaymentApiError("CHECKOUT_UNAVAILABLE", "Checkout response is invalid.");
    }

    return {
      orderId: payload.orderId,
      paymentStatus: payload.paymentStatus,
      updatedAt: payload.updated_at,
      revision: payload.revision,
      confirmationLabel:
        typeof payload.confirmationLabel === "string"
          ? payload.confirmationLabel
          : getCopy().checkout.successConfirmation,
    };
  },
});
