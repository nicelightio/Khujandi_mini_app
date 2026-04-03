import { useEffect, useState } from "react";
import type {
  OrderTrackingActionStatus,
  OrderTrackingApi,
  SubmitOrderTrackingActionResult,
} from "../api/order-tracking-api";
import { createOrderTrackingApi } from "../api/order-tracking-api";
import {
  applyOrderTrackingPollResult,
  createErrorOrderTrackingViewModel,
  createLoadingOrderTrackingViewModel,
  createOrderTrackingConsumerState,
  createReadyOrderTrackingViewModel,
  type OrderTrackingConsumerState,
  type OrderTrackingViewModel,
} from "../model/order-tracking-view-model";
import type { SupportedLanguage } from "../../../shared/i18n/languages";

export type OrderTrackingRouteModel = {
  viewModel: OrderTrackingViewModel;
  submitCourierAction: (nextStatus: OrderTrackingActionStatus) => Promise<void>;
};

const applyActionResult = (
  currentState: OrderTrackingConsumerState,
  result: SubmitOrderTrackingActionResult,
): OrderTrackingConsumerState => ({
  ...currentState,
  currentStatus: result.status,
  lastAppliedRevision: result.revision,
  availableActions: result.availableActions,
});

export const useOrderTrackingViewModel = (
  language: SupportedLanguage,
  api?: OrderTrackingApi,
): OrderTrackingRouteModel => {
  const [consumerState, setConsumerState] = useState<OrderTrackingConsumerState | null>(null);
  const [viewModel, setViewModel] = useState<OrderTrackingViewModel>(() => createLoadingOrderTrackingViewModel(language));

  useEffect(() => {
    let active = true;
    const trackingApi = api ?? createOrderTrackingApi();

    setConsumerState(null);
    setViewModel(createLoadingOrderTrackingViewModel(language));

    void trackingApi.loadTrackingSession().then(
      async (session) => {
        if (!active) {
          return;
        }

        const baseState = createOrderTrackingConsumerState(session);
        setConsumerState(baseState);
        setViewModel(createReadyOrderTrackingViewModel({ state: baseState, language }));

        const pollResult = await trackingApi.pollEvents(baseState.cursor);

        if (!active) {
          return;
        }

        const nextState = applyOrderTrackingPollResult(baseState, pollResult);
        setConsumerState(nextState);
        setViewModel(createReadyOrderTrackingViewModel({ state: nextState, language }));
      },
      (error: unknown) => {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : undefined;
        setViewModel(createErrorOrderTrackingViewModel(message, language));
      },
    );

    return () => {
      active = false;
    };
  }, [api, language]);

  const submitCourierAction = async (nextStatus: OrderTrackingActionStatus) => {
    const trackingApi = api ?? createOrderTrackingApi();

    if (consumerState === null) {
      return;
    }

    setViewModel(createReadyOrderTrackingViewModel({ state: consumerState, language, isSubmitting: true }));

    try {
      const result = await trackingApi.submitCourierAction({
        orderId: consumerState.orderId,
        nextStatus,
      });
      const nextState = applyActionResult(consumerState, result);
      setConsumerState(nextState);
      setViewModel(createReadyOrderTrackingViewModel({ state: nextState, language }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      setViewModel(createReadyOrderTrackingViewModel({
        state: consumerState,
        language,
        errorMessage: message ?? createErrorOrderTrackingViewModel(undefined, language).errorMessage,
      }));
    }
  };

  return {
    viewModel,
    submitCourierAction,
  };
};
