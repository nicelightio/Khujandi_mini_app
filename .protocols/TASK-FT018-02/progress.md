---
description: Progress log for TASK-FT018-02 runtime mode guards and health endpoint.
status: active
---
# TASK-FT018-02 Progress

## 2026-05-13
- Protocol artifacts were prepared for execution.
- Recorded owning capability `runtime/testing enablement`, backend runtime contours for `mini-app` / `seller-web` / `admin-web`, touched runtime/config and presentation-health layers, and no-default-shared decision.
- Initial status: `planned`; depends on `TASK-FT018-01` acceptance.
- Implementation has not been executed in this protocol-preparation pass.
- Implementation executed.
- Micro-check before edit:
  - Owning capability slice: `runtime/testing enablement`.
  - Owning contour: backend runtime for `mini-app` / `seller-web` / `admin-web`; no `telegram-bot` behavior change.
  - Touched layers: runtime/config plus non-secret presentation health endpoint.
  - Shared justification: no broad `shared` extraction; added only a local `dev-runtime` mode helper to avoid duplicated unsafe-env parsing.
- Added explicit runtime mode parsing for `APP_ENV`, `NODE_ENV`, `DEBUG`, `PAYMENT_PROVIDER` and `E2E_TEST_MODE`.
- Added production fail-closed handling for `E2E_TEST_MODE=TRUE`; mock payment remains refused in `NODE_ENV=production`; `DEBUG=TRUE` is disabled as an effective diagnostic flag in production.
- Added `GET /api/v1/health` with non-secret facts only.
- Added focused runtime mode/health tests and tightened existing checkout runtime guard tests.
- Checks passed:
  - `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand`
  - `npm run lint`
  - `git diff --check`
