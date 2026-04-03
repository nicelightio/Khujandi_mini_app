import { DeliveryAssignmentService } from "../application/delivery-assignment.service";
import type {
  AssignDeliveryOrderInput,
  DeliveryAssignmentCommandResult,
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

  assignCourier(input: AssignDeliveryOrderInput): Promise<DeliveryAssignmentCommandResult> {
    return this.service.assignCourier(input);
  }
}
