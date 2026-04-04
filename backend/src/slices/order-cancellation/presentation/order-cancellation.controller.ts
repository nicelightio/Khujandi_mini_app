import type {
  AuthorizedOrderRefundUpdateInput,
  AuthorizedOrderCancellationInput,
  OrderCancellationOrderId,
  PersistOrderRefundUpdateInput,
} from "../domain/order-cancellation.types";
import { OrderCancellationService } from "../application/order-cancellation.service";

export class OrderCancellationController {
  constructor(private readonly service: OrderCancellationService) {}

  getOrderById(orderId: OrderCancellationOrderId) {
    return this.service.findOrderById(orderId);
  }

  cancelOrder(input: AuthorizedOrderCancellationInput) {
    return this.service.cancelOrder(input);
  }

  recordRefundUpdate(input: AuthorizedOrderRefundUpdateInput) {
    return this.service.recordRefundUpdate(input);
  }

  recordRefundUpdateBaseline(input: PersistOrderRefundUpdateInput) {
    return this.service.recordRefundUpdateBaseline(input);
  }
}
