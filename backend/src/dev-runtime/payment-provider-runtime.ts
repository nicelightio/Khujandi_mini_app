import { AppError } from "../shared/errors/app-error";

export type RuntimeCheckoutPaymentProvider =
  | {
      enabled: false;
    }
  | {
      enabled: true;
      provider: "mock";
      providerName: "mock";
      secretToken: string;
    };

const MOCK_PAYMENT_PROVIDER_SECRET = "mock-payment-provider-secret";

const normalizeOptionalValue = (value: string | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase();

  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
};

export const resolveRuntimeCheckoutPaymentProvider = (input: {
  paymentProvider?: string;
  nodeEnv?: string;
}): RuntimeCheckoutPaymentProvider => {
  const paymentProvider = normalizeOptionalValue(input.paymentProvider);

  if (paymentProvider === undefined) {
    return {
      enabled: false,
    };
  }

  if (paymentProvider !== "mock") {
    throw new AppError("PAYMENT_PROVIDER_CONFIG_INVALID", "Payment provider is not supported", 500, {
      paymentProvider,
    });
  }

  const nodeEnv = normalizeOptionalValue(input.nodeEnv);

  if (nodeEnv === "production") {
    throw new AppError("PAYMENT_PROVIDER_CONFIG_INVALID", "Mock payment provider is not allowed in production", 500, {
      paymentProvider: "mock",
      nodeEnv: "production",
    });
  }

  return {
    enabled: true,
    provider: "mock",
    providerName: "mock",
    secretToken: MOCK_PAYMENT_PROVIDER_SECRET,
  };
};

export const createPaymentProviderUnavailableError = (): AppError =>
  new AppError("PAYMENT_PROVIDER_UNAVAILABLE", "Checkout payment provider is not configured", 503, {
    orderCreated: false,
  });
