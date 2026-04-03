export type AdminAssignmentCourierOption = {
  id: string;
  label: string;
  detail: string;
};

export type AdminAssignmentBootstrap = {
  orderId: string;
  orderLabel: string;
  statusLabel: string;
  couriers: AdminAssignmentCourierOption[];
};

export type AdminAssignmentViewModel = {
  headline: string;
  statusLabel: string;
  orderId: string;
  orderLabel: string;
  authBoundaryNote: string;
  couriers: AdminAssignmentCourierOption[];
  selectedCourierId: string;
  submitLabel: string;
  isLoading: boolean;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  successMessage: string | null;
  errorMessage: string | null;
};

const assignmentHeadline = "Courier assignment";
const assignmentAuthBoundaryNote = "Admin login/session stays outside FT-004 and must be provided by the admin-access boundary or tests.";
const defaultSubmitLabel = "Assign courier";

const buildViewModel = (
  bootstrap: AdminAssignmentBootstrap,
  overrides: Partial<AdminAssignmentViewModel> = {},
): AdminAssignmentViewModel => {
  const selectedCourierId =
    overrides.selectedCourierId ?? (bootstrap.couriers.length > 0 ? bootstrap.couriers[0].id : "");

  return {
    headline: assignmentHeadline,
    statusLabel: bootstrap.statusLabel,
    orderId: bootstrap.orderId,
    orderLabel: bootstrap.orderLabel,
    authBoundaryNote: assignmentAuthBoundaryNote,
    couriers: bootstrap.couriers,
    selectedCourierId,
    submitLabel: defaultSubmitLabel,
    isLoading: false,
    isSubmitting: false,
    isSubmitDisabled: selectedCourierId.length === 0,
    successMessage: null,
    errorMessage: null,
    ...overrides,
  };
};

export const createLoadingAdminAssignmentViewModel = (): AdminAssignmentViewModel => ({
  headline: assignmentHeadline,
  statusLabel: "Loading assignment workspace...",
  orderId: "",
  orderLabel: "Preparing assignment form",
  authBoundaryNote: assignmentAuthBoundaryNote,
  couriers: [],
  selectedCourierId: "",
  submitLabel: defaultSubmitLabel,
  isLoading: true,
  isSubmitting: false,
  isSubmitDisabled: true,
  successMessage: null,
  errorMessage: null,
});

export const createReadyAdminAssignmentViewModel = (
  bootstrap: AdminAssignmentBootstrap,
): AdminAssignmentViewModel => buildViewModel(bootstrap);

export const createSelectedCourierAdminAssignmentViewModel = (
  bootstrap: AdminAssignmentBootstrap,
  courierId: string,
): AdminAssignmentViewModel =>
  buildViewModel(bootstrap, {
    selectedCourierId: courierId,
    isSubmitDisabled: courierId.length === 0,
  });

export const createSubmittingAdminAssignmentViewModel = (
  bootstrap: AdminAssignmentBootstrap,
  courierId: string,
): AdminAssignmentViewModel =>
  buildViewModel(bootstrap, {
    selectedCourierId: courierId,
    submitLabel: "Assigning courier...",
    isSubmitting: true,
    isSubmitDisabled: true,
  });

export const createSuccessAdminAssignmentViewModel = (
  bootstrap: AdminAssignmentBootstrap,
  courierId: string,
  message: string,
): AdminAssignmentViewModel =>
  buildViewModel(bootstrap, {
    selectedCourierId: courierId,
    submitLabel: "Courier assigned",
    isSubmitDisabled: true,
    successMessage: message,
  });

export const createErrorAdminAssignmentViewModel = (
  bootstrap: AdminAssignmentBootstrap,
  courierId: string,
  message: string,
): AdminAssignmentViewModel =>
  buildViewModel(bootstrap, {
    selectedCourierId: courierId,
    submitLabel: defaultSubmitLabel,
    isSubmitDisabled: courierId.length === 0,
    errorMessage: message,
  });
