---
description: Прогресс выполнения TASK-FT017-03 checkout-only debug/e2e affordance.
status: active
---
# TASK-FT017-03 Progress

## 2026-05-11

- Read required spec and verification inputs.
- Inspected checkout-payment frontend API, view-model, page, route and tests.
- Inspected backend dev-runtime checkout routes and guarded provider runtime.
- Identified need for non-sensitive backend `mockPaymentAvailable` metadata because frontend static bootstrap cannot prove backend mock availability.
- Added `GET /api/v1/orders/checkout/bootstrap` metadata in dev runtime; it returns only `mockPaymentAvailable`.
- Extended checkout frontend bootstrap/view-model/page with a checkout-only note when backend availability is true.
- Added focused frontend assertions for backend-available visibility, no-composition absence and frontend-only debug no-trust behavior.
- Added runtime assertions that `PAYMENT_PROVIDER=mock` reports available and `DEBUG=true` without provider reports unavailable.
- Ran `npx jest --config jest.config.cjs frontend/src/tests/slices/checkout-payment --runInBand`: PASS, 5 suites / 34 tests.
- Ran `npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand`: PASS, 1 suite / 9 tests.
- Ran `npm run build:frontend`: PASS.
- Ran `git diff --check`: PASS.
