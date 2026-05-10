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

const CALLBACK_PREFIX = "delivery-assignment-courier-availability";
const COURIER_MENU_TEXT = "Курьер";

const encodeSegment = (value: string): string => encodeURIComponent(value);

const decodeSegment = (value: string): string => decodeURIComponent(value);

export const buildCourierAvailabilityCallbackData = (
  intent: CourierAvailabilityServiceIntent,
): string => {
  const base = [CALLBACK_PREFIX, intent.type, encodeSegment(intent.courierId)];

  if (intent.type === "set_auto_offer") {
    base.push(intent.enabled ? "on" : "off");
  }

  return base.join(":");
};

export const parseCourierAvailabilityCallbackData = (
  value: string,
): CourierAvailabilityServiceIntent | null => {
  const [prefix, type, encodedCourierId, enabledValue, ...extra] = value.split(":");

  if (
    prefix !== CALLBACK_PREFIX ||
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

  if (type === "start_work") {
    return {
      type,
      courierId,
    };
  }

  if (type === "stop_after_5_minutes") {
    return {
      type,
      courierId,
    };
  }

  if (type === "set_auto_offer" && (enabledValue === "on" || enabledValue === "off")) {
    return {
      type,
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
