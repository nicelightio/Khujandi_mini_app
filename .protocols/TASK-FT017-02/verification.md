---
description: Verification notes for TASK-FT017-02 mounted checkout mock success integration.
status: active
---
# TASK-FT017-02 Verification

## Verdict

- Result: `PASS`
- Date: `2026-05-11`
- Scope verified: mounted `/api/v1/orders/checkout` mock success integration for `PAYMENT_PROVIDER=mock`.

## Boundary Check

- Owning slice: `checkout-payment`.
- Owning contour: `mini-app`.
- Touched layers verified: backend dev-runtime route/config, checkout-payment application/payment finalization seam, focused runtime tests.
- Shared extraction: not added and not justified.

## Criteria Evidence

- Explicit server-side `PAYMENT_PROVIDER=mock` plus `NODE_ENV !== "production"` remains the only mock provider gate; production-like runtime rejects mock during provider resolution/startup.
- Mounted checkout with valid Mini App cookie session and valid `FT-012` composition routes mock `PAID` through server-side composition revalidation and the existing `checkoutOrder` payment finalization seam.
- Happy path creates exactly one paid `CREATED` order with `paymentProvider=mock`; duplicate submit returns the same `orderId` and preserves a single order.
- Response returns customer-safe `orderId`, `updated_at` and string `revision` from the event cursor source, and the regression asserts `revision !== orderId`.
- Anonymous/missing session checkout returns `AUTH_REQUIRED` with no order.
- Direct checkout without composition returns `COMPOSITION_REPAIR_REQUIRED` with `orderCreated=false` and no order.
- Stale price composition is rejected by server-side revalidation with `COMPOSITION_REPAIR_REQUIRED`, `reason=price_changed`, `orderCreated=false` and no order.
- `DEBUG=true` without explicit mock provider returns `PAYMENT_PROVIDER_UNAVAILABLE` and creates no trusted payment confirmation or order.
- No frontend UI affordance was added in this task; no frontend files are modified in the current diff.
- No externally selectable failed/timeout/pending mock outcomes, catalog/cart ownership changes, delivery lifecycle changes or shared payment abstraction were found.

## Commands

- `npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand` - PASS, 1 suite / 9 tests.
- `npx jest --config jest.config.cjs tests/slices/checkout-payment --runInBand` - PASS, 8 suites / 76 tests.
- `git diff --check` - PASS.

## Inspected Implementation Points

- `backend/src/dev-runtime/payment-provider-runtime.ts`: explicit mock provider resolver, disabled-by-default provider state, production refusal, unavailable error.
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`: runtime config wires `PAYMENT_PROVIDER` and `NODE_ENV` into the guarded provider resolver.
- `backend/src/dev-runtime/routes/mini-app.routes.ts`: mounted checkout requires Mini App session, refuses disabled provider, parses composition, calls checkout finalization with guarded mock provider metadata, and returns customer-safe cursor metadata.
- `backend/src/slices/checkout-payment/application/checkout-payment.service.ts`: trusted payment assertion, duplicate payment idempotency and server-side composition revalidation before paid order creation.
- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts`: mounted happy path, idempotency, no-auth, direct checkout, stale composition, production refusal and `DEBUG=true` negative coverage.

## Follow-Up

- No bug or follow-up is required for `TASK-FT017-02`.
- `TASK-FT017-03` can proceed with checkout-only debug/e2e affordance work.
