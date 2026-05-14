import { useEffect, useRef, useState } from "react";
import { AdminOrderCancellationPage } from "../components/admin-order-cancellation-page";
import {
  AdminOrderCancellationApiError,
  createAdminOrderCancellationApi,
  type AdminOrderCancellationApi,
} from "../api/admin-order-cancellation-api";
import {
  createErrorAdminOrderCancellationViewModel,
  createLoadingAdminOrderCancellationViewModel,
  createReadyAdminOrderCancellationViewModel,
  createRefundErrorAdminOrderCancellationViewModel,
  createRefundNoteAdminOrderCancellationViewModel,
  createRefundSuccessAdminOrderCancellationViewModel,
  createSelectedRefundOutcomeAdminOrderCancellationViewModel,
  createSelectedReasonAdminOrderCancellationViewModel,
  createSubmittingRefundAdminOrderCancellationViewModel,
  createSubmittingAdminOrderCancellationViewModel,
  createSuccessAdminOrderCancellationViewModel,
  type AdminRefundOutcome,
  type AdminRefundStatus,
  type AdminOrderCancellationBootstrap,
} from "../model/admin-order-cancellation-view-model";

type AdminOrderCancellationSubmitInput = {
  orderId: string;
  reasonCode: string;
};

type AdminOrderCancellationSubmitResult = {
  confirmationMessage: string;
};

type AdminRefundUpdateSubmitInput = {
  orderId: string;
  refundStatus: AdminRefundOutcome;
  refundNote: string;
};

type AdminRefundUpdateSubmitResult = {
  confirmationMessage: string;
};

type AdminOrderCancellationRouteProps = {
  orderId?: string | null;
  api?: AdminOrderCancellationApi;
  loadBootstrap?: () => Promise<AdminOrderCancellationBootstrap>;
  submitCancellation?: (input: AdminOrderCancellationSubmitInput) => Promise<AdminOrderCancellationSubmitResult>;
  submitRefundUpdate?: (input: AdminRefundUpdateSubmitInput) => Promise<AdminRefundUpdateSubmitResult>;
};

const formatOrderStatus = (status: string): string => {
  switch (status) {
    case "IN_PROGRESS":
      return "В доставке";
    case "CANCELLED_BY_ADMIN":
      return "Отменен админом";
    case "CANCELLED_BY_COURIER_UNAVAILABLE":
      return "Отменен: курьер недоступен";
    case "CREATED":
      return "Создан";
    case "DELAYED":
      return "Задержан";
    case "ASSIGNED":
      return "Назначен";
    case "PICKED_UP":
      return "Забран";
    case "DELIVERED":
      return "Доставлен";
    case "COMPLETED":
      return "Завершен";
    default:
      return status.replaceAll("_", " ");
  }
};

const formatRefundStatus = (refundStatus: AdminRefundStatus): string => {
  switch (refundStatus) {
    case "NOT_REQUIRED":
      return "не требуется";
    case "PENDING_MANUAL":
      return "ожидает ручного возврата";
    case "DONE":
      return "выполнен";
    case "REJECTED":
      return "отклонен";
  }
};

const defaultOrderId = "order-in-progress-2004";

const toOrderLabel = (orderId: string): string => {
  const numericSuffix = orderId.match(/(?:^|[-_])(\d{3,})$/u)?.[1];

  return numericSuffix === undefined ? `Заказ ${orderId}` : `Заказ #${numericSuffix}`;
};

const normalizeOrderId = (orderId: string | null | undefined): string | null => {
  const trimmed = orderId?.trim() ?? "";

  return trimmed.length === 0 ? null : trimmed;
};

const createDefaultBootstrap = (orderId: string): AdminOrderCancellationBootstrap => ({
  orderId,
  orderLabel: toOrderLabel(orderId),
  orderStatusLabel: `Текущее состояние заказа: ${formatOrderStatus("IN_PROGRESS")}. Серверная проверка разрешенных ролей остается вне этой страницы.`,
  statusLabel: "Страница отмены готова для подключения команд и видимой обратной связи по состоянию возврата.",
  refundStatus: "PENDING_MANUAL",
  refundStatusLabel: "Платные отмены должны сразу показывать ожидание ручного возврата, пока оператор не запишет результат.",
  refundVisibilityNote:
    "Состояние возврата отображается здесь, чтобы админка показывала явный операторский учет до подключения среды выполнения.",
  refundNote: null,
  cancellationReasons: [
    {
      code: "OPS_DELAY",
      label: "Операционная задержка",
      detail: "Операционная отмена от администратора",
    },
    {
      code: "COURIER_UNAVAILABLE",
      label: "Курьер недоступен",
      detail: "Разрешенный сценарий, когда курьер недоступен",
    },
  ],
});

const loadDefaultBootstrap = async (orderId: string): Promise<AdminOrderCancellationBootstrap> =>
  createDefaultBootstrap(orderId);

