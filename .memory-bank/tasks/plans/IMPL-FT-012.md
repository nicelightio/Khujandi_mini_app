---
description: Implementation plan для FT-012 customer product selection и single-shop cart/order composition.
status: active
---
# IMPL-FT-012

## Goal

Доставить `FT-012` как `catalog`-owned customer composition flow: клиент выбирает продукты из public `WORKING` storefront, управляет single-shop cart/order draft, видит preview totals и может перейти к checkout только с валидным composition payload без создания заказа, резерва или payment side effect.

## Current state

- `FT-001`, `FT-010` и `FT-011` уже задают public storefront, immutable public paths, visibility `WORKING/NOT_WORKING` и DB-backed catalog runtime baseline.
- `FT-002` содержит checkout/payment semantics, но repo-local customer checkout runtime остается drift-prone без осмысленного upstream composition source.
- `FT-012` закрывает только customer selection/composition producer side; downstream server-side revalidation and paid order creation остаются в `FT-013`/`FT-002`.

## REQs

- `REQ-031`
- Supporting: `REQ-001`, `REQ-027`, `REQ-029`

## Source Artifacts

- [.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md](../../features/FT-012-customer-product-selection-and-cart-composition.md): feature acceptance, edge cases и verification targets.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../epics/EP-001-customer-ordering-experience.md): customer workflow boundary.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-031` RTM row.
- [.memory-bank/contracts/catalog-public-api.md](../../contracts/catalog-public-api.md): public storefront source of truth and visibility rules.
- [.memory-bank/contracts/customer-order-composition-contract.md](../../contracts/customer-order-composition-contract.md): composition payload and checkout handoff boundary.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../../architecture/frontend-presentation-and-webview.md): frontend state, shell and WebView UX boundaries.
- [.memory-bank/testing/index.md](../../testing/index.md): slice-based verification and anti-cheat rules.

## Normative Inputs

- Customer selection starts from canonical public catalog/storefront data owned by `catalog`.
- MVP cart is single-shop; selecting another shop requires explicit replace/clear behavior.
- Composition payload includes shop public routing identity, product identities, quantities, display snapshots and preview totals.
- Preview totals are not trusted order/payment facts; `checkout-payment` must revalidate later.
- `catalog` owns only the producer side of the handoff; `checkout-payment` owns downstream revalidation, auth/payment and paid order creation.
- No shared cart business module is introduced; the cross-slice shape is only the `customer-order-composition-contract.md` boundary artifact.

## Constraints

- Owning slice remains `catalog`; do not create a new cart slice or shared business module.
- Contour remains `mini-app`; do not reopen seller management, seller-web, admin-web or bot scope.
- No order creation, stock reservation, payment start, trusted amount calculation, or lifecycle event publication in `FT-012`.
- Technical `shop.id` may be internal payload data but must not become the customer-facing route identity.
- Persistent resume may store only non-sensitive composition state; session identifiers must not enter JS-readable storage.

## Invariants

- Empty cart and zero/negative quantities block checkout.
- Duplicate adds merge deterministically into one line item or another explicit deterministic behavior.
- `NOT_WORKING`/hidden/unavailable products cannot be selected for customer checkout handoff.
- Mixed-shop item sets are invalid in MVP.
- A changed unavailable shop/product after selection returns the customer to composition repair instead of silently continuing.

## Steps

1. Freeze docs/contract execution details for composition fields, producer/consumer ownership, storage/resume policy and testing gates. Completed by `TASK-FT012-01`.
2. Add slice-local cart/composition state and payload mapping around canonical storefront product data.
3. Wire customer storefront UI for add/update/remove actions, preview totals and checkout readiness.
4. Implement explicit single-shop replacement/clear behavior when a customer selects from another shop.
5. Produce the checkout handoff payload and route/action boundary without starting payment or creating an order.
6. Add unavailable/hidden/empty-cart repair feedback plus final e2e/contract verification and docs sync.

## Expected Touched Files

- `.protocols/FT-012/plan.md`
- `.protocols/FT-012/decision-log.md`
- `.memory-bank/tasks/plans/IMPL-FT-012.md`
- `.memory-bank/tasks/plans/index.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/index.md`
- `.memory-bank/changelog.md`
- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/requirements.md` when lifecycle advances during execution
- `frontend/src/slices/catalog/**/*`
- `frontend/src/tests/slices/catalog/**/*`
- `frontend/src/shared/ui/**/*` only for existing generic primitives, not cart business logic
- `tests/slices/catalog/**/*` only if backend/public payload contract coverage is needed

## Tests

- Docs-only boundary freeze for `TASK-FT012-01`: consistency check against `FT-012`, `EP-001`, `requirements.md`, `catalog-public-api.md`, and `customer-order-composition-contract.md`.
- Frontend unit/component tests for composition reducer/state transitions: add, merge duplicate, update quantity, remove, empty cart.
- Frontend route/page smoke for public storefront product selection and visible cart summary.
- E2E or high-level integration for single-shop replacement/clear behavior.
- Contract test for composition payload fields from `customer-order-composition-contract.md`.
- Negative tests for empty cart, invalid quantity, hidden/`NOT_WORKING` shop and unavailable product repair feedback.

## Quality Gates

- `npm run lint`
- focused catalog frontend tests
- `npm run test:catalog` if shared catalog test runner covers the touched frontend/backend surfaces
- `npm run build:frontend` if route wiring or app bootstrap changes

## UAT Steps

1. Open a public `WORKING` storefront through `/shops/:publicPath`.
2. Add a product, increment/decrement quantity, remove it, and confirm preview totals and checkout readiness update deterministically.
3. Add the same product twice and confirm line handling does not silently inflate duplicates.
4. Select a product from another shop and confirm explicit replace/clear behavior before the new shop becomes active.
5. Try checkout with an empty/invalid cart and confirm controlled feedback.
6. Continue to checkout with a valid composition and confirm the handoff payload includes public shop identity, product identities, quantities, display snapshots and preview totals without creating an order or starting payment.
