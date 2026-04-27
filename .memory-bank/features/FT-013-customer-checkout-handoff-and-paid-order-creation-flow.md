---
description: Feature C4 L3 для customer-facing handoff из cart/order composition в checkout и создания заказа после успешной оплаты.
status: active
---
# FT-013 Customer Checkout Handoff And Paid Order Creation Flow

## REQs

- `REQ-032`
- `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`, `REQ-022`, `REQ-023`

## Ownership

- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Touched layers for future implementation: presentation + application integration around existing auth/payment/order creation boundary.
- Shared extraction is not justified: the route and orchestration belong to `checkout-payment`; the only cross-slice shape is the order composition handoff contract.

## Execution boundary

- Producer side: `catalog` owns customer product selection, single-shop composition state and handoff payload production through `FT-012`.
- Consumer side: `checkout-payment` owns checkout route entry, composition consumption, server-side catalog revalidation, Mini App auth/session usage, payment start/finalization and paid order creation through this feature plus the existing `FT-002` boundary.
- Payment trust source: `FT-002` remains the normative owner of raw `initData` validation, replay protection, session transport, provider/source verification, idempotency and paid-only order creation semantics.
- Downstream status handoff: successful paid order creation must return only customer-safe order identity plus `updated_at`/string `revision` or equivalent cursor metadata needed by `FT-014`; delivery assignment/tracking transitions remain outside this feature.
- Boundary artifacts: [.memory-bank/contracts/customer-order-composition-contract.md](../contracts/customer-order-composition-contract.md), [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md), [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md) and [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md) define the cross-boundary shapes; they do not create a shared cart/payment business module.

## Current implementation state

- Already implemented repo-local capability: `FT-002` backend/domain coverage for Telegram auth validation, trusted payment confirmation, paid-only order creation and retry-safe failures.
- Already implemented repo-local capability: `FT-009` shell/runtime primitives for customer-facing checkout UI, with remaining hardening evidence tracked in that feature.
- Implemented repo-local capability: the checked-in customer-facing checkout/auth runtime now reaches mounted Mini App auth, language sync and checkout submit endpoints instead of local stubs.
- Implemented repo-local capability: `TASK-FT013-02` makes the checkout route consume the `FT-012` non-sensitive composition handoff draft, render selected shop/line items/quantities/snapshots/preview total for customer confirmation, and recover direct or invalid `/checkout` entry to catalog/cart instead of fabricating route-local order data.
- Implemented repo-local capability: `TASK-FT013-03` adds a backend `checkout-payment` composition revalidation seam that consumes an explicit catalog read boundary, blocks hidden shops, missing/unavailable products, invalid quantities, price drift and currency drift with controlled repair responses before order persistence, and keeps preview totals/display snapshots untrusted.
- Implemented repo-local capability: `TASK-FT013-04` rewires the checked-in checkout frontend API from stubbed success responses to mounted `/api/v1/auth/telegram`, `/api/v1/auth/telegram/language` and `/api/v1/orders/checkout` runtime routes; checkout submit now requires the real HttpOnly Mini App session.
- Implemented repo-local capability: `TASK-FT013-05` mounts paid `CREATED` order persistence on `/api/v1/orders/checkout`: the runtime reuses the existing `checkout-payment` trusted payment boundary, revalidates composition against current catalog state, persists one `CREATED` paid order and returns customer-safe `orderId`, `updated_at` and string `revision` metadata after commit.
- Implemented repo-local capability: `TASK-FT013-06` hardens failed, canceled, timeout and ambiguous provider outcomes with retry-safe no-order responses, keeps stale/malformed composition repair explicit, and reuses existing paid orders for duplicate trusted confirmations before stale revalidation.
- Repo-local final gates passed in `TASK-FT013-07`: focused backend/runtime/frontend checkout-payment suites cover composition-backed checkout, mounted Mini App auth/payment runtime, paid-only `CREATED` order metadata, retry-safe no-order failures, stale repair and duplicate trusted payment idempotency.
- Missing for formal feature closure: fresh real `Android Telegram` evidence for the post-`FT-013` customer checkout flow remains with `TASK-FT013-08`; `TASK-FT013-07` is failed as a quality-gate closure until that evidence exists.
- Downstream status repair complete: `TASK-FT014-07` changed the checked-in checkout success handoff to return the current event-stream cursor instead of `order.id`, so `FT-014` can seed `GET /api/v1/events?since=<cursor>` without cursor/parser drift. `REQ-032` remains `planned` until external Android evidence is collected.

