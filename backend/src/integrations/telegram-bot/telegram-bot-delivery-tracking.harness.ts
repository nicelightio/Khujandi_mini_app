export type DeliveryTrackingHarnessStatus = "ASSIGNED" | "IN_PROGRESS" | "DELIVERED" | "COMPLETED";

export type DeliveryTrackingHarnessActionStatus = Exclude<DeliveryTrackingHarnessStatus, "ASSIGNED">;

export type TelegramBotCourierTrackingButton = {
  label: string;
  callbackData: string;
};

export type TelegramBotCourierTrackingMessageInput = {
  chatId: string;
  text: string;
  dedupeKey: string;
  buttons: TelegramBotCourierTrackingButton[];
};

export interface TelegramBotCourierTrackingDispatcher {
  sendMessage(input: TelegramBotCourierTrackingMessageInput): Promise<void>;
}

export type DeliveryTrackingCourierActionPayload = {
  orderId: string;
  nextStatus: DeliveryTrackingHarnessActionStatus;
};

export type DeliveryTrackingCourierPromptInput = {
  courierTelegramId: string;
  orderId: string;
  currentStatus: DeliveryTrackingHarnessStatus;
  revision: string;
  availableActions: DeliveryTrackingHarnessActionStatus[];
};

const CALLBACK_PREFIX = "delivery-tracking";

const actionLabels: Record<DeliveryTrackingHarnessActionStatus, string> = {
  IN_PROGRESS: "Start delivery",
  DELIVERED: "Mark delivered",
  COMPLETED: "Complete order",
};

export const buildDeliveryTrackingCallbackData = (
  payload: DeliveryTrackingCourierActionPayload,
): string => `${CALLBACK_PREFIX}:${payload.orderId}:${payload.nextStatus}`;

export const parseDeliveryTrackingCallbackData = (
  value: string,
): DeliveryTrackingCourierActionPayload | null => {
  const [prefix, orderId, nextStatus] = value.split(":");

  if (
    prefix !== CALLBACK_PREFIX ||
    typeof orderId !== "string" ||
    orderId.length === 0 ||
    (nextStatus !== "IN_PROGRESS" && nextStatus !== "DELIVERED" && nextStatus !== "COMPLETED")
  ) {
    return null;
  }

  return {
    orderId,
    nextStatus,
  };
};

const buildPromptText = (input: DeliveryTrackingCourierPromptInput): string =>
  `Order ${input.orderId} is currently ${input.currentStatus}. Choose the next courier action in the owning delivery-tracking flow.`;

export class TelegramBotDeliveryTrackingHarness {
  constructor(private readonly dispatcher: TelegramBotCourierTrackingDispatcher) {}

  notifyCourierStatusActions(input: DeliveryTrackingCourierPromptInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.courierTelegramId,
      text: buildPromptText(input),
      dedupeKey: `order.status_changed:${input.orderId}:${input.revision}`,
      buttons: input.availableActions.map((action) => ({
        label: actionLabels[action],
        callbackData: buildDeliveryTrackingCallbackData({
          orderId: input.orderId,
          nextStatus: action,
        }),
      })),
    });
  }

  parseCourierAction(callbackData: string): DeliveryTrackingCourierActionPayload | null {
    return parseDeliveryTrackingCallbackData(callbackData);
  }
}
