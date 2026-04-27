---
description: Implementation plan for FT-013 customer checkout handoff and paid order creation flow.
status: active
---
# IMPL-FT-013 Customer Checkout Handoff And Paid Order Creation Flow

## Goals

- Connect the `FT-012` cart/order composition draft to the real `checkout-payment` runtime.
- Require valid composition for customer checkout entry; direct `/checkout` access without composition must recover to catalog/cart instead of fabricating order data.
- Revalidate current catalog state server-side before trusted payment/order creation.
- Create order `CREATED` only after trusted successful payment, with snapshots derived from the revalidated composition.
- Return order identity plus revision/cursor metadata sufficient for `FT-014` customer status visibility.

## Source Artifacts

- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/requirements.md`
- `doc/ARCHITECTURE.md`

## Normative Inputs

- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`

## Ownership And Boundaries

- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Touched layers: presentation and application integration; domain/payment trust semantics remain those already owned by `FT-002`.
- `catalog` remains the producer of composition state; `checkout-payment` consumes and revalidates it.
- Shared extraction is not justified; only the composition payload contract crosses the slice boundary.

## Boundary Freeze Result

- `TASK-FT013-01` freezes this plan as a docs-first boundary task: no product code, runtime wiring, provider behavior, order persistence or event publication belongs to the first step.
- `TASK-FT013-02` may change checkout presentation only after preserving the rule that checkout starts from a valid `customer-order-composition-contract.md` draft or recovers to catalog/cart.
- `TASK-FT013-03` may add server-side catalog revalidation, but it must call through an explicit catalog read/revalidation boundary rather than moving catalog ownership into `checkout-payment` or `shared`.
- `TASK-FT013-04` may mount the real Mini App auth/payment runtime, but raw `initData`, session transport and provider trust rules stay on the existing `FT-002` boundary.
- `TASK-FT013-05` may persist paid `CREATED` orders only from a server-revalidated composition plus trusted payment success, and must return the order identity/revision metadata needed by `FT-014` after commit.
- `TASK-FT013-06` owns stale composition, retry and idempotency hardening without trusting client-only payment UX events.

## Steps

1. Freeze the execution boundary and route/runtime contract for customer checkout handoff.
2. Replace fake or isolated checkout route data with a composition-required entry and controlled recovery path.
3. Add server-side composition revalidation against canonical catalog state before payment start/finalization.
4. Wire mounted auth/payment runtime so the real Mini App checkout uses `FT-002` session/payment boundaries.
5. Persist paid orders from revalidated composition snapshots and publish customer-observable creation metadata after commit.
6. Harden failure, stale composition, duplicate submit and duplicate provider callback paths.
7. Run final repo-local gates plus Telegram-sensitive verification evidence, then update RTM/docs.

## Expected Touched Files

- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-013.md`
- `.memory-bank/tasks/plans/index.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/requirements.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/changelog.md`
- `.memory-bank/index.md`
- `frontend/src/slices/checkout-payment/**/*`
- `frontend/src/slices/catalog/**/*` only for consuming the existing handoff output if needed
- `frontend/src/tests/slices/checkout-payment/**/*`
- `backend/src/slices/checkout-payment/**/*`
- `backend/src/slices/catalog/**/*` only through explicit read/revalidation contract calls if needed
- `backend/src/dev-runtime/**/*` if the mounted customer runtime needs wiring
- `tests/slices/checkout-payment/**/*`

## Tests

- Frontend route/page smoke: valid composition reaches checkout confirmation; missing composition shows recovery to catalog/cart.
- Backend integration: stale composition, hidden shop, unavailable product, price/currency drift and invalid quantity block payment/order creation.
- Backend integration: trusted payment success creates exactly one `CREATED` order with snapshots from revalidated composition.
- Backend integration: failed/canceled/timeout payment creates no order and preserves retry/repair UX.
- Idempotency coverage: duplicate submit and duplicate provider callback create at most one order.
- E2E/customer flow: select products -> checkout -> successful payment -> order `CREATED` with order identity and polling metadata.

## Quality Gates

- `lint` / `typecheck` for touched frontend/backend packages.
- Focused unit/integration suites for `checkout-payment` and relevant catalog handoff tests.
- Critical customer-flow e2e or route smoke for Mini App checkout.
- Telegram-sensitive verify evidence per `REQ-023` and `.memory-bank/runbooks/telegram-mini-app-verification.md`.
- Docs consistency check from `TASK-FT013-01` is the gate for starting implementation tasks; product tests begin with `TASK-FT013-02`.

## UAT Steps

1. Open a public `WORKING` storefront, add products to cart and proceed to checkout.
2. Confirm selected shop, line items, quantities, display snapshots and preview totals are shown before payment.
3. Complete successful payment and verify the resulting order starts in `CREATED` with visible identity/status entry point.
4. Reload/direct-open `/checkout` without composition and verify controlled recovery instead of fake order data.
5. Change catalog state after composition and verify checkout asks for repair/reconfirmation without charging stale totals.
6. Simulate failed/canceled payment and verify no order is created.

## Verification Targets

- Catalog/cart -> checkout handoff.
- Mounted Mini App auth/payment checkout runtime.
- Paid-only order creation and retry-safe failure path from the real customer UI.
- Downstream `FT-014` readiness through order identity and polling revision/cursor metadata.
