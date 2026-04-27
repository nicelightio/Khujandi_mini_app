---
description: Feature C4 L3 для выбора товаров клиентом и явного cart/order composition state перед checkout.
status: active
---
# FT-012 Customer Product Selection And Cart Composition

## REQs

- `REQ-031`
- `REQ-001`, `REQ-027`, `REQ-029`

## Ownership

- Owning slice: `catalog`.
- Contour: `mini-app`.
- Touched layers for future implementation: presentation + application read/composition state around existing catalog reads.
- Shared extraction is not justified: cart/order composition is a customer workflow state around `catalog` data, while the cross-slice handoff is expressed only as a contract.

## Execution boundary

- Producer side: `catalog` owns customer product selection, single-shop cart/order composition state, customer-visible preview totals and the handoff payload shape for `FT-012`.
- Consumer side: `checkout-payment` owns downstream composition revalidation, Telegram auth/payment flow, trusted amount calculation and paid order creation through `FT-013`/`FT-002`.
- Boundary artifact: [.memory-bank/contracts/customer-order-composition-contract.md](../contracts/customer-order-composition-contract.md) is the only cross-slice artifact; it does not create a shared cart business module.
- `FT-012` MUST NOT create an order, reserve stock, start payment, trust preview totals, publish order lifecycle events or implement checkout recovery semantics beyond producing a valid or blocked composition handoff.
- Any draft resume/persistence MAY store only non-sensitive composition data such as selected shop public path, product ids, quantities, display snapshots and timestamps; Mini App session identifiers and auth/payment secrets MUST NOT be stored in JS-readable persistence.

## Current implementation state

- Already closed repo-local capability: `FT-001` gives public browse for shops/products without auth.
- Already closed repo-local capability: `FT-010` and `FT-011` give canonical storefront routing, `WORKING/NOT_WORKING` visibility and DB-backed public storefront reads.
- Implemented repo-local capability: `frontend/src/slices/catalog/model/composition.ts` now holds slice-local customer composition state, deterministic duplicate merge/update/remove behavior, same-shop guarding and a mapper to the customer-order composition contract shape.
- Implemented repo-local capability: public storefront product cards now expose customer add/quantity controls and a customer-visible order draft summary with selected shop, line items, display snapshots, preview total and checkout readiness while preserving seller edit-mode affordances separately.
- Implemented repo-local capability: public storefront cart UI now keeps active cart contents when the customer moves to another shop and requires explicit replace or clear action before the new shop can own the single-shop composition.
- Implemented repo-local capability: public storefront checkout CTA now produces the contract-shaped non-sensitive composition payload, persists it only as checkout handoff draft data when using the default route action, and blocks empty or invalid-quantity handoff without starting payment, creating orders, reserving stock or publishing lifecycle events.
- Verified repo-local capability: same-shop unavailable product repair now blocks checkout handoff when a previously selected product is no longer present in the current public storefront, shows controlled customer feedback and keeps repair local to the cart summary.
- Missing for real customer workflow: catalog browse and checkout currently remain too separable; this feature makes product selection the only canonical source for the checkout composition draft.

## Use cases

- Клиент открывает `WORKING` storefront и выбирает товары из публичного каталога.
- Клиент добавляет товар в cart, меняет количество, удаляет line item и видит текущий состав заказа до checkout.
- Клиент начинает checkout только из осмысленного order composition draft, а не из изолированного route без выбранных товаров.

## Acceptance criteria

- Customer selection starts from canonical public catalog/storefront data owned by `catalog`.
- Cart/order composition state is explicit and customer-visible: selected shop, line items, quantities, item labels, preview prices, preview totals and checkout readiness are shown before payment.
- MVP cart is single-shop: selecting a product from another shop MUST require explicit replace/clear behavior before the new shop becomes the active composition source.
- Product selection MUST only use products from a currently public `WORKING` shop; `NOT_WORKING` shops are not selectable by customers.
- Composition payload MUST include enough data for checkout handoff: shop public routing identity, line item product identities, quantities, preview totals and display snapshots for customer confirmation.
- Preview prices and totals are not trusted payment/order creation facts; `checkout-payment` MUST revalidate catalog state before payment and paid order creation.
- Empty cart, zero/negative quantity, unavailable product and hidden shop states MUST block checkout with controlled customer feedback.
- Cart state MUST NOT create an order, reserve stock, trigger payment or publish order lifecycle events.

## Edge cases & failure modes

- Product becomes unavailable or the shop becomes `NOT_WORKING` after the customer added it to cart: checkout handoff must fail closed and return the customer to composition repair.
- Duplicate add actions should merge into the same line item or otherwise remain deterministic; silent duplicate line inflation is not acceptable.
- Browser refresh or Telegram WebView resume may preserve non-sensitive composition state, but session identifiers MUST NOT be stored in JS-readable persistent storage.

## Constraints / invariants

- `FT-012` does not own payment, Telegram auth, trusted provider confirmation or order persistence.
- `FT-012` does not reopen seller management or seller-web scope.
- Technical `shop.id` remains internal and MUST NOT become the customer-facing route identity; composition may carry internal IDs only as API payload data, not as public route identity.

## Normative inputs

- [.memory-bank/contracts/catalog-public-api.md](../contracts/catalog-public-api.md): public storefront reads, visibility and public routing identity.
- [.memory-bank/contracts/customer-order-composition-contract.md](../contracts/customer-order-composition-contract.md): cart/order composition payload and checkout handoff boundary.
- [.memory-bank/features/FT-001-catalog-browse-and-seller-management.md](FT-001-catalog-browse-and-seller-management.md): public catalog baseline.
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](FT-010-seller-storefront-editing-and-store-admin.md): storefront visibility and public routing behavior.
- [.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md](FT-011-db-backed-catalog-runtime-baseline.md): durable catalog runtime baseline.
- [.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md](FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md): downstream checkout handoff consumer.

## Verification targets

- Customer cart/order composition on public storefront.
- Single-shop cart behavior and explicit replace/clear path.
- Checkout CTA availability only when composition is valid.
- Contract conformance for the handoff payload without order/payment side effects.

## Test strategy pointers

- e2e: browse `WORKING` storefront -> add/update/remove products -> checkout CTA receives non-empty composition draft.
- e2e: selecting another shop requires explicit replace/clear behavior.
- integration/frontend: `NOT_WORKING` or unavailable catalog data blocks checkout handoff.
- contract: composition payload conforms to [.memory-bank/contracts/customer-order-composition-contract.md](../contracts/customer-order-composition-contract.md).
