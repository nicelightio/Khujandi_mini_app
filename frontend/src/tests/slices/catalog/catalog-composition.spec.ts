import {
  addCatalogCompositionItem,
  buildCustomerOrderCompositionPayload,
  createEmptyCatalogCompositionState,
  customerOrderCompositionHandoffStorageKey,
  persistCustomerOrderCompositionHandoff,
  removeCatalogCompositionItem,
  updateCatalogCompositionItemQuantity,
  type CatalogCompositionProduct,
  type CatalogCompositionShop,
} from "../../../slices/catalog/model/composition";

const shop: CatalogCompositionShop = {
  id: "shop-technical-1",
  publicPath: "khujand-bakery",
  name: "Khujand Bakery",
};

const somsa: CatalogCompositionProduct = {
  id: "product-1",
  shopId: "shop-technical-1",
  name: "Somsa",
  priceMinor: 1500,
};

const tea: CatalogCompositionProduct = {
  id: "product-2",
  shopId: "shop-technical-1",
  name: "Tea",
  priceMinor: 500,
};

describe("catalog customer composition", () => {
  it("starts with an empty slice-local cart composition", () => {
    const state = createEmptyCatalogCompositionState();

    expect(state).toEqual({
      shop: null,
      items: [],
      createdAt: null,
    });
    expect(buildCustomerOrderCompositionPayload(state)).toBeNull();
  });

  it("adds a public storefront product with a display snapshot", () => {
    const result = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      now: "2026-04-25T10:00:00.000Z",
    });

    expect(result).toEqual({
      status: "updated",
      state: {
        shop,
        createdAt: "2026-04-25T10:00:00.000Z",
        items: [
          {
            productId: "product-1",
            quantity: 1,
            displaySnapshot: {
              productName: "Somsa",
              unitPriceMinor: 1500,
              currency: "TJS",
            },
          },
        ],
      },
    });
  });

  it("merges duplicate adds into one deterministic line item", () => {
    const first = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      quantity: 2,
      now: "2026-04-25T10:00:00.000Z",
    });

    const second = addCatalogCompositionItem(first.state, {
      shop,
      product: somsa,
      quantity: 3,
      now: "2026-04-25T10:05:00.000Z",
    });

    expect(second.status).toBe("updated");
    expect(second.state.items).toHaveLength(1);
    expect(second.state.items[0]).toMatchObject({
      productId: "product-1",
      quantity: 5,
    });
    expect(second.state.createdAt).toBe("2026-04-25T10:00:00.000Z");
  });

  it("updates quantity and removes a line when quantity becomes invalid", () => {
    const withSomsa = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      now: "2026-04-25T10:00:00.000Z",
    }).state;
    const withTwoItems = addCatalogCompositionItem(withSomsa, { shop, product: tea }).state;

    const updated = updateCatalogCompositionItemQuantity(withTwoItems, "product-1", 4);
    const removed = updateCatalogCompositionItemQuantity(updated, "product-2", 0);

    expect(updated.items.find((item) => item.productId === "product-1")?.quantity).toBe(4);
    expect(removed.items).toEqual([
      expect.objectContaining({
        productId: "product-1",
        quantity: 4,
      }),
    ]);
    expect(removed.shop).toEqual(shop);
  });

  it("returns to empty state after removing the last item", () => {
    const state = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      now: "2026-04-25T10:00:00.000Z",
    }).state;

    expect(removeCatalogCompositionItem(state, "product-1")).toEqual(createEmptyCatalogCompositionState());
  });

  it("maps valid composition state to the checkout handoff contract shape", () => {
    const withSomsa = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      quantity: 2,
      now: "2026-04-25T10:00:00.000Z",
    }).state;
    const state = addCatalogCompositionItem(withSomsa, { shop, product: tea }).state;

    expect(buildCustomerOrderCompositionPayload(state, { compositionId: "draft-1" })).toEqual({
      composition_id: "draft-1",
      shop_public_path: "khujand-bakery",
      shop_id: "shop-technical-1",
      items: [
        {
          product_id: "product-1",
          quantity: 2,
          display_snapshot: {
            product_name: "Somsa",
            unit_price_minor: 1500,
            currency: "TJS",
          },
        },
        {
          product_id: "product-2",
          quantity: 1,
          display_snapshot: {
            product_name: "Tea",
            unit_price_minor: 500,
            currency: "TJS",
          },
        },
      ],
      preview_total: {
        amount_minor: 3500,
        currency: "TJS",
      },
      created_at: "2026-04-25T10:00:00.000Z",
    });
  });

  it("blocks empty and invalid-quantity states from producing checkout handoff payloads", () => {
    const withSomsa = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      now: "2026-04-25T10:00:00.000Z",
    }).state;

    expect(buildCustomerOrderCompositionPayload(createEmptyCatalogCompositionState())).toBeNull();
    expect(
      buildCustomerOrderCompositionPayload({
        ...withSomsa,
        items: [{ ...withSomsa.items[0], quantity: 0 }],
      }),
    ).toBeNull();
  });

  it("persists only the non-sensitive contract payload for checkout handoff", () => {
    const state = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      now: "2026-04-25T10:00:00.000Z",
    }).state;
    const payload = buildCustomerOrderCompositionPayload(state)!;
    const storage = {
      setItem: jest.fn(),
    };

    persistCustomerOrderCompositionHandoff(payload, storage);

    expect(storage.setItem).toHaveBeenCalledWith(
      customerOrderCompositionHandoffStorageKey,
      JSON.stringify(payload),
    );
    expect(storage.setItem.mock.calls[0][1]).toContain("shop_public_path");
    expect(storage.setItem.mock.calls[0][1]).not.toContain("initData");
    expect(storage.setItem.mock.calls[0][1]).not.toContain("payment");
  });

  it("blocks adding products from another shop until explicit replace or clear behavior exists", () => {
    const state = addCatalogCompositionItem(createEmptyCatalogCompositionState(), {
      shop,
      product: somsa,
      now: "2026-04-25T10:00:00.000Z",
    }).state;
    const requestedShop: CatalogCompositionShop = {
      id: "shop-technical-2",
      publicPath: "tea-corner",
      name: "Tea Corner",
    };

    const result = addCatalogCompositionItem(state, {
      shop: requestedShop,
      product: {
        id: "product-3",
        shopId: "shop-technical-2",
        name: "Green Tea",
        priceMinor: 700,
      },
    });

    expect(result).toEqual({
      status: "different-shop-blocked",
      state,
      requestedShop,
    });
  });
});
