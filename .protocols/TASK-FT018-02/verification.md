---
description: Verification plan for TASK-FT018-02 runtime mode guards and health endpoint.
status: active
---
# TASK-FT018-02 Verification

## Verdict

- Result: `PASS`
- Scope to verify: runtime mode guards and non-secret `/api/v1/health`.
- Independent verifier pass: `2026-05-13`; no implementation changes were made.

## Required Commands

- `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand` — PASS.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

## Criteria To Verify

- `/api/v1/health` returns only non-secret facts:
  - `ok`
  - `appEnv`
  - `nodeEnv`
  - `debug`
  - `paymentProvider`
  - `e2eTestMode`
  - optional non-secret `version`.
- Health response does not include token, cookie, session id, raw Telegram payload, `DATABASE_URL` or payment secrets.
- `NODE_ENV=production` plus `E2E_TEST_MODE=TRUE` fails closed.
- `NODE_ENV=production` plus `PAYMENT_PROVIDER=mock` fails closed before trusted checkout/payment behavior.
- `DEBUG=TRUE` in production does not expose test/diagnostic behavior.
- Reset/seed/session routes are not implemented as part of this task.

## Evidence

- Health response shape is covered by `tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts`.
- Production-negative cases covered:
  - `NODE_ENV=production` + `E2E_TEST_MODE=TRUE` rejects runtime startup.
  - `NODE_ENV=production` + `PAYMENT_PROVIDER=mock` rejects before checkout trust.
  - `NODE_ENV=production` + `DEBUG=TRUE` reports effective `debug=false` and keeps `/api/v1/test/personas` absent (`404`).
- Existing checkout runtime tests now require explicit `APP_ENV=staging` or `E2E_TEST_MODE=TRUE` for mock payment instead of treating `NODE_ENV=development` as sufficient.
- Independent manual runtime check with `NODE_ENV=test`, `APP_ENV=staging`, `E2E_TEST_MODE=TRUE` confirmed the downstream test endpoints are still absent in this task:
  - `GET /api/v1/test/personas` -> `404`
  - `POST /api/v1/test/session` -> `404`
  - `POST /api/v1/test/reset` -> `404`
  - `POST /api/v1/test/seed` -> `404`

## Residual Risks To Report

- No observed drift where `NODE_ENV=development` alone acts as a mock-payment trust gate in the touched runtime path.
- Reset/seed/session endpoints remain for downstream tasks and were not implemented here.
