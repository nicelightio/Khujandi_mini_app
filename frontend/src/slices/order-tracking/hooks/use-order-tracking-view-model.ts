import { useEffect, useMemo, useRef, useState } from "react";
import type {
  OrderTrackingActionStatus,
  OrderTrackingApi,
} from "../api/order-tracking-api";
import { createOrderTrackingApi } from "../api/order-tracking-api";
import {
  applyOrderTrackingActionResult,
  applyOrderTrackingPollResult,
  createErrorOrderTrackingViewModel,
  createLoadingOrderTrackingViewModel,
  createOrderTrackingConsumerState,
  createReadyOrderTrackingViewModel,
  type OrderTrackingConsumerState,
  type OrderTrackingViewModel,
} from "../model/order-tracking-view-model";
import type { SupportedLanguage } from "../../../shared/i18n/languages";
import { getCopy } from "../../../shared/i18n/copy";
import { routes } from "../../../shared/lib/routes";
import { useOptionalUiShell } from "../../../shared/state/ui-shell-context";
import type { OrderTrackingSession } from "../api/order-tracking-api";

export type OrderTrackingRouteModel = {
  viewModel: OrderTrackingViewModel;
  submitCourierAction: (nextStatus: OrderTrackingActionStatus) => Promise<void>;
};

const pollingIntervalMs = 5000;

export const useOrderTrackingViewModel = (
  language: SupportedLanguage,
  api?: OrderTrackingApi,
  initialSession?: OrderTrackingSession | null,
): OrderTrackingRouteModel => {
  const shell = useOptionalUiShell();
  const trackingApi = useMemo(() => api ?? createOrderTrackingApi(), [api]);
  const [consumerState, setConsumerState] = useState<OrderTrackingConsumerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const consumerStateRef = useRef<OrderTrackingConsumerState | null>(null);
  const pollingInFlightRef = useRef(false);

  useEffect(() => {
    consumerStateRef.current = consumerState;
  }, [consumerState]);

  useEffect(() => {
    let active = true;

    if (initialSession === null) {
      setConsumerState(null);
      setIsLoading(false);
      setIsSubmitting(false);
      setErrorMessage(getCopy(language).orderTracking.missingOrderMessage);
      consumerStateRef.current = null;

      return () => {
        active = false;
      };
    }

    if (initialSession !== undefined) {
      const baseState = createOrderTrackingConsumerState(initialSession);
      consumerStateRef.current = baseState;
      setConsumerState(baseState);
      setIsLoading(false);
      setIsSubmitting(false);
      setErrorMessage(null);

      return () => {
        active = false;
      };
    }

    setConsumerState(null);
    setIsLoading(true);
    setIsSubmitting(false);
    setErrorMessage(null);
    consumerStateRef.current = null;

    void trackingApi.loadTrackingSession().then(
      (session) => {
        if (!active) {
          return;
        }

        const baseState = createOrderTrackingConsumerState(session);
        consumerStateRef.current = baseState;
        setConsumerState(baseState);
        setIsLoading(false);
      },
      (error: unknown) => {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : undefined;
        setErrorMessage(message ?? createErrorOrderTrackingViewModel(undefined, language).errorMessage);
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
    };
  }, [initialSession, language, trackingApi]);

  const isPollingActive = shell?.state.lifecycle !== "inactive";

  useEffect(() => {
    if (!isPollingActive || consumerState?.orderId === undefined) {
      return;
    }

    let active = true;

    const pollOnce = async () => {
      const currentState = consumerStateRef.current;

      if (currentState === null || pollingInFlightRef.current) {
        return;
      }

      pollingInFlightRef.current = true;

      try {
        const result = await trackingApi.pollEvents(currentState.cursor);

        if (!active) {
          return;
        }

        setConsumerState((previousState) => {
          if (previousState === null) {
            return previousState;
          }

          const nextState = applyOrderTrackingPollResult(previousState, result);
          consumerStateRef.current = nextState;
          return nextState;
        });
        setErrorMessage(null);
      } catch (error: unknown) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : undefined;
        setErrorMessage(message ?? createErrorOrderTrackingViewModel(undefined, language).errorMessage);
      } finally {
        pollingInFlightRef.current = false;
      }
    };

    void pollOnce();

    const intervalId = globalThis.setInterval(() => {
      void pollOnce();
    }, pollingIntervalMs);

    return () => {
      active = false;
      pollingInFlightRef.current = false;
      globalThis.clearInterval(intervalId);
    };
  }, [consumerState?.orderId, isPollingActive, language, trackingApi]);

  const submitCourierAction = async (nextStatus: OrderTrackingActionStatus) => {
    const currentState = consumerStateRef.current;

    if (currentState === null || currentState.isReadOnly || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await trackingApi.submitCourierAction({
        orderId: currentState.orderId,
        nextStatus,
      });

      setConsumerState((previousState) => {
        if (previousState === null) {
          return previousState;
        }

        const nextState = applyOrderTrackingActionResult(previousState, result);
        consumerStateRef.current = nextState;
        return nextState;
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : undefined;
      setErrorMessage(message ?? createErrorOrderTrackingViewModel(undefined, language).errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewModel: OrderTrackingViewModel = useMemo(() => {
    if (isLoading) {
      return createLoadingOrderTrackingViewModel(language);
    }

    if (consumerState === null) {
      return createErrorOrderTrackingViewModel(errorMessage ?? undefined, language, routes.catalog);
    }

    return createReadyOrderTrackingViewModel({
      state: consumerState,
      language,
      isSubmitting,
      errorMessage,
    });
  }, [consumerState, errorMessage, isLoading, isSubmitting, language]);

  return {
    viewModel,
    submitCourierAction,
  };
};
