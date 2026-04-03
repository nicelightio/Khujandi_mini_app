import type {
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

export class TelegramBotDeliveryAssignmentNotifier implements DeliveryAssignmentNotifier {
  constructor(private readonly dispatcher: TelegramBotMessageDispatcher) {}

  notifyCourierAssigned(input: DeliveryAssignmentNotificationInput): Promise<void> {
    return this.dispatcher.sendMessage({
      chatId: input.courierTelegramId,
      text: buildOrderAssignedMessage(input),
      dedupeKey: `order.assigned:${input.orderId}:${input.revision}`,
    });
  }
}
