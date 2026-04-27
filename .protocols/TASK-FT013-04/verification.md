---
description: Verification evidence for TASK-FT013-04.
status: active
---
# TASK-FT013-04 Verification

## Status
- VERDICT: PASS for repo-local `TASK-FT013-04` scope.

## Target evidence
- Runtime/integration coverage for mounted `POST /auth/telegram` session transport.
- Runtime/frontend coverage that checkout/payment endpoints are not stub-only on customer-facing runtime.
- Missing/invalid auth uses controlled recovery and creates no anonymous order.

## Acceptance / REQ checks
- `FT-013` mounted Mini App auth/payment checkout runtime: PASS. `frontend/src/slices/checkout-payment/api/checkout-payment-api.ts` calls `/api/v1/auth/telegram`, `/api/v1/auth/telegram/language` and `/api/v1/orders/checkout` with `credentials: "same-origin"` instead of returning local stub success.
- `REQ-004` / Telegram auth boundary for this task scope: PASS. `backend/src/dev-runtime/dev-api-server.ts` routes `/api/v1/auth/telegram` through `checkoutPaymentModule.controller.authenticateTelegram`, passing raw `initData`, `Origin` and `Referer` to the existing `FT-002` boundary.
- `REQ-022` / session storage policy for this task scope: PASS. Runtime issues the `khujandi_mini_app_session` HttpOnly cookie from the controller cookie descriptor; checkout submit resolves the authenticated user server-side and does not use JS-readable session identifiers.
- Missing auth controlled recovery: PASS. Runtime coverage proves anonymous `/api/v1/orders/checkout` returns `AUTH_REQUIRED` and leaves `checkoutPaymentState.orders` unchanged.
- Paid order persistence intentionally out of scope: PASS. Authenticated checkout returns controlled `PAYMENT_CONFIRMATION_REQUIRED` with `orderCreated: false`; `TASK-FT013-05` owns paid `CREATED` persistence.

## Evidence
- 2026-04-26: `npx jest --config jest.config.cjs tests/slices/checkout-payment frontend/src/tests/slices/checkout-payment` -> PASS, 8 suites / 63 tests.
- 2026-04-26: `npm run lint` -> PASS.
- 2026-04-26: `npm run build:frontend` -> PASS.
- Runtime test proves anonymous `/api/v1/orders/checkout` returns `AUTH_REQUIRED`, authenticated submit returns controlled `PAYMENT_CONFIRMATION_REQUIRED`, and no new order is created by this task.
