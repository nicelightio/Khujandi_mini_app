import type { CheckoutPaymentApi } from "../api/checkout-payment-api";
import { CheckoutPaymentPage } from "../components/checkout-payment-page";
import { useCheckoutPaymentViewModel } from "../hooks/use-checkout-payment-view-model";
import { useLanguageContext } from "../../../app/language-context";
import { useOptionalUiShell } from "../../../shared/state/ui-shell-context";
import type { TelegramWebAppBridge } from "../../../shared/telegram/webapp";

type CheckoutPaymentRouteProps = {
  api?: CheckoutPaymentApi;
  bridge?: TelegramWebAppBridge;
};

export const CheckoutPaymentRoute = ({ api, bridge }: CheckoutPaymentRouteProps) => {
  const { state } = useLanguageContext();
  const shell = useOptionalUiShell();
  const { viewModel, submitCheckout } = useCheckoutPaymentViewModel(
    api,
    bridge ?? shell?.telegramBridge,
    state.language,
  );

  return <CheckoutPaymentPage viewModel={viewModel} onPrimaryAction={() => void submitCheckout()} />;
};
