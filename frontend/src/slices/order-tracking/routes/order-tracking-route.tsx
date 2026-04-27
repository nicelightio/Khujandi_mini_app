import { useMemo } from "react";
import { useLanguageContext } from "../../../app/language-context";
import type { OrderTrackingApi, OrderTrackingSession } from "../api/order-tracking-api";
import { OrderTrackingPage } from "../components/order-tracking-page";
import { useOrderTrackingViewModel } from "../hooks/use-order-tracking-view-model";

type OrderTrackingRouteProps = {
  api?: OrderTrackingApi;
  initialSession?: OrderTrackingSession | null;
};

const readCustomerInitialSession = (): OrderTrackingSession | null | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("orderId")?.trim() ?? "";

  if (orderId.length === 0) {
    return null;
  }

  return {
    orderId,
    currentStatus: "CREATED",
    initialCursor: params.get("cursor")?.trim() || "0",
    availableActions: [],
    isReadOnly: true,
  };
};

export const OrderTrackingRoute = ({ api, initialSession }: OrderTrackingRouteProps) => {
  const { state } = useLanguageContext();
  const resolvedInitialSession = useMemo(
    () => (initialSession === undefined && api === undefined ? readCustomerInitialSession() : initialSession),
    [api, initialSession],
  );
  const { viewModel, submitCourierAction } = useOrderTrackingViewModel(state.language, api, resolvedInitialSession);

  return (
    <OrderTrackingPage
      viewModel={viewModel}
      onSubmitCourierAction={(nextStatus) => {
        void submitCourierAction(nextStatus);
      }}
    />
  );
};
