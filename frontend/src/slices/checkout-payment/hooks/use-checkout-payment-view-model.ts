import { useEffect, useState } from "react";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import {
  CheckoutPaymentApiError,
  createCheckoutPaymentApi,
  type CheckoutPaymentApi,
  type CheckoutPaymentBootstrap,
} from "../api/checkout-payment-api";
import {
  createTelegramWebAppBridge,
  type TelegramWebAppBridge,
} from "../../../shared/telegram/webapp";
import {
  createErrorCheckoutPaymentViewModel,
  createLoadingCheckoutPaymentViewModel,
  createReadyCheckoutPaymentViewModel,
  createSubmittingCheckoutPaymentViewModel,
  createSuccessCheckoutPaymentViewModel,
  type CheckoutPaymentViewModel,
} from "../model/checkout-payment-view-model";
import { getCopy } from "../../../shared/i18n/copy";

export type CheckoutPaymentRouteModel = {
  viewModel: CheckoutPaymentViewModel;
  submitCheckout: () => Promise<void>;
};

const createFallbackBootstrap = (language: SupportedLanguage = "ru"): CheckoutPaymentBootstrap => ({
  headline: getCopy(language).checkout.headline,
  statusLabel: getCopy(language).checkout.readyStatus,
  supportingNotes: [getCopy(language).checkout.noteAuth, getCopy(language).checkout.noteTrustedPayment],
  primaryActionLabel: getCopy(language).checkout.primaryAction,
});

export const useCheckoutPaymentViewModel = (
  api?: CheckoutPaymentApi,
  bridge?: TelegramWebAppBridge,
  language?: SupportedLanguage,
): CheckoutPaymentRouteModel => {
  const [viewModel, setViewModel] = useState(createLoadingCheckoutPaymentViewModel(language));
  const [bootstrap, setBootstrap] = useState<CheckoutPaymentBootstrap | null>(null);

  useEffect(() => {
    let active = true;
    const checkoutApi = api ?? createCheckoutPaymentApi();
    const fallbackBootstrap = createFallbackBootstrap(language);

    setViewModel(createLoadingCheckoutPaymentViewModel(language));

    void checkoutApi.loadCheckoutBootstrap(language).then(
      (loadedBootstrap) => {
        if (active) {
          setBootstrap(loadedBootstrap);
          setViewModel(createReadyCheckoutPaymentViewModel(loadedBootstrap));
        }
      },
      (error: unknown) => {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : undefined;
        setViewModel(createErrorCheckoutPaymentViewModel(fallbackBootstrap, message, null, language));
      },
    );

    return () => {
      active = false;
    };
  }, [api, bridge, language]);

  const submitCheckout = async (): Promise<void> => {
    const checkoutApi = api ?? createCheckoutPaymentApi();
    const telegramBridge = bridge ?? createTelegramWebAppBridge();
    const currentBootstrap = bootstrap ?? createFallbackBootstrap(language);
    const initData = telegramBridge.getInitData()?.trim() ?? "";

    if (initData.length === 0) {
      setViewModel(
        createErrorCheckoutPaymentViewModel(
          currentBootstrap,
          getCopy(language).checkout.openInTelegramMessage,
          null,
          language,
        ),
      );
      return;
    }

    setViewModel(createSubmittingCheckoutPaymentViewModel(currentBootstrap, language));

    try {
      const authResult = await checkoutApi.authenticateTelegram(initData);

      if (language !== undefined) {
        await checkoutApi.syncLanguagePreference({
          telegramId: authResult.telegramId,
          language,
        });
      }

      const checkoutResult = await checkoutApi.submitCheckout();
      setViewModel(
        createSuccessCheckoutPaymentViewModel(currentBootstrap, checkoutResult.confirmationLabel, language),
      );
    } catch (error: unknown) {
      const retryMessage =
        error instanceof CheckoutPaymentApiError && error.retryable
          ? getCopy(language).checkout.retryMessage
          : null;
      const message =
        error instanceof Error ? error.message : getCopy(language).checkout.unavailableMessage;

      setViewModel(createErrorCheckoutPaymentViewModel(currentBootstrap, message, retryMessage, language));
    }
  };

  return {
    viewModel,
    submitCheckout,
  };
};
