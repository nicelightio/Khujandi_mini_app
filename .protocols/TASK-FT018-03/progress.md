---
description: Progress log for TASK-FT018-03 local staging profile plus guarded reset and seed endpoints.
status: active
---
# TASK-FT018-03 Progress

## 2026-05-13
- Protocol artifacts were prepared for execution.
- Recorded owning capability `runtime/testing enablement`, local staging contours for `mini-app` / `seller-web` / `admin-web`, touched runtime/config, test-only presentation, application orchestration and staging infrastructure layers, and no-default-shared decision.
- Initial status: `planned`; depends on `TASK-FT018-02`.
- Implementation has not been executed in this protocol-preparation pass.
- Confirmed `TASK-FT018-02` verifier result is `PASS`; reset/seed/session routes were absent before this task.
- Implementation executed.
- Micro-check before edit:
  - Owning capability: `runtime/testing enablement`.
  - Owning contours: local staging backend surfaces for `mini-app` / `seller-web` / `admin-web`.
  - Touched layers: runtime/config, test-only presentation, application seed/reset orchestration and staging infrastructure state paths.
  - Shared justification: no broad `shared` extraction; reset/seed stayed local to `backend/src/dev-runtime`.
- Added guarded `POST /api/v1/test/reset` and `POST /api/v1/test/seed`.
- Routes are available only when staging/test harness mode is enabled (`E2E_TEST_MODE=TRUE`, non-production, explicit local/test/staging app env) and require `X-E2E-Test-Token`; disabled/production routes return `404`, missing/wrong token returns `403`.
- Added deterministic seed scenarios: `baseline_catalog`, `checkout_happy`, `seller_owned_shop`, `operator_orders`, `delivery_happy_path`.
- Wired `scripts/dev-api.ts` so `APP_ENV=staging` defaults local runtime DB paths to `.runtime/staging/*` while preserving existing non-staging dev filenames.
- Added focused reset/seed runtime tests covering route absence, token guard, deterministic reset/seed, validation errors and explicit staging DB path isolation.
- Checks passed:
  - `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts --runInBand`
  - local staging smoke: `/api/v1/health`, `POST /api/v1/test/reset`, `POST /api/v1/test/seed` with `checkout_happy`
  - `npm run lint`
  - `git diff --check`
- Residual risk: `.runtime/` is not currently ignored by `.gitignore`; smoke-created `.runtime/staging/*` files were removed manually because `.gitignore` changes are outside this task write scope.
