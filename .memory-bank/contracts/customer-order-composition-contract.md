---
description: Контракт customer cart/order composition payload между catalog selection и checkout-payment handoff.
status: active
---
# Customer Order Composition Contract

## Purpose

- Freeze the meaningful payload that moves the customer from `catalog` selection into `checkout-payment`.
- Prevent `/checkout` from becoming an isolated route with fake or route-local order data.

## Owner and boundary

- Producing slice: `catalog` via `FT-012` customer product selection and cart/order composition.
- Consuming slice: `checkout-payment` via `FT-013` checkout handoff and paid order creation.
- Contour: `mini-app`.
- This contract is a boundary artifact only; it does not justify a shared business-logic module.
- Producer responsibility ends at a valid/blocked handoff draft. Revalidation, payment start, trusted payment confirmation and order creation are consuming-slice responsibilities.
- Consumer responsibility starts by accepting only this contract-shaped draft or recovering to catalog/cart; it must not fabricate a route-local order, trust preview totals, or bypass the `FT-002` auth/payment boundary.

## Composition draft semantics

- MVP composition is single-shop.
- A draft represents customer intent before payment; it is not an order, stock reservation or trusted payment amount.
- Draft preview totals are customer-facing confirmation data only; checkout must revalidate against current server-side catalog state.

## Minimum payload fields

- `composition_id`: opaque draft identifier when persistence/resume is used; optional for purely route-local drafts.
- `shop_public_path`: customer-facing public routing identity used to recover storefront context.
- `shop_id`: internal technical identifier MAY be carried as API payload data, but MUST NOT be used as customer-facing route identity.
- `items[]`: selected line items.
- `items[].product_id`: internal product identity from the catalog API.
- `items[].quantity`: positive integer quantity.
- `items[].display_snapshot`: customer confirmation snapshot containing at least product name, unit price and currency as shown at selection time.
- `preview_total`: sum shown to the customer before authoritative checkout revalidation.
- `created_at` or equivalent draft timestamp when the draft can survive navigation/resume.

Field names above are normative at the contract boundary. Slice-internal frontend state MAY use idiomatic TypeScript naming, but the handoff mapper MUST produce this contract shape before checkout consumes it unless this contract is deliberately updated first.

## Storage and resume policy

- Composition draft persistence is optional for `FT-012`; route-local in-memory state is valid when UX recovery is controlled.
- If a draft survives navigation, refresh or Telegram WebView resume, it MUST store only non-sensitive composition data: selected public shop path, internal catalog item ids, quantities, display snapshots, preview totals and timestamps.
- Session identifiers, raw `initData`, payment identifiers/secrets and trusted auth decisions MUST NOT be stored in JS-readable persistence as part of this draft.
- Resumed drafts remain untrusted customer intent and MUST be revalidated by `checkout-payment` before payment/order creation.

## Validation rules

- Empty `items[]` is invalid for checkout.
- Mixed-shop item sets are invalid in MVP.
- Quantity must be a positive integer within the current product/order limits defined by the owning slice.
- `checkout-payment` must revalidate shop visibility, product existence, price/currency and composition eligibility before payment finalization.
- If revalidation changes any customer-visible payment fact, the flow must return a repair/confirmation step instead of silently charging a different amount.
- Direct checkout without a non-empty valid draft must use controlled recovery to the storefront/cart context instead of starting payment.

## Forbidden

- Creating orders from client-only preview totals.
- Trusting stale display snapshots as authoritative payment/order data.
- Starting payment from an empty or synthetic composition.
- Exposing technical `shop.id` as the public storefront route.
- Publishing order lifecycle events or reserving stock from `FT-012` composition state.

## Related docs

- [.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md](../features/FT-012-customer-product-selection-and-cart-composition.md): upstream cart/order composition feature.
- [.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md](../features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md): downstream checkout/payment feature.
- [.memory-bank/contracts/catalog-public-api.md](catalog-public-api.md): public catalog visibility and storefront routing identity.
- [.memory-bank/contracts/payment-confirmation-contract.md](payment-confirmation-contract.md): trusted payment confirmation boundary.
