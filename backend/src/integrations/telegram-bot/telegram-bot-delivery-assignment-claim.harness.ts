import type {
  ClaimDeliveryAssignmentOfferInput,
  DeliveryAssignmentCommandResult,
} from "../../slices/delivery-assignment/domain/delivery-assignment.types";

export type TelegramBotCourierClaimIntent = ClaimDeliveryAssignmentOfferInput;

export type TelegramBotCourierClaimButton = {
  label: string;
  callbackData: string;
};

export type TelegramBotCourierClaimPrompt = {
  text: string;
  buttons: TelegramBotCourierClaimButton[];
};

export interface TelegramBotCourierClaimServiceBoundary {
  claimOffer(input: ClaimDeliveryAssignmentOfferInput): Promise<DeliveryAssignmentCommandResult>;
}

const CLAIM_CALLBACK_PREFIX = "delivery-assignment-courier-claim";

const encodeSegment = (value: string): string => encodeURIComponent(value);

const decodeSegment = (value: string): string => decodeURIComponent(value);

export const buildCourierClaimCallbackData = (input: TelegramBotCourierClaimIntent): string =>
  [
    CLAIM_CALLBACK_PREFIX,
    encodeSegment(input.offerId),
    encodeSegment(input.courierId),
  ].join(":");

export const parseCourierClaimCallbackData = (
  value: string,
): TelegramBotCourierClaimIntent | null => {
  const [prefix, encodedOfferId, encodedCourierId, ...extra] = value.split(":");

  if (
    prefix !== CLAIM_CALLBACK_PREFIX ||
    extra.length > 0 ||
    typeof encodedOfferId !== "string" ||
    typeof encodedCourierId !== "string" ||
    encodedOfferId.length === 0 ||
    encodedCourierId.length === 0
  ) {
    return null;
  }

  const offerId = decodeSegment(encodedOfferId);
  const courierId = decodeSegment(encodedCourierId);

  if (offerId.length === 0 || courierId.length === 0) {
    return null;
  }

  return {
    offerId,
    courierId,
  };
};

export const executeCourierClaimIntent = (
  service: TelegramBotCourierClaimServiceBoundary,
  intent: TelegramBotCourierClaimIntent,
): Promise<DeliveryAssignmentCommandResult> => service.claimOffer(intent);

export class TelegramBotDeliveryAssignmentClaimHarness {
  buildClaimPrompt(input: TelegramBotCourierClaimIntent): TelegramBotCourierClaimPrompt {
    return {
      text: "пытаемся получить заказ...",
      buttons: [
        {
          label: "Принять заказ",
          callbackData: buildCourierClaimCallbackData(input),
        },
      ],
    };
  }

  parseCourierClaimAction(callbackData: string): TelegramBotCourierClaimIntent | null {
    return parseCourierClaimCallbackData(callbackData);
  }
}
