---
description: Verification notes for TASK-FT017-03 checkout-only debug/e2e affordance.
status: active
---
# TASK-FT017-03 Verification

## Verdict

- Result: `PASS`
- Date: `2026-05-11`
- Scope verified: checkout-only visible e2e/mock affordance backed by non-sensitive backend mock availability metadata.

## Boundary Check

- Owning slice: `checkout-payment`.
- Owning contour: `mini-app`.
- Touched layers verified: backend dev-runtime metadata endpoint, frontend checkout API/view-model/presentation, focused frontend/runtime tests.
- Shared extraction: not added and not justified.

## Criteria Evidence

- `GET /api/v1/orders/checkout/bootstrap` returns only `{ mockPaymentAvailable: boolean }`; it does not expose provider token, transaction id, session data, raw Telegram data or payment secrets.
- The checkout view model renders the affordance only in ready checkout state with a composition and `mockPaymentAvailable=true`.
- Direct/no-composition checkout renders the recovery state and suppresses the affordance even when backend metadata says mock is available.
- Checkout page renders the affordance as text only; the existing submit button remains the only payment action.
- Submit remains backend-driven through Telegram auth/session plus `POST /api/v1/orders/checkout`; no frontend trust path or client-only paid confirmation was added.
- Runtime coverage proves `DEBUG=true` without `PAYMENT_PROVIDER=mock` reports `mockPaymentAvailable=false`, returns `PAYMENT_PROVIDER_UNAVAILABLE` on checkout and creates no order.
- No catalog/cart UI exposure, broad shared abstraction, externally selectable failed/timeout/pending mock outcome, delivery lifecycle change or backend trust weakening was found.

## Commands

- `npx jest --config jest.config.cjs frontend/src/tests/slices/checkout-payment --runInBand` - PASS, 5 suites / 34 tests.
- `npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand` - PASS, 1 suite / 9 tests. Node printed the existing experimental SQLite warning; tests passed.
- `npm run build:frontend` - PASS.
- `git diff --check` - PASS.

## Inspected Implementation Points

- `backend/src/dev-runtime/routes/mini-app.routes.ts`: checkout bootstrap metadata endpoint and unchanged backend checkout trust path.
- `backend/src/dev-runtime/payment-provider-runtime.ts`: server-side `PAYMENT_PROVIDER=mock` guard and production refusal baseline.
- `frontend/src/slices/checkout-payment/api/checkout-payment-api.ts`: metadata fetch defaults to unavailable on failed/malformed metadata.
- `frontend/src/slices/checkout-payment/model/checkout-payment-view-model.ts`: affordance exists only in ready composition-backed state.
- `frontend/src/slices/checkout-payment/components/checkout-payment-page.tsx`: affordance is rendered as informational copy, not as a second button.
- `frontend/src/tests/slices/checkout-payment/*`: frontend visibility, no-composition and frontend-only debug negative coverage.
- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts`: backend mock availability and `DEBUG=true` negative coverage.

## Follow-Up

- No bug or follow-up is required for `TASK-FT017-03`.
- `TASK-FT017-04` can proceed with final e2e verification and docs sync for `FT-017`.
