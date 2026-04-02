import type {
  AuthenticateTelegramInput,
  AuthenticateTelegramResult,
  SyncCheckoutPaymentLanguagePreferenceInput,
  FinalizeCheckoutPaymentInput,
  CheckoutPaymentOrderRecord,
  CheckoutPaymentProviderTxId,
  CreateCheckoutPaymentOrderInput,
} from "../domain/checkout-payment.types";
import { CheckoutPaymentService } from "../application/checkout-payment.service";

export class CheckoutPaymentController {
  constructor(private readonly service: CheckoutPaymentService) {}

  getOrderByPaymentProviderTxId(
    paymentProviderTxId: CheckoutPaymentProviderTxId,
  ): Promise<CheckoutPaymentOrderRecord | null> {
    return this.service.findOrderByPaymentProviderTxId(paymentProviderTxId);
  }

  createPaidOrder(input: CreateCheckoutPaymentOrderInput): Promise<CheckoutPaymentOrderRecord> {
    return this.service.createPaidOrder(input);
  }

  checkoutOrder(input: FinalizeCheckoutPaymentInput): Promise<CheckoutPaymentOrderRecord> {
    return this.service.checkoutOrder(input);
  }

  authenticateTelegram(input: AuthenticateTelegramInput): Promise<AuthenticateTelegramResult> {
    return this.service.authenticateTelegram(input);
  }

  syncLanguagePreference(input: SyncCheckoutPaymentLanguagePreferenceInput) {
    return this.service.syncLanguagePreference(input);
  }
}
