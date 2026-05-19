import type {
  DeliveryAssignmentCourierAvailabilityRecord,
  DeliveryAssignmentUserId,
} from "../../slices/delivery-assignment/domain/delivery-assignment.types";

export type TelegramBotCourierAvailabilityButton = {
  label: string;
  callbackData: string;
};

export type TelegramBotCourierAvailabilityMessageInput = {
  chatId: string;
  text: string;
  dedupeKey: string;
  buttons: TelegramBotCourierAvailabilityButton[];
};

export interface TelegramBotCourierAvailabilityDispatcher {
  sendMessage(input: TelegramBotCourierAvailabilityMessageInput): Promise<void>;
}

export type CourierAvailabilityMenuInput = {
  courierTelegramId: string;
  availability: DeliveryAssignmentCourierAvailabilityRecord;
  revision: string;
};

export type CourierAvailabilityServiceIntent =
  | {
      type: "start_work";
      courierId: DeliveryAssignmentUserId;
    }
  | {
      type: "stop_after_5_minutes";
      courierId: DeliveryAssignmentUserId;
    }
  | {
      type: "set_auto_offer";
      courierId: DeliveryAssignmentUserId;
      enabled: boolean;
    };

export interface CourierAvailabilityServiceBoundary {
  startCourierWork(
    courierId: DeliveryAssignmentUserId,
  ): Promise<DeliveryAssignmentCourierAvailabilityRecord>;
  stopCourierWorkAfter(
    courierId: DeliveryAssignmentUserId,
  ): Promise<DeliveryAssignmentCourierAvailabilityRecord>;
  setCourierAutoOfferParticipation(
    courierId: DeliveryAssignmentUserId,
    enabled: boolean,
  ): Promise<DeliveryAssignmentCourierAvailabilityRecord>;
}

const CALLBACK_PREFIX = "da-ca";
const LEGACY_CALLBACK_PREFIX = "delivery-assignment-courier-availability";
const COURIER_MENU_TEXT = "Курьер";
const TELEGRAM_CALLBACK_DATA_LIMIT_BYTES = 64;

const callbackTypeToWire = (type: CourierAvailabilityServiceIntent["type"]): string => {
  if (type === "start_work") {
    return "sw";
  }

  if (type === "stop_after_5_minutes") {
    return "s5";
  }

  return "ao";
};

const callbackTypeFromWire = (type: string): CourierAvailabilityServiceIntent["type"] | null => {
  if (type === "sw" || type === "start_work") {
    return "start_work";
  }

  if (type === "s5" || type === "stop_after_5_minutes") {
    return "stop_after_5_minutes";
  }

  if (type === "ao" || type === "set_auto_offer") {
    return "set_auto_offer";
  }

  return null;
};

const encodeSegment = (value: string): string => encodeURIComponent(value);

const decodeSegment = (value: string): string => decodeURIComponent(value);

export const buildCourierAvailabilityCallbackData = (
  intent: CourierAvailabilityServiceIntent,
): string => {
  const base = [CALLBACK_PREFIX, callbackTypeToWire(intent.type), encodeSegment(intent.courierId)];

  if (intent.type === "set_auto_offer") {
    base.push(intent.enabled ? "on" : "off");
  }

  const callbackData = base.join(":");

  if (Buffer.byteLength(callbackData, "utf8") > TELEGRAM_CALLBACK_DATA_LIMIT_BYTES) {
    throw new Error("Courier availability callback data exceeds Telegram limit");
  }

  return callbackData;
};

export const parseCourierAvailabilityCallbackData = (
  value: string,
): CourierAvailabilityServiceIntent | null => {
  const [prefix, type, encodedCourierId, enabledValue, ...extra] = value.split(":");

  if (
    (prefix !== CALLBACK_PREFIX && prefix !== LEGACY_CALLBACK_PREFIX) ||
    extra.length > 0 ||
    typeof encodedCourierId !== "string" ||
    encodedCourierId.length === 0
  ) {
    return null;
  }

  const courierId = decodeSegment(encodedCourierId);

  if (courierId.length === 0) {
    return null;
  }

  const normalizedType = callbackTypeFromWire(type ?? "");

  if (normalizedType === "start_work") {
    return {
      type: normalizedType,
      courierId,
    };
  }

  if (normalizedType === "stop_after_5_minutes") {
    return {
      type: normalizedType,
      courierId,
    };
  }

  if (normalizedType === "set_auto_offer" && (enabledValue === "on" || enabledValue === "off")) {
    return {
      type: normalizedType,
      courierId,
      enabled: enabledValue === "on",
    };
  }

  return null;
};

export const executeCourierAvailabilityIntent = (
  service: CourierAvailabilityServiceBoundary,
  intent: CourierAvailabilityServiceIntent,
): Promise<DeliveryAssignmentCourierAvailabilityRecord> => {
  if (intent.type === "start_work") {
    return service.startCourierWork(intent.courierId);
  }

  if (intent.type === "stop_after_5_minutes") {
    return service.stopCourierWorkAfter(intent.courierId);
  }

  return service.setCourierAutoOfferParticipation(intent.courierId, intent.enabled);
};

const buildMenuButtons = (
  availability: DeliveryAssignmentCourierAvailabilityRecord,
): TelegramBotCourierAvailabilityButton[] => {
  const nextAutoOfferEnabled = !availability.autoOfferEnabled;

  return [
    {
      label: "Выйти на работу",
      callbackData: buildCourierAvailabilityCallbackData({
        type: "start_work",
        courierId: availability.courierId,
      }),
    },
    {
      label: "Завершить прием заказов через 5 минут",
      callbackData: buildCourierAvailabilityCallbackData({
        type: "stop_after_5_minutes",
        courierId: availability.courierId,
      }),
    },
    {
      label: `Автоматически принимать заказы: ${
        availability.autoOfferEnabled ? "ON" : "OFF"
      }`,
      callbackData: buildCourierAvailabilityCallbackData({
        type: "set_auto_offer",
        courierId: availability.courierId,
        enabled: nextAutoOfferEnabled,
      }),
    },
  ];
};

export class TelegramBotCourierAvailabilityHarness {
  constructor(private readonly dispatcher: TelegramBotCourierAvailabilityDispatcher) {}

  notifyCourierMenu(input: CourierAvailabilityMenuInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.courierTelegramId,
      text: COURIER_MENU_TEXT,
      dedupeKey: `courier.availability.menu:${input.availability.courierId}:${input.revision}`,
      buttons: buildMenuButtons(input.availability),
    });
  }

  parseCourierAvailabilityAction(callbackData: string): CourierAvailabilityServiceIntent | null {
    return parseCourierAvailabilityCallbackData(callbackData);
  }
}
