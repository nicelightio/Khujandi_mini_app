import { getCopy } from "../../../shared/i18n/copy";
import { defaultLanguage, type SupportedLanguage } from "../../../shared/i18n/languages";
import type {
  OrderTrackingActionStatus,
  OrderTrackingEvent,
  OrderTrackingPollResult,
  OrderTrackingSession,
  OrderTrackingStatus,
} from "../api/order-tracking-api";

export type OrderTrackingActionViewModel = {
  nextStatus: OrderTrackingActionStatus;
  label: string;
};

export type OrderTrackingConsumerState = {
  orderId: string;
  cursor: string;
  currentStatus: OrderTrackingStatus;
  appliedEventCount: number;
  lastAppliedRevision: string | null;
  seenRevisions: string[];
  availableActions: OrderTrackingActionStatus[];
  isReadOnly: boolean;
};

export type OrderTrackingViewModel = {
  headline: string;
  orderId: string | null;
  statusLabel: string;
  customerLifecycleTitle: string;
  customerLifecycleBody: string;
  updatesLabel: string;
  cursorLabel: string;
  latestRevisionLabel: string;
  boundaryNote: string;
  actionsLabel: string;
  actions: OrderTrackingActionViewModel[];
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  recoveryHref: string | null;
  recoveryLabel: string | null;
};

export const getAvailableActionsForOrderTrackingStatus = (
  status: OrderTrackingStatus,
): OrderTrackingActionStatus[] => {
  switch (status) {
    case "ASSIGNED":
      return ["IN_PROGRESS"];
    case "IN_PROGRESS":
      return ["DELIVERED"];
    case "DELIVERED":
      return ["COMPLETED"];
    default:
      return [];
  }
};

const orderTrackingStatusRank: Record<OrderTrackingStatus, number> = {
  CREATED: 0,
  ASSIGNED: 1,
  IN_PROGRESS: 2,
  DELIVERED: 3,
  COMPLETED: 4,
  CANCELLED_BY_ADMIN: 4,
  CANCELLED_BY_COURIER_UNAVAILABLE: 4,
};

const isTerminalOrderTrackingStatus = (status: OrderTrackingStatus): boolean =>
  status === "COMPLETED" || status === "CANCELLED_BY_ADMIN" || status === "CANCELLED_BY_COURIER_UNAVAILABLE";

const canApplyPolledStatus = (
  currentStatus: OrderTrackingStatus,
  nextStatus: OrderTrackingStatus,
): boolean => {
  if (isTerminalOrderTrackingStatus(currentStatus)) {
    return false;
  }

  if (isTerminalOrderTrackingStatus(nextStatus)) {
    return true;
  }

  return orderTrackingStatusRank[nextStatus] >= orderTrackingStatusRank[currentStatus];
};

const getActionLabel = (
  status: OrderTrackingActionStatus,
  language: SupportedLanguage,
): string => getCopy(language).orderTracking.nextActionLabel[status];

export const createOrderTrackingConsumerState = (
  session: OrderTrackingSession,
): OrderTrackingConsumerState => ({
  orderId: session.orderId,
  cursor: session.initialCursor,
  currentStatus: session.currentStatus,
  appliedEventCount: 0,
  lastAppliedRevision: null,
  seenRevisions: [],
  availableActions: session.isReadOnly === true ? [] : session.availableActions,
  isReadOnly: session.isReadOnly === true,
});

export const applyOrderTrackingPollResult = (
  currentState: OrderTrackingConsumerState,
  result: OrderTrackingPollResult,
): OrderTrackingConsumerState => {
  const seenRevisions = new Set(currentState.seenRevisions);
  const nextEvents: OrderTrackingEvent[] = [];

  let currentStatus = currentState.currentStatus;

  for (const event of result.events) {
    if (event.entityId !== currentState.orderId || seenRevisions.has(event.revision)) {
      continue;
    }

    seenRevisions.add(event.revision);

    if (!canApplyPolledStatus(currentStatus, event.payload.status)) {
      continue;
    }

    currentStatus = event.payload.status;
    nextEvents.push(event);
  }

  const lastEvent = nextEvents[nextEvents.length - 1];

  return {
    ...currentState,
    cursor: result.nextCursor,
    currentStatus: lastEvent?.payload.status ?? currentState.currentStatus,
    appliedEventCount: currentState.appliedEventCount + nextEvents.length,
    lastAppliedRevision: lastEvent?.revision ?? currentState.lastAppliedRevision,
    seenRevisions: Array.from(seenRevisions),
    availableActions:
      currentState.isReadOnly
        ? []
        : lastEvent === undefined
        ? currentState.availableActions
        : getAvailableActionsForOrderTrackingStatus(lastEvent.payload.status),
  };
};

