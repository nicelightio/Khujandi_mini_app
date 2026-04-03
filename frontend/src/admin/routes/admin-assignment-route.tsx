import { useEffect, useRef, useState } from "react";
import { AdminAssignmentPage } from "../components/admin-assignment-page";
import {
  AdminAssignmentApiError,
  createAdminAssignmentApi,
  type AdminAssignmentApi,
} from "../api/admin-assignment-api";
import {
  createErrorAdminAssignmentViewModel,
  createLoadingAdminAssignmentViewModel,
  createReadyAdminAssignmentViewModel,
  createSelectedCourierAdminAssignmentViewModel,
  createSubmittingAdminAssignmentViewModel,
  createSuccessAdminAssignmentViewModel,
  type AdminAssignmentBootstrap,
} from "../model/admin-assignment-view-model";

type AdminAssignmentSubmitInput = {
  orderId: string;
  courierId: string;
};

type AdminAssignmentSubmitResult = {
  confirmationMessage: string;
};

type AdminAssignmentRouteProps = {
  api?: AdminAssignmentApi;
  loadBootstrap?: () => Promise<AdminAssignmentBootstrap>;
  submitAssignment?: (input: AdminAssignmentSubmitInput) => Promise<AdminAssignmentSubmitResult>;
};

const defaultBootstrap: AdminAssignmentBootstrap = {
  orderId: "order-created-1001",
  orderLabel: "Order #1001",
  statusLabel: "Assignment shell is ready for CREATED -> ASSIGNED wiring.",
  couriers: [
    {
      id: "courier-7",
      label: "Courier 7",
      detail: "Available now",
    },
    {
      id: "courier-8",
      label: "Courier 8",
      detail: "Backup shift",
    },
  ],
};

const loadDefaultBootstrap = async (): Promise<AdminAssignmentBootstrap> => defaultBootstrap;

const toAssignmentConfirmationMessage = (result: {
  orderId: string;
  courierId: string;
  revision: string;
}): string => `Courier ${result.courierId} assigned to ${result.orderId}. Revision ${result.revision} is ready for downstream polling.`;

export const AdminAssignmentRoute = ({
  api,
  loadBootstrap = loadDefaultBootstrap,
  submitAssignment,
}: AdminAssignmentRouteProps) => {
  const assignmentApi = useRef(api ?? createAdminAssignmentApi());
  const submitInFlightRef = useRef(false);
  const [bootstrap, setBootstrap] = useState<AdminAssignmentBootstrap | null>(null);
  const [viewModel, setViewModel] = useState(createLoadingAdminAssignmentViewModel);

  useEffect(() => {
    let isActive = true;

    void loadBootstrap().then((nextBootstrap) => {
      if (!isActive) {
        return;
      }

      setBootstrap(nextBootstrap);
      setViewModel(createReadyAdminAssignmentViewModel(nextBootstrap));
    });

    return () => {
      isActive = false;
    };
  }, [loadBootstrap]);

  const handleCourierChange = (courierId: string) => {
    if (bootstrap === null) {
      return;
    }

    setViewModel(createSelectedCourierAdminAssignmentViewModel(bootstrap, courierId));
  };

  const handleSubmit = async () => {
    if (
      bootstrap === null ||
      viewModel.selectedCourierId.length === 0 ||
      viewModel.isSubmitting ||
      submitInFlightRef.current
    ) {
      return;
    }

    const selectedCourierId = viewModel.selectedCourierId;
    submitInFlightRef.current = true;
    setViewModel(createSubmittingAdminAssignmentViewModel(bootstrap, selectedCourierId));

    try {
      const result =
        submitAssignment === undefined
          ? await assignmentApi.current.submitAssignment({
              orderId: bootstrap.orderId,
              courierId: selectedCourierId,
            })
          : await submitAssignment({
              orderId: bootstrap.orderId,
              courierId: selectedCourierId,
            });

      setViewModel(
        createSuccessAdminAssignmentViewModel(
          bootstrap,
          selectedCourierId,
          "confirmationMessage" in result ? result.confirmationMessage : toAssignmentConfirmationMessage(result),
        ),
      );
    } catch (error) {
      const message =
        error instanceof AdminAssignmentApiError || error instanceof Error
          ? error.message
          : "Assignment is temporarily unavailable.";
      setViewModel(createErrorAdminAssignmentViewModel(bootstrap, selectedCourierId, message));
    } finally {
      submitInFlightRef.current = false;
    }
  };

  return (
    <AdminAssignmentPage
      viewModel={viewModel}
      onCourierChange={handleCourierChange}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
};
