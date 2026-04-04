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
  api?: AdminOrderCancellationApi;
  loadBootstrap?: () => Promise<AdminOrderCancellationBootstrap>;
  submitCancellation?: (input: AdminOrderCancellationSubmitInput) => Promise<AdminOrderCancellationSubmitResult>;
  submitRefundUpdate?: (input: AdminRefundUpdateSubmitInput) => Promise<AdminRefundUpdateSubmitResult>;
};

const defaultBootstrap: AdminOrderCancellationBootstrap = {
  orderId: "order-in-progress-2004",
  orderLabel: "Order #2004",
  orderStatusLabel: "Current order state: IN_PROGRESS. Server-side allowed-role validation remains outside this shell.",
  statusLabel: "Cancellation shell is ready for FT-006 command wiring and visible refund-state feedback.",
  refundStatus: "PENDING_MANUAL",
  refundStatusLabel: "Paid cancellations must immediately surface PENDING_MANUAL until a later manual refund update is recorded.",
  refundVisibilityNote:
    "Refund state is rendered here so FT-006 UI can show explicit operator-visible tracking before runtime wiring lands.",
  refundNote: null,
  cancellationReasons: [
    {
      code: "OPS_DELAY",
      label: "Operational delay",
      detail: "Admin-only operational cancellation placeholder",
    },
    {
      code: "COURIER_UNAVAILABLE",
      label: "Courier unavailable",
      detail: "Fixture-only preview for allowed unavailable-case handling",
    },
  ],
};

const loadDefaultBootstrap = async (): Promise<AdminOrderCancellationBootstrap> => defaultBootstrap;

const toRefundStatusLabel = (refundStatus: AdminRefundStatus) => {
  switch (refundStatus) {
    case "NOT_REQUIRED":
      return "Refund is explicitly marked as not required for this cancelled order.";
    case "PENDING_MANUAL":
      return "Paid cancellations must immediately surface PENDING_MANUAL until an operator records the manual outcome.";
    case "DONE":
      return "Manual refund is recorded as completed and remains visible to operators.";
    case "REJECTED":
      return "Manual refund was reviewed and recorded as rejected with operator context.";
  }
};

const toStatusLabel = (
  status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE",
  refundStatus: AdminRefundStatus,
) =>
  refundStatus === "PENDING_MANUAL"
    ? `Cancellation recorded as ${status}. Manual refund tracking remains active and visible.`
    : `Cancellation recorded as ${status}. Explicit refund outcome remains visible without hidden side effects.`;

const toOrderStatusLabel = (status: string) => `Current order state: ${status}.`;

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
      ? "Refund state stays explicit while the operator records the manual outcome in this workflow."
      : "Refund state stays explicit after cancellation so operators do not rely on hidden side effects.",
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
  statusLabel: `Refund outcome ${result.refundStatus} is now recorded for the cancelled order.`,
  refundStatus: result.refundStatus,
  refundStatusLabel: toRefundStatusLabel(result.refundStatus),
  refundVisibilityNote:
    "Refund tracking remains visible after the manual update so later verification can confirm the explicit outcome.",
  refundNote: result.refundNote,
});

const toCancellationConfirmationMessage = (result: {
  orderId: string;
  status: "CANCELLED_BY_ADMIN" | "CANCELLED_BY_COURIER_UNAVAILABLE";
  refundStatus: AdminRefundStatus;
  revision: string;
}) =>
  `Order ${result.orderId} moved to ${result.status}. Refund state ${result.refundStatus} is explicit. Revision ${result.revision} is ready for downstream polling.`;

const toRefundConfirmationMessage = (result: {
  orderId: string;
  refundStatus: Extract<AdminRefundStatus, "DONE" | "REJECTED">;
  revision: string;
}) =>
  `Refund outcome ${result.refundStatus} recorded for ${result.orderId}. Revision ${result.revision} is ready for downstream polling.`;

export const AdminOrderCancellationRoute = ({
  api,
  loadBootstrap = loadDefaultBootstrap,
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

  useEffect(() => {
    submitCancellationRef.current = submitCancellation;
  }, [submitCancellation]);

  useEffect(() => {
    submitRefundUpdateRef.current = submitRefundUpdate;
  }, [submitRefundUpdate]);

  useEffect(() => {
    let isActive = true;

    void loadBootstrap().then((nextBootstrap) => {
      if (!isActive) {
        return;
      }

      setBootstrap(nextBootstrap);
      setViewModel(createReadyAdminOrderCancellationViewModel(nextBootstrap));
    });

    return () => {
      isActive = false;
    };
  }, [loadBootstrap]);

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
          : "Cancellation workflow is temporarily unavailable.";
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
          : "Refund tracking is temporarily unavailable.";
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
