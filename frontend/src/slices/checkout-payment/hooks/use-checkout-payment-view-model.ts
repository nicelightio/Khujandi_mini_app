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
  createRecoveryCheckoutPaymentViewModel,
  createReadyCheckoutPaymentViewModel,
  createSubmittingCheckoutPaymentViewModel,
  createSuccessCheckoutPaymentViewModel,
  type CheckoutPaymentViewModel,
} from "../model/checkout-payment-view-model";
import { getCopy } from "../../../shared/i18n/copy";
import {
  clearCheckoutCompositionHandoff,
  readCheckoutCompositionHandoff,
  type CheckoutCompositionHandoff,
} from "../model/composition-handoff";
import { routes } from "../../../shared/lib/routes";

export type CheckoutPaymentRouteModel = {
  viewModel: CheckoutPaymentViewModel;
  submitCheckout: () => Promise<void>;
};

const createFallbackBootstrap = (language: SupportedLanguage = "ru"): CheckoutPaymentBootstrap => ({
  headline: getCopy(language).checkout.headline,
  statusLabel: getCopy(language).checkout.readyStatus,
  supportingNotes: [getCopy(language).checkout.noteAuth, getCopy(language).checkout.noteTrustedPayment],
  primaryActionLabel: getCopy(language).checkout.primaryAction,
  mockPaymentAvailable: false,
});

export const useCheckoutPaymentViewModel = (
  api?: CheckoutPaymentApi,
  bridge?: TelegramWebAppBridge,
  language?: SupportedLanguage,
  compositionHandoff?: CheckoutCompositionHandoff | null,
): CheckoutPaymentRouteModel => {
  const [viewModel, setViewModel] = useState(createLoadingCheckoutPaymentViewModel(language));
  const [bootstrap, setBootstrap] = useState<CheckoutPaymentBootstrap | null>(null);
  const [composition, setComposition] = useState<CheckoutCompositionHandoff | null>(null);

  useEffect(() => {
    let active = true;
    const checkoutApi = api ?? createCheckoutPaymentApi();
    const fallbackBootstrap = createFallbackBootstrap(language);
    const handoff =
      compositionHandoff === undefined
        ? readCheckoutCompositionHandoff(typeof window === "undefined" ? null : window.sessionStorage)
        : compositionHandoff;

    setViewModel(createLoadingCheckoutPaymentViewModel(language));
    setComposition(handoff);

    void checkoutApi.loadCheckoutBootstrap(language).then(
      (loadedBootstrap) => {
        if (active) {
          setBootstrap(loadedBootstrap);
          setViewModel(
            handoff === null
              ? createRecoveryCheckoutPaymentViewModel(loadedBootstrap, language)
              : createReadyCheckoutPaymentViewModel(loadedBootstrap, handoff, language),
          );
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
  }, [api, bridge, language, compositionHandoff]);

  const submitCheckout = async (): Promise<void> => {
    if (composition === null) {
      if (typeof window !== "undefined") {
        window.location.assign(routes.catalog);
      }
      return;
    }

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

      const checkoutResult = await checkoutApi.submitCheckout(composition);
      setViewModel(
        createSuccessCheckoutPaymentViewModel(currentBootstrap, checkoutResult, language),
      );
    } catch (error: unknown) {
      if (error instanceof CheckoutPaymentApiError && error.repairAction === "repair_composition") {
        clearCheckoutCompositionHandoff(typeof window === "undefined" ? null : window.sessionStorage);
        setComposition(null);
        setViewModel(createRecoveryCheckoutPaymentViewModel(currentBootstrap, language));
        return;
      }

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
