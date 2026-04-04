import type {
  DeliveryTrackingNotificationInput,
  DeliveryTrackingNotifier,
} from "../../slices/delivery-tracking/domain/delivery-tracking.types";
import { TelegramBotDeliveryTrackingHarness } from "./telegram-bot-delivery-tracking.harness";

export class TelegramBotDeliveryTrackingNotifier implements DeliveryTrackingNotifier {
  constructor(private readonly harness: TelegramBotDeliveryTrackingHarness) {}

  notifyStatusChanged(input: DeliveryTrackingNotificationInput): Promise<void> {
    return this.harness.notifyCourierStatusActions({
      courierTelegramId: input.courierTelegramId,
      orderId: input.orderId,
      currentStatus: input.status,
      revision: input.revision,
      availableActions: input.availableActions,
    });
  }
}
