export type CatalogCompositionShop = {
  id: string;
  publicPath: string;
  name: string;
};

export type CatalogCompositionProduct = {
  id: string;
  shopId: string;
  name: string;
  priceMinor: number;
};

export type CatalogCompositionLineItem = {
  productId: string;
  quantity: number;
  displaySnapshot: {
    productName: string;
    unitPriceMinor: number;
    currency: "TJS";
  };
};

export type CatalogCompositionState = {
  shop: CatalogCompositionShop | null;
  items: CatalogCompositionLineItem[];
  createdAt: string | null;
};

export type CustomerOrderCompositionPayload = {
  composition_id?: string;
  shop_public_path: string;
  shop_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    display_snapshot: {
      product_name: string;
      unit_price_minor: number;
      currency: "TJS";
    };
  }>;
  preview_total: {
    amount_minor: number;
    currency: "TJS";
  };
  created_at: string;
};

export const customerOrderCompositionHandoffStorageKey = "khujandi.customer_order_composition";

export type AddCatalogCompositionItemResult =
  | {
      status: "updated";
      state: CatalogCompositionState;
    }
  | {
      status: "different-shop-blocked";
      state: CatalogCompositionState;
      requestedShop: CatalogCompositionShop;
    };

export const createEmptyCatalogCompositionState = (): CatalogCompositionState => ({
  shop: null,
  items: [],
  createdAt: null,
});

const isPositiveInteger = (value: number): boolean => Number.isInteger(value) && value > 0;

export const addCatalogCompositionItem = (
  state: CatalogCompositionState,
  input: {
    shop: CatalogCompositionShop;
    product: CatalogCompositionProduct;
    quantity?: number;
    now?: string;
  },
): AddCatalogCompositionItemResult => {
  const quantity = input.quantity ?? 1;

  if (!isPositiveInteger(quantity)) {
    return {
      status: "updated",
      state,
    };
  }

  if (state.shop !== null && state.shop.id !== input.shop.id) {
    return {
      status: "different-shop-blocked",
      state,
      requestedShop: input.shop,
    };
  }

  const existingItem = state.items.find((item) => item.productId === input.product.id);
  const nextItems = existingItem
    ? state.items.map((item) =>
        item.productId === input.product.id ? { ...item, quantity: item.quantity + quantity } : item,
      )
    : [
        ...state.items,
        {
          productId: input.product.id,
          quantity,
          displaySnapshot: {
            productName: input.product.name,
            unitPriceMinor: input.product.priceMinor,
            currency: "TJS" as const,
          },
        },
      ];

  return {
    status: "updated",
    state: {
      shop: input.shop,
      items: nextItems,
      createdAt: state.createdAt ?? input.now ?? new Date().toISOString(),
    },
  };
};

export const updateCatalogCompositionItemQuantity = (
  state: CatalogCompositionState,
  productId: string,
  quantity: number,
): CatalogCompositionState => {
  if (!isPositiveInteger(quantity)) {
    return removeCatalogCompositionItem(state, productId);
  }

  return {
    ...state,
    items: state.items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
  };
};

export const removeCatalogCompositionItem = (
  state: CatalogCompositionState,
  productId: string,
): CatalogCompositionState => {
  const nextItems = state.items.filter((item) => item.productId !== productId);

  if (nextItems.length === 0) {
    return createEmptyCatalogCompositionState();
  }

  return {
    ...state,
    items: nextItems,
  };
};

export const clearCatalogComposition = (): CatalogCompositionState => createEmptyCatalogCompositionState();

export const buildCustomerOrderCompositionPayload = (
  state: CatalogCompositionState,
  options: {
    compositionId?: string;
  } = {},
): CustomerOrderCompositionPayload | null => {
  if (state.shop === null || state.createdAt === null || state.items.length === 0) {
    return null;
  }

  if (state.items.some((item) => !isPositiveInteger(item.quantity))) {
    return null;
  }

  const previewTotalMinor = state.items.reduce(
    (total, item) => total + item.displaySnapshot.unitPriceMinor * item.quantity,
    0,
  );

  return {
    ...(options.compositionId === undefined ? {} : { composition_id: options.compositionId }),
    shop_public_path: state.shop.publicPath,
    shop_id: state.shop.id,
    items: state.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      display_snapshot: {
        product_name: item.displaySnapshot.productName,
        unit_price_minor: item.displaySnapshot.unitPriceMinor,
        currency: item.displaySnapshot.currency,
      },
    })),
    preview_total: {
      amount_minor: previewTotalMinor,
      currency: "TJS",
    },
    created_at: state.createdAt,
  };
};

export const persistCustomerOrderCompositionHandoff = (
  payload: CustomerOrderCompositionPayload,
  storage: Pick<Storage, "setItem">,
): void => {
  storage.setItem(customerOrderCompositionHandoffStorageKey, JSON.stringify(payload));
};
