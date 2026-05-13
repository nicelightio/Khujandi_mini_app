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
  appEnv?: string;
  e2eTestMode?: boolean;
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
  const appEnv = normalizeOptionalValue(input.appEnv);

  if (nodeEnv === "production") {
    throw new AppError("PAYMENT_PROVIDER_CONFIG_INVALID", "Mock payment provider is not allowed in production", 500, {
      paymentProvider: "mock",
      nodeEnv: "production",
    });
  }

  const isExplicitRuntimeGuard = appEnv === "local" || appEnv === "test" || appEnv === "staging" || input.e2eTestMode === true;

  if (!isExplicitRuntimeGuard) {
    throw new AppError(
      "PAYMENT_PROVIDER_CONFIG_INVALID",
      "Mock payment provider requires APP_ENV=local|test|staging or E2E_TEST_MODE=TRUE",
      500,
      {
        paymentProvider: "mock",
        nodeEnv: nodeEnv ?? null,
        appEnv: appEnv ?? null,
        e2eTestMode: input.e2eTestMode === true,
      },
    );
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
