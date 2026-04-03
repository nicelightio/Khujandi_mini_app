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
};

export type OrderTrackingViewModel = {
  headline: string;
  orderId: string | null;
  statusLabel: string;
  updatesLabel: string;
  cursorLabel: string;
  latestRevisionLabel: string;
  boundaryNote: string;
  actionsLabel: string;
  actions: OrderTrackingActionViewModel[];
  isLoading: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
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
  availableActions: session.availableActions,
});

export const applyOrderTrackingPollResult = (
  currentState: OrderTrackingConsumerState,
  result: OrderTrackingPollResult,
): OrderTrackingConsumerState => {
  const seenRevisions = new Set(currentState.seenRevisions);
  const nextEvents: OrderTrackingEvent[] = [];

  for (const event of result.events) {
    if (event.entityId !== currentState.orderId || seenRevisions.has(event.revision)) {
      continue;
    }

    seenRevisions.add(event.revision);
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
    updatesLabel: copy.updatesApplied(0),
    cursorLabel: copy.cursorLabel("0"),
    latestRevisionLabel: copy.latestRevision(null),
    boundaryNote: copy.boundaryNote,
    actionsLabel: copy.availableActionsLabel,
    actions: [],
    isLoading: true,
    isSubmitting: false,
    errorMessage: null,
  };
};

export const createErrorOrderTrackingViewModel = (
  message = getCopy(defaultLanguage).orderTracking.unavailableMessage,
  language: SupportedLanguage = defaultLanguage,
): OrderTrackingViewModel => {
  const copy = getCopy(language).orderTracking;

  return {
    headline: copy.headline,
    orderId: null,
    statusLabel: copy.unavailableStatus,
    updatesLabel: copy.updatesApplied(0),
    cursorLabel: copy.cursorLabel("0"),
    latestRevisionLabel: copy.latestRevision(null),
    boundaryNote: copy.boundaryNote,
    actionsLabel: copy.availableActionsLabel,
    actions: [],
    isLoading: false,
    isSubmitting: false,
    errorMessage: message,
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
  };
};
