import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminAssignmentPage } from "../components/admin-assignment-page";
import {
  AdminAssignmentApiError,
  createAdminAssignmentApi,
  type AdminAssignmentApi,
  type AdminOperatorDeliveryOrderStatus,
  type AdminOperatorDeliveryOrdersResult,
} from "../api/admin-assignment-api";
import {
  createErrorAdminAssignmentViewModel,
  createLoadingAdminAssignmentViewModel,
  createReadyAdminAssignmentViewModel,
  defaultAdminAssignmentSortKey,
  idleAdminAssignmentOfferMutationState,
  idleAdminAssignmentStatusMutationState,
  type AdminAssignmentOfferMutationState,
  type AdminAssignmentSortKey,
  type AdminAssignmentStatusMutationState,
} from "../model/admin-assignment-view-model";

type AdminAssignmentRouteProps = {
  api?: AdminAssignmentApi;
  loadOperatorDeliveryOrders?: () => Promise<AdminOperatorDeliveryOrdersResult>;
  requestTargetCourierId?: (orderId: string) => string | null;
  confirmStatusChange?: (orderId: string, nextStatus: AdminOperatorDeliveryOrderStatus) => boolean;
};

export const AdminAssignmentRoute = ({
  api,
  loadOperatorDeliveryOrders,
  requestTargetCourierId,
  confirmStatusChange,
}: AdminAssignmentRouteProps) => {
  const assignmentApi = useRef(api ?? createAdminAssignmentApi());
  const inFlightOfferOrderIds = useRef<Set<string>>(new Set<string>());
  const [ordersResult, setOrdersResult] = useState<AdminOperatorDeliveryOrdersResult | null>(null);
  const [expandedOrderIds, setExpandedOrderIds] = useState<ReadonlySet<string>>(new Set<string>());
  const [sortKey, setSortKey] = useState<AdminAssignmentSortKey>(defaultAdminAssignmentSortKey);
  const [offerMutation, setOfferMutation] = useState<AdminAssignmentOfferMutationState>(
    idleAdminAssignmentOfferMutationState,
  );
  const [statusMutation, setStatusMutation] = useState<AdminAssignmentStatusMutationState>(
    idleAdminAssignmentStatusMutationState,
  );
  const [viewModel, setViewModel] = useState(createLoadingAdminAssignmentViewModel);
  const loadOrders = useCallback(
    () => (loadOperatorDeliveryOrders ?? (() => assignmentApi.current.listOperatorDeliveryOrders()))(),
    [loadOperatorDeliveryOrders],
  );

  useEffect(() => {
    let isActive = true;

    setViewModel(createLoadingAdminAssignmentViewModel());

    void loadOrders()
      .then((nextOrdersResult) => {
        if (!isActive) {
          return;
        }

        setOrdersResult(nextOrdersResult);
        setExpandedOrderIds(new Set<string>());
        setOfferMutation(idleAdminAssignmentOfferMutationState);
        setStatusMutation(idleAdminAssignmentStatusMutationState);
        setViewModel(createReadyAdminAssignmentViewModel(nextOrdersResult));
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        const message =
          error instanceof AdminAssignmentApiError || error instanceof Error
            ? error.message
            : "Операторские заказы доставки временно недоступны.";
        setOrdersResult(null);
        setExpandedOrderIds(new Set<string>());
        setOfferMutation(idleAdminAssignmentOfferMutationState);
        setStatusMutation(idleAdminAssignmentStatusMutationState);
        setViewModel(createErrorAdminAssignmentViewModel(message));
      });

    return () => {
      isActive = false;
    };
  }, [loadOrders]);

  const stableExpandedOrderIds = useMemo(() => expandedOrderIds, [expandedOrderIds]);

  const handleSortChange = (nextSortKey: AdminAssignmentSortKey) => {
    setSortKey(nextSortKey);
  };

  const handleToggleHistory = (orderId: string) => {
    if (ordersResult === null) {
      return;
    }

    setExpandedOrderIds((current) => {
      const next = new Set(current);

      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }

      setViewModel(createReadyAdminAssignmentViewModel(ordersResult, next, sortKey, offerMutation, statusMutation));
      return next;
    });
  };

  const resolveTargetCourierId = (orderId: string): string | null => {
    if (requestTargetCourierId !== undefined) {
      return requestTargetCourierId(orderId);
    }

    if (typeof window === "undefined" || typeof window.prompt !== "function") {
      return null;
    }

    const value = window.prompt("ID курьера для ожидающего персонального предложения");
    const trimmed = value?.trim() ?? "";
    return trimmed.length === 0 ? null : trimmed;
  };

  const handleCreateTargetedOffer = (orderId: string) => {
    if (ordersResult === null || inFlightOfferOrderIds.current.has(orderId)) {
      return;
    }

    const courierId = resolveTargetCourierId(orderId);

    if (courierId === null) {
      const nextMutation: AdminAssignmentOfferMutationState = {
        orderId,
        kind: "targeted",
        status: "failed",
        message: "Для персонального предложения нужен ID курьера.",
      };
      setOfferMutation(nextMutation);
      setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, nextMutation, statusMutation));
      return;
    }

    const submittingMutation: AdminAssignmentOfferMutationState = {
      orderId,
      kind: "targeted",
      status: "submitting",
      message: null,
    };
    inFlightOfferOrderIds.current.add(orderId);
    setOfferMutation(submittingMutation);
    setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, submittingMutation, statusMutation));

    void assignmentApi.current
      .createManualTargetedOffer({
        orderId,
        courierId,
      })
      .then((result) => {
        const nextMutation: AdminAssignmentOfferMutationState = {
          orderId,
          kind: "targeted",
          status: "succeeded",
          message: `Ожидающее предложение ${result.offerId} создано для ${result.targetCourierId}.`,
        };
        setOfferMutation(nextMutation);
        setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, nextMutation, statusMutation));
      })
      .catch((error) => {
        const message =
          error instanceof AdminAssignmentApiError || error instanceof Error
            ? error.message
            : "Ручное персональное предложение не удалось создать.";
        const nextMutation: AdminAssignmentOfferMutationState = {
          orderId,
          kind: "targeted",
          status: "failed",
          message,
        };
        setOfferMutation(nextMutation);
        setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, nextMutation, statusMutation));
      })
      .finally(() => {
        inFlightOfferOrderIds.current.delete(orderId);
      });
  };

  const handleCreateBroadcastOffer = (orderId: string) => {
    if (ordersResult === null || inFlightOfferOrderIds.current.has(orderId)) {
      return;
    }

    const submittingMutation: AdminAssignmentOfferMutationState = {
      orderId,
      kind: "broadcast",
      status: "submitting",
      message: null,
    };
    inFlightOfferOrderIds.current.add(orderId);
    setOfferMutation(submittingMutation);
    setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, submittingMutation, statusMutation));

    void assignmentApi.current
      .createBroadcastOffer({
        orderId,
      })
      .then((result) => {
        const nextMutation: AdminAssignmentOfferMutationState = {
          orderId,
          kind: "broadcast",
          status: "succeeded",
          message: `Ожидающие массовые предложения созданы для курьеров: ${result.eligibleCourierCount}.`,
        };
        setOfferMutation(nextMutation);
        setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, nextMutation, statusMutation));
      })
      .catch((error) => {
        const message =
          error instanceof AdminAssignmentApiError || error instanceof Error
            ? error.message
            : "Массовое auto-offer действие не удалось создать.";
        const nextMutation: AdminAssignmentOfferMutationState = {
          orderId,
          kind: "broadcast",
          status: "failed",
          message,
        };
        setOfferMutation(nextMutation);
        setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, nextMutation, statusMutation));
      })
      .finally(() => {
        inFlightOfferOrderIds.current.delete(orderId);
      });
  };

  const shouldConfirmStatusChange = (
    orderId: string,
    nextStatus: AdminOperatorDeliveryOrderStatus,
  ): boolean => {
    if (confirmStatusChange !== undefined) {
      return confirmStatusChange(orderId, nextStatus);
    }

    if (typeof window === "undefined" || typeof window.confirm !== "function") {
      return false;
    }

    return window.confirm(`Записать ${nextStatus} в историю статусов для ${orderId}?`);
  };

  const handleConfirmStatusChange = (
    orderId: string,
    nextStatus: AdminOperatorDeliveryOrderStatus,
  ) => {
    if (ordersResult === null || !shouldConfirmStatusChange(orderId, nextStatus)) {
      return;
    }

    const submittingMutation: AdminAssignmentStatusMutationState = {
      orderId,
      nextStatus,
      status: "submitting",
      message: null,
    };
    setStatusMutation(submittingMutation);
    setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, offerMutation, submittingMutation));

    void assignmentApi.current
      .updateOperatorOrderStatus({
        orderId,
        nextStatus,
      })
      .then(async (result) => {
        const refreshedOrdersResult = await loadOrders();
        const nextMutation: AdminAssignmentStatusMutationState = {
          orderId,
          nextStatus,
          status: "succeeded",
          message: `${result.status} записан в историю на revision ${result.revision}.`,
        };
        setOrdersResult(refreshedOrdersResult);
        setStatusMutation(nextMutation);
        setViewModel(createReadyAdminAssignmentViewModel(refreshedOrdersResult, expandedOrderIds, sortKey, offerMutation, nextMutation));
      })
      .catch((error) => {
        const message =
          error instanceof AdminAssignmentApiError || error instanceof Error
            ? error.message
            : "Операторский переход статуса не удалось записать.";
        const nextMutation: AdminAssignmentStatusMutationState = {
          orderId,
          nextStatus,
          status: "failed",
          message,
        };
        setStatusMutation(nextMutation);
        setViewModel(createReadyAdminAssignmentViewModel(ordersResult, expandedOrderIds, sortKey, offerMutation, nextMutation));
      });
  };

  useEffect(() => {
    if (ordersResult === null) {
      return;
    }

    setViewModel(createReadyAdminAssignmentViewModel(ordersResult, stableExpandedOrderIds, sortKey, offerMutation, statusMutation));
  }, [ordersResult, stableExpandedOrderIds, sortKey, offerMutation, statusMutation]);

  return (
    <AdminAssignmentPage
      viewModel={viewModel}
      onSortChange={handleSortChange}
      onToggleHistory={handleToggleHistory}
      onCreateTargetedOffer={handleCreateTargetedOffer}
      onCreateBroadcastOffer={handleCreateBroadcastOffer}
      onConfirmStatusChange={handleConfirmStatusChange}
    />
  );
};
