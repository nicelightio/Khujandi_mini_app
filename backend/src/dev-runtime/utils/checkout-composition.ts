import { AppError } from "../../shared/errors/app-error";
import type { CheckoutPaymentCompositionDraft } from "../../slices/checkout-payment/domain/checkout-payment.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const toCheckoutPaymentCompositionDraft = (value: unknown): CheckoutPaymentCompositionDraft => {
  if (!isRecord(value)) {
    throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Checkout composition is required", 409, {
      reason: "composition_missing",
      repairAction: "repair_composition",
      orderCreated: false,
    });
  }

  const items = value.items;
  const previewTotal = value.preview_total;

  if (
    typeof value.shop_public_path !== "string" ||
    value.shop_public_path.trim().length === 0 ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !isRecord(previewTotal) ||
    typeof previewTotal.amount_minor !== "number" ||
    typeof previewTotal.currency !== "string"
  ) {
    throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Checkout composition is invalid", 409, {
      reason: "composition_invalid",
      repairAction: "repair_composition",
      orderCreated: false,
    });
  }

  for (const item of items) {
    const quantity = isRecord(item) ? item.quantity : undefined;

    if (
      !isRecord(item) ||
      typeof item.product_id !== "string" ||
      item.product_id.trim().length === 0 ||
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !isRecord(item.display_snapshot) ||
      typeof item.display_snapshot.product_name !== "string" ||
      typeof item.display_snapshot.unit_price_minor !== "number" ||
      typeof item.display_snapshot.currency !== "string"
    ) {
      throw new AppError("COMPOSITION_REPAIR_REQUIRED", "Checkout composition is invalid", 409, {
        reason: "composition_invalid",
        repairAction: "repair_composition",
        orderCreated: false,
      });
    }
  }

  return value as CheckoutPaymentCompositionDraft;
};
