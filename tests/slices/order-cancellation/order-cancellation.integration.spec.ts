import { registerOrderCancellationCases } from "./order-cancellation.cancel.cases";
import { registerOrderCancellationRefundCases } from "./order-cancellation.refund.cases";

describe("order-cancellation module integration", () => {
  registerOrderCancellationCases();
  registerOrderCancellationRefundCases();
});
