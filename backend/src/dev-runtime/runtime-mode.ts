import { AppError } from "../shared/errors/app-error";

export type RuntimeMode = {
  appEnv: string;
  nodeEnv: string;
  debug: boolean;
  e2eTestMode: boolean;
  paymentProvider: "mock" | "none";
  version: string;
};

const normalizeModeValue = (value: string | undefined): string | undefined => {
  const normalized = value?.trim().toLowerCase();

  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
};

export const parseRuntimeBooleanFlag = (value: string | undefined): boolean =>
  String(value ?? "FALSE").trim().toLowerCase() === "true";

export const resolveRuntimeMode = (input: {
  appEnv?: string;
  nodeEnv?: string;
  debug?: boolean;
  e2eTestMode?: boolean;
  paymentProvider?: string;
}): RuntimeMode => {
  const nodeEnv = normalizeModeValue(input.nodeEnv) ?? "development";
  const appEnv = normalizeModeValue(input.appEnv) ?? (nodeEnv === "production" ? "production" : nodeEnv === "test" ? "test" : "local");
  const requestedPaymentProvider = normalizeModeValue(input.paymentProvider);
  const e2eTestMode = input.e2eTestMode === true;

  if (nodeEnv === "production" && e2eTestMode) {
    throw new AppError("RUNTIME_MODE_CONFIG_INVALID", "E2E_TEST_MODE is not allowed in production", 500, {
      nodeEnv,
      e2eTestMode,
    });
  }

  return {
    appEnv,
    nodeEnv,
    debug: nodeEnv === "production" ? false : input.debug === true,
    e2eTestMode,
    paymentProvider: requestedPaymentProvider === "mock" ? "mock" : "none",
    version: "dev",
  };
};
