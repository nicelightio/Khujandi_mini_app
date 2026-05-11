export type AdminCancellationReasonOption = {
  code: string;
  label: string;
  detail: string;
};

export type AdminRefundStatus = "NOT_REQUIRED" | "PENDING_MANUAL" | "DONE" | "REJECTED";

export type AdminRefundOutcome = Extract<AdminRefundStatus, "DONE" | "REJECTED">;

export type AdminOrderCancellationBootstrap = {
  orderId: string;
  orderLabel: string;
  orderStatusLabel: string;
  statusLabel: string;
  refundStatus: AdminRefundStatus;
  refundStatusLabel: string;
  refundVisibilityNote: string;
  refundNote: string | null;
  cancellationReasons: AdminCancellationReasonOption[];
};

export type AdminOrderCancellationViewModel = {
  headline: string;
  statusLabel: string;
  orderId: string;
  orderLabel: string;
  orderStatusLabel: string;
  authBoundaryNote: string;
  cancellationReasons: AdminCancellationReasonOption[];
  selectedReasonCode: string;
  refundStatus: AdminRefundStatus;
  refundStatusLabel: string;
  refundVisibilityNote: string;
  refundNote: string | null;
  cancellationSubmitLabel: string;
  isLoading: boolean;
  isCancellationSubmitting: boolean;
  isCancellationSubmitDisabled: boolean;
  refundOutcomeOptions: Array<{
    value: AdminRefundOutcome;
    label: string;
  }>;
  selectedRefundOutcome: AdminRefundOutcome;
  refundNoteInput: string;
  refundSubmitLabel: string;
  isRefundSubmitting: boolean;
  isRefundSubmitDisabled: boolean;
  successMessage: string | null;
  errorMessage: string | null;
};

const cancellationHeadline = "Отмена заказа и учет возврата";
const cancellationAuthBoundaryNote =
  "Логин/сессия админки остаются вне FT-006 и должны приходить из границы admin-access или тестов.";
const defaultCancellationSubmitLabel = "Отправить отмену";
const defaultRefundSubmitLabel = "Записать результат возврата";

const refundOutcomeOptions: AdminOrderCancellationViewModel["refundOutcomeOptions"] = [
  {
    value: "DONE",
    label: "Возврат выполнен вручную",
  },
  {
    value: "REJECTED",
    label: "Возврат отклонен после ручной проверки",
  },
];

const buildViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  overrides: Partial<AdminOrderCancellationViewModel> = {},
): AdminOrderCancellationViewModel => {
  const selectedReasonCode =
    overrides.selectedReasonCode ??
    (bootstrap.cancellationReasons.length > 0 ? bootstrap.cancellationReasons[0].code : "");
  const selectedRefundOutcome = overrides.selectedRefundOutcome ?? "DONE";
  const refundNoteInput = overrides.refundNoteInput ?? "";
  const isRefundPending = bootstrap.refundStatus === "PENDING_MANUAL";

  return {
    headline: cancellationHeadline,
    statusLabel: bootstrap.statusLabel,
    orderId: bootstrap.orderId,
    orderLabel: bootstrap.orderLabel,
    orderStatusLabel: bootstrap.orderStatusLabel,
    authBoundaryNote: cancellationAuthBoundaryNote,
    cancellationReasons: bootstrap.cancellationReasons,
    selectedReasonCode,
    refundStatus: bootstrap.refundStatus,
    refundStatusLabel: bootstrap.refundStatusLabel,
    refundVisibilityNote: bootstrap.refundVisibilityNote,
    refundNote: bootstrap.refundNote,
    cancellationSubmitLabel: defaultCancellationSubmitLabel,
    isLoading: false,
    isCancellationSubmitting: false,
    isCancellationSubmitDisabled: selectedReasonCode.length === 0,
    refundOutcomeOptions,
    selectedRefundOutcome,
    refundNoteInput,
    refundSubmitLabel: defaultRefundSubmitLabel,
    isRefundSubmitting: false,
    isRefundSubmitDisabled: !isRefundPending || refundNoteInput.trim().length === 0,
    successMessage: null,
    errorMessage: null,
    ...overrides,
  };
};