export const applyOrderTrackingActionResult = (
  currentState: OrderTrackingConsumerState,
  result: {
    orderId: string;
    status: OrderTrackingStatus;
    revision: string;
    availableActions: OrderTrackingActionStatus[];
  },
): OrderTrackingConsumerState => {
  if (currentState.isReadOnly || result.orderId !== currentState.orderId) {
    return currentState;
  }

  const seenRevisions = new Set(currentState.seenRevisions);
  const isDuplicateRevision = seenRevisions.has(result.revision);

  seenRevisions.add(result.revision);

  return {
    ...currentState,
    cursor: result.revision,
    currentStatus: result.status,
    appliedEventCount: currentState.appliedEventCount + (isDuplicateRevision ? 0 : 1),
    lastAppliedRevision: result.revision,
    seenRevisions: Array.from(seenRevisions),
    availableActions: result.availableActions,
  };
};

export const createLoadingOrderTrackingViewModel = (
  language: SupportedLanguage = defaultLanguage,
): OrderTrackingViewModel => {
  const copy = getCopy(language).orderTracking;

  return {
    headline: copy.headline,
    orderId: null,
    statusLabel: copy.loadingStatus,
    customerLifecycleTitle: copy.loadingStatus,
    customerLifecycleBody: copy.loadingBody,
    updatesLabel: copy.updatesApplied(0),
    cursorLabel: copy.cursorLabel("0"),
    latestRevisionLabel: copy.latestRevision(null),
    boundaryNote: copy.boundaryNote,
    actionsLabel: copy.availableActionsLabel,
    actions: [],
    isLoading: true,
    isSubmitting: false,
    errorMessage: null,
    recoveryHref: null,
    recoveryLabel: null,
  };
};

export const createErrorOrderTrackingViewModel = (
  message = getCopy(defaultLanguage).orderTracking.unavailableMessage,
  language: SupportedLanguage = defaultLanguage,
  recoveryHref: string | null = null,
): OrderTrackingViewModel => {
  const copy = getCopy(language).orderTracking;

  return {
    headline: copy.headline,
    orderId: null,
    statusLabel: copy.unavailableStatus,
    customerLifecycleTitle: copy.unavailableStatus,
    customerLifecycleBody: message,
    updatesLabel: copy.updatesApplied(0),
    cursorLabel: copy.cursorLabel("0"),
    latestRevisionLabel: copy.latestRevision(null),
    boundaryNote: copy.boundaryNote,
    actionsLabel: copy.availableActionsLabel,
    actions: [],
    isLoading: false,
    isSubmitting: false,
    errorMessage: message,
    recoveryHref,
    recoveryLabel: recoveryHref === null ? null : copy.recoveryAction,
  };
};

type CreateReadyOrderTrackingViewModelInput = {
  state: OrderTrackingConsumerState;
  language?: SupportedLanguage;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

export const createReadyOrderTrackingViewModel = ({
  state,
  language = defaultLanguage,
  isSubmitting = false,
  errorMessage = null,
}: CreateReadyOrderTrackingViewModelInput): OrderTrackingViewModel => {
  const copy = getCopy(language).orderTracking;

  return {
    headline: copy.headline,
    orderId: state.orderId,
    statusLabel: isSubmitting ? copy.pendingAction : copy.currentStatus(state.currentStatus),
    customerLifecycleTitle: copy.customerLifecycleTitle[state.currentStatus],
    customerLifecycleBody: copy.customerLifecycleBody[state.currentStatus],
    updatesLabel: copy.updatesApplied(state.appliedEventCount),
    cursorLabel: copy.cursorLabel(state.cursor),
    latestRevisionLabel: copy.latestRevision(state.lastAppliedRevision),
    boundaryNote: copy.boundaryNote,
    actionsLabel: copy.availableActionsLabel,
    actions: state.availableActions.map((status) => ({
      nextStatus: status,
      label: getActionLabel(status, language),
    })),
    isLoading: false,
    isSubmitting,
    errorMessage,
    recoveryHref: null,
    recoveryLabel: null,
  };
};
