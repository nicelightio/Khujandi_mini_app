import { DeliveryTrackingService } from "../application/delivery-tracking.service";
import type {
  DeliveryTrackingCommandResult,
  DeliveryTrackingCursor,
  DeliveryTrackingOrderId,
  DeliveryTrackingEventStream,
  DeliveryTrackingStatusCommandInput,
} from "../domain/delivery-tracking.types";

export class DeliveryTrackingController {
  constructor(private readonly service: DeliveryTrackingService) {}

  getOrderById(orderId: DeliveryTrackingOrderId) {
    return this.service.findOrderById(orderId);
  }

  getEventsSince(cursor?: DeliveryTrackingCursor): Promise<DeliveryTrackingEventStream> {
    return this.service.getEventsSince(cursor);
  }

  recordStatusTransition(
    input: DeliveryTrackingStatusCommandInput,
  ): Promise<DeliveryTrackingCommandResult> {
    return this.service.recordStatusTransition(input);
  }

  recordOperatorStatusTransition(
    input: DeliveryTrackingStatusCommandInput,
  ): Promise<DeliveryTrackingCommandResult> {
    return this.service.recordOperatorStatusTransition(input);
  }
}
