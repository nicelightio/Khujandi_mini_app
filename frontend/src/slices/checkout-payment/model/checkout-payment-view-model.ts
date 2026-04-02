import { getCopy } from "../../../shared/i18n/copy";
import { defaultLanguage, type SupportedLanguage } from "../../../shared/i18n/languages";
import type { CheckoutPaymentBootstrap } from "../api/checkout-payment-api";

export type CheckoutPaymentViewModel = {
  headline: string;
  statusLabel: string;
  supportingNotes: string[];
  primaryActionLabel: string;
  isLoading: boolean;
  isSubmitting: boolean;
  isActionDisabled: boolean;
  errorMessage: string | null;
  retryMessage: string | null;
  successMessage: string | null;
};

export const createLoadingCheckoutPaymentViewModel = (
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: getCopy(language).checkout.headline,
  statusLabel: getCopy(language).checkout.loadingStatus,
  supportingNotes: [],
  primaryActionLabel: getCopy(language).checkout.primaryAction,
  isLoading: true,
  isSubmitting: false,
  isActionDisabled: true,
  errorMessage: null,
  retryMessage: null,
  successMessage: null,
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
  primaryActionLabel:
    retryMessage === null ? bootstrap.primaryActionLabel : getCopy(language).checkout.retryAction,
  isLoading: false,
  isSubmitting: false,
  isActionDisabled: false,
  errorMessage: message,
  retryMessage,
  successMessage: null,
});

export const createReadyCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: bootstrap.statusLabel,
  supportingNotes: bootstrap.supportingNotes,
  primaryActionLabel: bootstrap.primaryActionLabel,
  isLoading: false,
  isSubmitting: false,
  isActionDisabled: false,
  errorMessage: null,
  retryMessage: null,
  successMessage: null,
});

export const createSubmittingCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: getCopy(language).checkout.submittingStatus,
  supportingNotes: bootstrap.supportingNotes,
  primaryActionLabel: getCopy(language).checkout.submittingAction,
  isLoading: false,
  isSubmitting: true,
  isActionDisabled: true,
  errorMessage: null,
  retryMessage: null,
  successMessage: null,
});

export const createSuccessCheckoutPaymentViewModel = (
  bootstrap: CheckoutPaymentBootstrap,
  confirmationLabel: string,
  language: SupportedLanguage = defaultLanguage,
): CheckoutPaymentViewModel => ({
  headline: bootstrap.headline,
  statusLabel: getCopy(language).checkout.successStatus,
  supportingNotes: bootstrap.supportingNotes,
  primaryActionLabel: getCopy(language).checkout.successAction,
  isLoading: false,
  isSubmitting: false,
  isActionDisabled: true,
  errorMessage: null,
  retryMessage: null,
  successMessage: confirmationLabel,
});