const toRefundStatusLabel = (refundStatus: AdminRefundStatus) => {
  switch (refundStatus) {
    case "NOT_REQUIRED":
      return "Возврат явно отмечен как не требующийся для этого отмененного заказа.";
    case "PENDING_MANUAL":
      return "Платные отмены должны сразу показывать ожидание ручного возврата, пока оператор не запишет результат.";
    case "DONE":
      return "Ручной возврат записан как выполненный и остается видимым операторам.";
    case "REJECTED":
      return "Ручной возврат проверен и записан как отклоненный с контекстом оператора.";
  }
};

const toStatusLabel = (
  status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE",
  refundStatus: AdminRefundStatus,
) =>
  refundStatus === "PENDING_MANUAL"
    ? `Отмена записана: ${formatOrderStatus(status)}. Ручной учет возврата остается активным и видимым.`
    : `Отмена записана: ${formatOrderStatus(status)}. Явный результат возврата остается видимым без скрытых побочных эффектов.`;

const toOrderStatusLabel = (status: string) => `Текущее состояние заказа: ${formatOrderStatus(status)}.`;

const applyCancellationResult = (
  bootstrap: AdminOrderCancellationBootstrap,
  result: {
    status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE";
    refundStatus: AdminRefundStatus;
  },
): AdminOrderCancellationBootstrap => ({
  ...bootstrap,
  orderStatusLabel: toOrderStatusLabel(result.status),
  statusLabel: toStatusLabel(result.status, result.refundStatus),
  refundStatus: result.refundStatus,
  refundStatusLabel: toRefundStatusLabel(result.refundStatus),
  refundVisibilityNote:
    result.refundStatus === "PENDING_MANUAL"
      ? "Состояние возврата остается явным, пока оператор записывает ручной результат в этом процессе."
      : "Состояние возврата остается явным после отмены, чтобы операторы не полагались на скрытые побочные эффекты.",
  refundNote: null,
});

const applyRefundUpdateResult = (
  bootstrap: AdminOrderCancellationBootstrap,
  result: {
    refundStatus: Extract<AdminRefundStatus, "DONE" | "REJECTED">;
    refundNote: string | null;
  },
): AdminOrderCancellationBootstrap => ({
  ...bootstrap,
  statusLabel: `Результат возврата "${formatRefundStatus(result.refundStatus)}" записан для отмененного заказа.`,
  refundStatus: result.refundStatus,
  refundStatusLabel: toRefundStatusLabel(result.refundStatus),
  refundVisibilityNote:
    "Учет возврата остается видимым после ручного обновления, чтобы последующая проверка видела явный результат.",
  refundNote: result.refundNote,
});

const toCancellationConfirmationMessage = (result: {
  orderId: string;
  status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE";
  refundStatus: AdminRefundStatus;
  revision: string;
}) =>
  `Заказ ${result.orderId} переведен в состояние "${formatOrderStatus(result.status)}". Состояние возврата: ${formatRefundStatus(result.refundStatus)}. Ревизия ${result.revision} готова для последующего опроса.`;

const toRefundConfirmationMessage = (result: {
  orderId: string;
  refundStatus: Extract<AdminRefundStatus, "DONE" | "REJECTED">;
  revision: string;
}) =>
  `Результат возврата "${formatRefundStatus(result.refundStatus)}" записан для ${result.orderId}. Ревизия ${result.revision} готова для последующего опроса.`;

