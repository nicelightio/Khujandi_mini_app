import type {
  DeliveryAssignmentOperatorDelayedNotificationInput,
  DeliveryAssignmentOfferNotificationInput,
  DeliveryAssignmentOfferRepeatNotificationInput,
  DeliveryAssignmentNotificationInput,
  DeliveryAssignmentNotifier,
} from "../../slices/delivery-assignment/domain/delivery-assignment.types";

export type TelegramBotSendMessageInput = {
  chatId: string;
  text: string;
  dedupeKey: string;
};

export interface TelegramBotMessageDispatcher {
  sendMessage(input: TelegramBotSendMessageInput): Promise<void>;
}

const buildOrderAssignedMessage = (input: DeliveryAssignmentNotificationInput): string =>
  [
    `Order ${input.orderId} has been assigned to you.`,
    `Status: ${input.status}.`,
    `Courier: ${input.courierName}.`,
  ].join(" ");

const buildOfferCreatedMessage = (input: DeliveryAssignmentOfferNotificationInput): string =>
  [
    `Order ${input.orderId} is offered to you.`,
    `Current status: ${input.orderStatus}.`,
    `Courier: ${input.courierName}.`,
  ].join(" ");

const buildOfferRepeatedMessage = (input: DeliveryAssignmentOfferRepeatNotificationInput): string =>
  [
    `Reminder: order ${input.orderId} is still waiting for your claim.`,
    `Current status: ${input.orderStatus}.`,
    `Courier: ${input.courierName}.`,
  ].join(" ");

const buildAssignmentDelayedMessage = (input: DeliveryAssignmentOperatorDelayedNotificationInput): string =>
  [
    `Order ${input.orderId} needs courier attention.`,
    `Expired offers: ${input.expiredOfferCount}.`,
    "Status: DELAYED.",
  ].join(" ");

export class TelegramBotDeliveryAssignmentNotifier implements DeliveryAssignmentNotifier {
  constructor(private readonly dispatcher: TelegramBotMessageDispatcher) {}

  notifyCourierAssigned(input: DeliveryAssignmentNotificationInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.courierTelegramId,
      text: buildOrderAssignedMessage(input),
      dedupeKey: `order.assigned:${input.orderId}:${input.revision}`,
    });
  }

  notifyCourierOfferCreated(input: DeliveryAssignmentOfferNotificationInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.courierTelegramId,
      text: buildOfferCreatedMessage(input),
      dedupeKey: `order.offer_created:${input.offerId}:${input.revision}`,
    });
  }

  notifyCourierOfferRepeated(input: DeliveryAssignmentOfferRepeatNotificationInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.courierTelegramId,
      text: buildOfferRepeatedMessage(input),
      dedupeKey: `order.offer_repeated:${input.offerId}:${input.revision}`,
    });
  }

  async notifyOperatorsAssignmentDelayed(input: DeliveryAssignmentOperatorDelayedNotificationInput): Promise<void> {
    await Promise.all(
      [...new Set(input.operatorTelegramIds.filter((telegramId) => telegramId.length > 0))].map((telegramId) =>
        this.dispatcher.sendMessage({
          chatId: telegramId,
          text: buildAssignmentDelayedMessage(input),
          dedupeKey: `order.delayed:${input.orderId}:${input.revision}:${telegramId}`,
        }),
      ),
    );
  }
}
