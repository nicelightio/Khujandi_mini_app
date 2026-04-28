import { createHash } from "node:crypto";
import type { CheckoutPaymentCompositionDraft } from "../../slices/checkout-payment/domain/checkout-payment.types";

export const buildRuntimePaymentProviderTxId = (userId: string, composition: CheckoutPaymentCompositionDraft): string => {
  const source = JSON.stringify({
    userId,
    compositionId: composition.composition_id ?? null,
    shopPublicPath: composition.shop_public_path,
    items: composition.items,
    previewTotal: composition.preview_total,
  });
  const digest = createHash("sha256").update(source).digest("hex").slice(0, 24);

  return `local-runtime-checkout-${digest}`;
};