## Use cases

- Клиент нажимает checkout из cart/order composition и видит подтверждение состава заказа.
- Backend валидирует Telegram Mini App auth, revalidates catalog composition, starts/continues payment and creates an order only after trusted successful payment.
- После successful payment клиент получает created order identity and status entry point for tracking.

## Acceptance criteria

- Checkout entry MUST require a valid `FT-012` order composition draft; direct `/checkout` access without a valid draft MUST show controlled recovery to catalog/cart rather than a fake order.
- Handoff payload MUST preserve selected shop, line items, quantities and customer-visible snapshots for confirmation.
- `checkout-payment` MUST revalidate the composition against current `catalog` state before payment finalization: shop visibility, product existence, quantities, price/currency and checkout eligibility.
- Telegram auth/session transport remains the `FT-002` boundary: raw `initData` is validated server-side, replay is blocked and session identifiers are not stored in JS-readable persistent storage.
- Payment success remains trusted only after server-side provider confirmation per `FT-002` and [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md).
- Order creation MUST happen only after trusted paid confirmation and MUST create an order in `CREATED` state with item/shop/customer snapshots derived from the revalidated composition.
- Payment failure, timeout, canceled flow or invalid composition MUST NOT create an order and MUST keep retry/repair UX explicit.
- Successful paid order creation MUST expose an order identity and polling cursor/revision information sufficient for `FT-014` customer status visibility.
- The feature MUST not move payment trust, provider callback verification or order persistence semantics out of `FT-002`; it closes the mounted customer workflow around those existing boundaries.
- The feature MUST not introduce a shared cart, shared checkout orchestration or shared payment business module; any reusable code must stay limited to existing technical primitives and explicit contracts.

## Edge cases & failure modes

- Customer opens checkout after cart data is stale: show repair path and do not start payment with stale totals.
- Customer reloads or Telegram WebView resumes during payment: duplicate submit and duplicate provider callback MUST remain idempotent and must not create two orders.
- Unsupported Telegram launch mode with missing `initData` must fail through controlled auth recovery, not anonymous order creation.

## Constraints / invariants

- No order without trusted successful payment.
- Client-only payment UX events are never trusted order creation signals.
- `FT-013` does not own catalog browse, cart composition, delivery assignment or courier status transitions.
- `FT-013` must use shell/runtime affordances from `FT-009` without moving auth/payment logic into shared shell code.

## Normative inputs

- [.memory-bank/features/FT-002-checkout-payment-and-order-creation.md](FT-002-checkout-payment-and-order-creation.md): auth/payment/order creation ownership and existing implementation boundary.
- [.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md](FT-012-customer-product-selection-and-cart-composition.md): upstream composition producer.
- [.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md](FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md): downstream customer status visibility.
- [.memory-bank/contracts/customer-order-composition-contract.md](../contracts/customer-order-composition-contract.md): checkout handoff payload.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): Telegram auth boundary.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment confirmation.
- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): event/polling metadata baseline.
- [.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md](FT-009-mini-app-shell-and-webview-ux.md): Telegram WebView shell/runtime boundary.

## Verification targets

- Catalog/cart -> checkout handoff.
- Mounted Mini App auth/payment checkout runtime.
- Paid-only order creation and retry-safe failure path from the real customer UI.

## Test strategy pointers

- e2e: select products -> checkout -> successful payment -> order `CREATED` with expected snapshots.
- e2e: direct checkout without composition returns controlled recovery to catalog/cart.
- integration: stale composition, hidden shop, price drift and unavailable product block order creation.
- integration: duplicate payment callbacks/submits create at most one order.
- verify: Telegram-sensitive checkout runtime evidence follows `REQ-023` and `FT-009` shell verification policy.
- current blocker: `.memory-bank/bugs/BUG-2026-04-26-task-ft013-07-missing-android-checkout-evidence.md` tracks the missing Android Telegram checkout evidence.
- downstream blocker: `.memory-bank/bugs/BUG-2026-04-27-ft014-events-runtime-and-cursor-drift.md` tracks the mounted `/api/v1/events` and checkout/status cursor drift for `FT-014`.