export const createLoadingAdminOrderCancellationViewModel = (): AdminOrderCancellationViewModel => ({
  headline: cancellationHeadline,
  statusLabel: "Загружаем рабочую область отмены...",
  orderId: "",
  orderLabel: "Готовим форму отмены",
  orderStatusLabel: "Определяем состояние заказа",
  authBoundaryNote: cancellationAuthBoundaryNote,
  cancellationReasons: [],
  selectedReasonCode: "",
  refundStatus: "PENDING_MANUAL",
  refundStatusLabel: "Состояние возврата загружается.",
  refundVisibilityNote: "Ответственность за состояние возврата остается за runtime-задачами FT-006.",
  refundNote: null,
  cancellationSubmitLabel: defaultCancellationSubmitLabel,
  isLoading: true,
  isCancellationSubmitting: false,
  isCancellationSubmitDisabled: true,
  refundOutcomeOptions,
  selectedRefundOutcome: "DONE",
  refundNoteInput: "",
  refundSubmitLabel: defaultRefundSubmitLabel,
  isRefundSubmitting: false,
  isRefundSubmitDisabled: true,
  successMessage: null,
  errorMessage: null,
});

export const createReadyAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
): AdminOrderCancellationViewModel => buildViewModel(bootstrap);

export const createSelectedReasonAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  reasonCode: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedReasonCode: reasonCode,
    isCancellationSubmitDisabled: reasonCode.length === 0,
  });

export const createSubmittingAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  reasonCode: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedReasonCode: reasonCode,
    cancellationSubmitLabel: "Отправляем отмену...",
    isCancellationSubmitting: true,
    isCancellationSubmitDisabled: true,
  });

export const createSuccessAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  reasonCode: string,
  message: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedReasonCode: reasonCode,
    cancellationSubmitLabel: defaultCancellationSubmitLabel,
    successMessage: message,
  });

export const createErrorAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  reasonCode: string,
  message: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedReasonCode: reasonCode,
    cancellationSubmitLabel: defaultCancellationSubmitLabel,
    isCancellationSubmitDisabled: reasonCode.length === 0,
    errorMessage: message,
  });

export const createSelectedRefundOutcomeAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  selectedRefundOutcome: AdminRefundOutcome,
  refundNoteInput: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedRefundOutcome,
    refundNoteInput,
    isRefundSubmitDisabled:
      bootstrap.refundStatus !== "PENDING_MANUAL" || refundNoteInput.trim().length === 0,
  });

export const createRefundNoteAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  selectedRefundOutcome: AdminRefundOutcome,
  refundNoteInput: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedRefundOutcome,
    refundNoteInput,
    isRefundSubmitDisabled:
      bootstrap.refundStatus !== "PENDING_MANUAL" || refundNoteInput.trim().length === 0,
  });

export const createSubmittingRefundAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  selectedRefundOutcome: AdminRefundOutcome,
  refundNoteInput: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedRefundOutcome,
    refundNoteInput,
    refundSubmitLabel: "Записываем результат возврата...",
    isRefundSubmitting: true,
    isRefundSubmitDisabled: true,
  });

export const createRefundSuccessAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  selectedRefundOutcome: AdminRefundOutcome,
  message: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedRefundOutcome,
    refundNoteInput: "",
    refundSubmitLabel: defaultRefundSubmitLabel,
    successMessage: message,
  });

export const createRefundErrorAdminOrderCancellationViewModel = (
  bootstrap: AdminOrderCancellationBootstrap,
  selectedRefundOutcome: AdminRefundOutcome,
  refundNoteInput: string,
  message: string,
): AdminOrderCancellationViewModel =>
  buildViewModel(bootstrap, {
    selectedRefundOutcome,
    refundNoteInput,
    refundSubmitLabel: defaultRefundSubmitLabel,
    isRefundSubmitDisabled:
      bootstrap.refundStatus !== "PENDING_MANUAL" || refundNoteInput.trim().length === 0,
    errorMessage: message,
  });
