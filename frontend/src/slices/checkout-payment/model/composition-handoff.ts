import type { CustomerOrderCompositionPayload } from "../../catalog/model/composition";
import { customerOrderCompositionHandoffStorageKey } from "../../catalog/model/composition";

export type CheckoutCompositionHandoff = CustomerOrderCompositionPayload;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isPositiveInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isTjsCurrency = (value: unknown): value is "TJS" => value === "TJS";

export const parseCheckoutCompositionHandoff = (
  value: unknown,
): CheckoutCompositionHandoff | null => {
  if (!isRecord(value)) {
    return null;
  }

  const items = value.items;
  const previewTotal = value.preview_total;

  if (
    typeof value.shop_public_path !== "string" ||
    value.shop_public_path.trim().length === 0 ||
    typeof value.shop_id !== "string" ||
    value.shop_id.trim().length === 0 ||
    typeof value.created_at !== "string" ||
    value.created_at.trim().length === 0 ||
    !Array.isArray(items) ||
    items.length === 0 ||
    !isRecord(previewTotal) ||
    typeof previewTotal.amount_minor !== "number" ||
    !isTjsCurrency(previewTotal.currency)
  ) {
    return null;
  }

  const parsedItems: CheckoutCompositionHandoff["items"] = [];

  for (const item of items) {
    if (!isRecord(item) || !isRecord(item.display_snapshot)) {
      return null;
    }

    if (
      typeof item.product_id !== "string" ||
      item.product_id.trim().length === 0 ||
      !isPositiveInteger(item.quantity) ||
      typeof item.display_snapshot.product_name !== "string" ||
      item.display_snapshot.product_name.trim().length === 0 ||
      typeof item.display_snapshot.unit_price_minor !== "number" ||
      !isTjsCurrency(item.display_snapshot.currency)
    ) {
      return null;
    }

    parsedItems.push({
      product_id: item.product_id,
      quantity: item.quantity,
      display_snapshot: {
        product_name: item.display_snapshot.product_name,
        unit_price_minor: item.display_snapshot.unit_price_minor,
        currency: item.display_snapshot.currency,
      },
    });
  }

  return {
    ...(typeof value.composition_id === "string" && value.composition_id.trim().length > 0
      ? { composition_id: value.composition_id }
      : {}),
    shop_public_path: value.shop_public_path,
    shop_id: value.shop_id,
    items: parsedItems,
    preview_total: {
      amount_minor: previewTotal.amount_minor,
      currency: previewTotal.currency,
    },
    created_at: value.created_at,
  };
};

export const readCheckoutCompositionHandoff = (
  storage: Pick<Storage, "getItem"> | null | undefined,
): CheckoutCompositionHandoff | null => {
  if (storage === null || storage === undefined) {
    return null;
  }

  const rawValue = storage.getItem(customerOrderCompositionHandoffStorageKey);

  if (rawValue === null) {
    return null;
  }

  try {
    return parseCheckoutCompositionHandoff(JSON.parse(rawValue));
  } catch {
    return null;
  }
};

export const clearCheckoutCompositionHandoff = (
  storage: Pick<Storage, "removeItem"> | null | undefined,
): void => {
  storage?.removeItem(customerOrderCompositionHandoffStorageKey);
};
