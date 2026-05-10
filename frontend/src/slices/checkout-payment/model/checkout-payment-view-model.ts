import { getCopy } from "../../../shared/i18n/copy";
import { defaultLanguage, type SupportedLanguage } from "../../../shared/i18n/languages";
import { buildOrderTrackingPath } from "../../../shared/lib/routes";
import type { CheckoutPaymentBootstrap, CheckoutPaymentOrderResult } from "../api/checkout-payment-api";
import type { CheckoutCompositionHandoff } from "./composition-handoff";

export type CheckoutPaymentCompositionSummary = {
  shopPublicPath: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPriceLabel: string;
  }>;
  previewTotalLabel: string;
};

export type CheckoutPaymentViewModel = {
  headline: string;
  statusLabel: string;
  supportingNotes: string[];
  mockPaymentAffordance: {
    label: string;
    body: string;
  } | null;
  primaryActionLabel: string;
  isLoading: boolean;
  isSubmitting: boolean;
  isActionDisabled: boolean;
  errorMessage: string | null;
  retryMessage: string | null;
  successMessage: string | null;
  recoveryMessage: string | null;
  compositionSummary: CheckoutPaymentCompositionSummary | null;
  statusEntry: {
    href: string;
    label: string;
    metadataLabel: string;
  } | null;
};

const formatTjsMinor = (amountMinor: number): string => `${(amountMinor / 100).toFixed(2)} TJS`;

export const createCheckoutPaymentCompositionSummary = (
  composition: CheckoutCompositionHandoff,
): CheckoutPaymentCompositionSummary => ({
  shopPublicPath: composition.shop_public_path,
  items: composition.items.map((item) => ({
    productId: item.product_id,
    productName: item.display_snapshot.product_name,
    quantity: item.quantity,
    unitPriceLabel: formatTjsMinor(item.display_snapshot.unit_price_minor),
  })),
  previewTotalLabel: formatTjsMinor(composition.preview_total.amount_minor),
});

export const createLoadingCheckoutPaymentViewModel = (
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: getCopy(language).checkout.headline,
  statusLabel: getCopy(language).checkout.loadingStatus,
  supportingNotes: [],
  mockPaymentAffordance: null,
  primaryActionLabel: getCopy(language).checkout.primaryAction,
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

export const createRecoveryCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: getCopy(language).checkout.missingCompositionStatus,
  supportingNotes: bootstrap.supportingNotes,
  mockPaymentAffordance: null,
  primaryActionLabel: getCopy(language).checkout.missingCompositionAction,
  isLoading: false,
  isSubmitting: false,
  isActionDisabled: false,
  errorMessage: null,
  retryMessage: null,
  successMessage: null,
  recoveryMessage: getCopy(language).checkout.missingCompositionMessage,
  compositionSummary: null,
  statusEntry: null,
});

export const createErrorCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
  message = getCopy(defaultLanguage).checkout.unavailableMessage,
  retryMessage: string | null = null,
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: getCopy(language).checkout.unavailableStatus,
  supportingNotes: bootstrap.supportingNotes,
  mockPaymentAffordance: null,
  primaryActionLabel:
    retryMessage === null ? bootstrap.primaryActionLabel : getCopy(language).checkout.retryAction,
  isLoading: false,
  isSubmitting: false,
  isActionDisabled: false,
  errorMessage: message,
  retryMessage,
  successMessage: null,
  recoveryMessage: null,
  compositionSummary: null,
  statusEntry: null,
});

export const createReadyCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
  composition: CheckoutCompositionHandoff,
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: bootstrap.statusLabel,
  supportingNotes: bootstrap.supportingNotes,
  mockPaymentAffordance: bootstrap.mockPaymentAvailable
    ? {
        label: getCopy(language).checkout.mockPaymentAffordanceLabel,
        body: getCopy(language).checkout.mockPaymentAffordanceBody,
      }
    : null,
  primaryActionLabel: bootstrap.primaryActionLabel,
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

export const createSubmittingCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: getCopy(language).checkout.submittingStatus,
  supportingNotes: bootstrap.supportingNotes,
  mockPaymentAffordance: null,
  primaryActionLabel: getCopy(language).checkout.submittingAction,
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

export const createSuccessCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
  result: CheckoutPaymentOrderResult,
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: getCopy(language).checkout.successStatus,
  supportingNotes: bootstrap.supportingNotes,
  mockPaymentAffordance: null,
  primaryActionLabel: getCopy(language).checkout.successAction,
  isLoading: false,
  isSubmitting: false,
  isActionDisabled: true,
  errorMessage: null,
  retryMessage: null,
  successMessage: result.confirmationLabel,
  recoveryMessage: null,
  compositionSummary: null,
  statusEntry: {
    href: buildOrderTrackingPath(result.orderId, result.revision),
    label: getCopy(language).checkout.statusEntryLabel,
    metadataLabel: getCopy(language).checkout.statusEntryMetadata(result.orderId, result.revision),
  },
});
