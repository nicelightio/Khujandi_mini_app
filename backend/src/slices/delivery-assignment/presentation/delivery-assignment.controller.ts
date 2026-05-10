import { DeliveryAssignmentService } from "../application/delivery-assignment.service";
import type {
  AssignDeliveryOrderOverrideInput,
  ClaimDeliveryAssignmentOfferInput,
  CreateBroadcastDeliveryAssignmentOfferInput,
  CreateManualDeliveryAssignmentOfferInput,
  DeliveryAssignmentBroadcastOfferCommandResult,
  DeliveryAssignmentCommandResult,
  DeliveryAssignmentOfferCommandResult,
  DeliveryAssignmentOfferTimeoutEvaluationResult,
  DeliveryAssignmentOrderId,
  DeliveryAssignmentUserId,
} from "../domain/delivery-assignment.types";

export class DeliveryAssignmentController {
  constructor(private readonly service: DeliveryAssignmentService) {}

  getOrderById(orderId: DeliveryAssignmentOrderId) {
    return this.service.findOrderById(orderId);
  }

  getCourierById(courierId: DeliveryAssignmentUserId) {
    return this.service.findCourierById(courierId);
  }

  assignCourierOverride(input: AssignDeliveryOrderOverrideInput): Promise<DeliveryAssignmentCommandResult> {
    return this.service.assignCourierOverride(input);
  }

  claimOffer(input: ClaimDeliveryAssignmentOfferInput): Promise<DeliveryAssignmentCommandResult> {
    return this.service.claimOffer(input);
  }

  createManualOffer(
    input: CreateManualDeliveryAssignmentOfferInput,
  ): Promise<DeliveryAssignmentOfferCommandResult> {
    return this.service.createManualOffer(input);
  }

  createBroadcastOffers(
    input: CreateBroadcastDeliveryAssignmentOfferInput,
  ): Promise<DeliveryAssignmentBroadcastOfferCommandResult> {
    return this.service.createBroadcastOffers(input);
  }

  evaluateOfferTimeouts(now?: Date): Promise<DeliveryAssignmentOfferTimeoutEvaluationResult> {
    return this.service.evaluateOfferTimeouts(now);
  }
}