export const AdminOrderCancellationRoute = ({
  orderId,
  api,
  loadBootstrap,
  submitCancellation,
  submitRefundUpdate,
}: AdminOrderCancellationRouteProps) => {
  const cancellationApi = useRef(api ?? createAdminOrderCancellationApi());
  const cancellationSubmitInFlightRef = useRef(false);
  const refundSubmitInFlightRef = useRef(false);
  const submitCancellationRef = useRef(submitCancellation);
  const submitRefundUpdateRef = useRef(submitRefundUpdate);
  const [bootstrap, setBootstrap] = useState<AdminOrderCancellationBootstrap | null>(null);
  const [viewModel, setViewModel] = useState(createLoadingAdminOrderCancellationViewModel);
  const resolvedOrderId = normalizeOrderId(orderId) ?? defaultOrderId;

  useEffect(() => {
    submitCancellationRef.current = submitCancellation;
  }, [submitCancellation]);

  useEffect(() => {
    submitRefundUpdateRef.current = submitRefundUpdate;
  }, [submitRefundUpdate]);

  useEffect(() => {
    let isActive = true;

    const nextBootstrapPromise =
      loadBootstrap === undefined ? loadDefaultBootstrap(resolvedOrderId) : loadBootstrap();

    void nextBootstrapPromise.then((nextBootstrap) => {
      if (!isActive) {
        return;
      }

      setBootstrap(nextBootstrap);
      setViewModel(createReadyAdminOrderCancellationViewModel(nextBootstrap));
    });

    return () => {
      isActive = false;
    };
  }, [loadBootstrap, resolvedOrderId]);

  const handleReasonChange = (reasonCode: string) => {
    if (bootstrap === null) {
      return;
    }

    setViewModel(createSelectedReasonAdminOrderCancellationViewModel(bootstrap, reasonCode));
  };

  const handleRefundOutcomeChange = (refundStatus: AdminRefundOutcome) => {
    if (bootstrap === null) {
      return;
    }

    setViewModel(
      createSelectedRefundOutcomeAdminOrderCancellationViewModel(
        bootstrap,
        refundStatus,
        viewModel.refundNoteInput,
      ),
    );
  };

  const handleRefundNoteChange = (value: string) => {
    if (bootstrap === null) {
      return;
    }

    setViewModel(
      createRefundNoteAdminOrderCancellationViewModel(
        bootstrap,
        viewModel.selectedRefundOutcome,
        value,
      ),
    );
  };

  const handleCancellationSubmit = async () => {
    if (
      bootstrap === null ||
      viewModel.selectedReasonCode.length === 0 ||
      viewModel.isCancellationSubmitting ||
      cancellationSubmitInFlightRef.current
    ) {
      return;
    }

    const selectedReasonCode = viewModel.selectedReasonCode;
    cancellationSubmitInFlightRef.current = true;
    setViewModel(createSubmittingAdminOrderCancellationViewModel(bootstrap, selectedReasonCode));

    try {
      const result =
        submitCancellationRef.current === undefined
          ? await cancellationApi.current.submitCancellation({
              orderId: bootstrap.orderId,
              reasonCode: selectedReasonCode,
            })
          : await submitCancellationRef.current({
              orderId: bootstrap.orderId,
              reasonCode: selectedReasonCode,
            });
      const nextBootstrap =
        "confirmationMessage" in result ? bootstrap : applyCancellationResult(bootstrap, result);

      setBootstrap(nextBootstrap);
      setViewModel(
        createSuccessAdminOrderCancellationViewModel(
          nextBootstrap,
          selectedReasonCode,
          "confirmationMessage" in result ? result.confirmationMessage : toCancellationConfirmationMessage(result),
        ),
      );
    } catch (error) {
      const message =
        error instanceof AdminOrderCancellationApiError || error instanceof Error
          ? error.message
          : "Workflow отмены временно недоступен.";
      setViewModel(createErrorAdminOrderCancellationViewModel(bootstrap, selectedReasonCode, message));
    } finally {
      cancellationSubmitInFlightRef.current = false;
    }
  };

  const handleRefundSubmit = async () => {
    if (
      bootstrap === null ||
      viewModel.isRefundSubmitting ||
      refundSubmitInFlightRef.current ||
      viewModel.refundNoteInput.trim().length === 0 ||
      bootstrap.refundStatus !== "PENDING_MANUAL"
    ) {
      return;
    }

    const selectedRefundOutcome = viewModel.selectedRefundOutcome;
    const refundNoteInput = viewModel.refundNoteInput;
    refundSubmitInFlightRef.current = true;
    setViewModel(
      createSubmittingRefundAdminOrderCancellationViewModel(
        bootstrap,
        selectedRefundOutcome,
        refundNoteInput,
      ),
    );

    try {
      const result =
        submitRefundUpdateRef.current === undefined
          ? await cancellationApi.current.submitRefundUpdate({
              orderId: bootstrap.orderId,
              refundStatus: selectedRefundOutcome,
              refundNote: refundNoteInput,
            })
          : await submitRefundUpdateRef.current({
              orderId: bootstrap.orderId,
              refundStatus: selectedRefundOutcome,
              refundNote: refundNoteInput,
            });
      const nextBootstrap =
        "confirmationMessage" in result
          ? bootstrap
          : applyRefundUpdateResult(bootstrap, result);

      setBootstrap(nextBootstrap);
      setViewModel(
        createRefundSuccessAdminOrderCancellationViewModel(
          nextBootstrap,
          selectedRefundOutcome,
          "confirmationMessage" in result ? result.confirmationMessage : toRefundConfirmationMessage(result),
        ),
      );
    } catch (error) {
      const message =
        error instanceof AdminOrderCancellationApiError || error instanceof Error
          ? error.message
          : "Учет возврата временно недоступен.";
      setViewModel(
        createRefundErrorAdminOrderCancellationViewModel(
          bootstrap,
          selectedRefundOutcome,
          refundNoteInput,
          message,
        ),
      );
    } finally {
      refundSubmitInFlightRef.current = false;
    }
  };

  return (
    <AdminOrderCancellationPage
      viewModel={viewModel}
      onReasonChange={handleReasonChange}
      onCancellationSubmit={() => {
        void handleCancellationSubmit();
      }}
      onRefundOutcomeChange={handleRefundOutcomeChange}
      onRefundNoteChange={handleRefundNoteChange}
      onRefundSubmit={() => {
        void handleRefundSubmit();
      }}
    />
  );
};
