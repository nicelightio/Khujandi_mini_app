import { useLanguageContext } from "../../../app/language-context";
import type { OrderTrackingApi } from "../api/order-tracking-api";
import { OrderTrackingPage } from "../components/order-tracking-page";
import { useOrderTrackingViewModel } from "../hooks/use-order-tracking-view-model";

type OrderTrackingRouteProps = {
  api?: OrderTrackingApi;
};

export const OrderTrackingRoute = ({ api }: OrderTrackingRouteProps) => {
  const { state } = useLanguageContext();
  const { viewModel, submitCourierAction } = useOrderTrackingViewModel(state.language, api);

  return (
    <OrderTrackingPage
      viewModel={viewModel}
      onSubmitCourierAction={(nextStatus) => {
        void submitCourierAction(nextStatus);
      }}
    />
  );
};
