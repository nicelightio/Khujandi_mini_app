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

const cancellationHeadline = "Order cancellation and refund tracking";
const cancellationAuthBoundaryNote =
  "Admin login/session stays outside FT-006 and must be provided by the admin-access boundary or tests.";
const defaultCancellationSubmitLabel = "Submit cancellation";
const defaultRefundSubmitLabel = "Record refund outcome";

const refundOutcomeOptions: AdminOrderCancellationViewModel["refundOutcomeOptions"] = [
  {
    value: "DONE",
    label: "Refund completed manually",
  },
  {
    value: "REJECTED",
    label: "Refund rejected after manual review",
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
  statusLabel: "Loading cancellation workspace...",
  orderId: "",
  orderLabel: "Preparing cancellation form",
  orderStatusLabel: "Resolving order state",
  authBoundaryNote: cancellationAuthBoundaryNote,
  cancellationReasons: [],
  selectedReasonCode: "",
  refundStatus: "PENDING_MANUAL",
  refundStatusLabel: "Refund state is loading.",
  refundVisibilityNote: "Refund-state ownership remains with FT-006 runtime tasks.",
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
    cancellationSubmitLabel: "Submitting cancellation...",
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
    refundSubmitLabel: "Recording refund outcome...",
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
