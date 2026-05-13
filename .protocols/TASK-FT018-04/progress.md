---
description: Progress log for TASK-FT018-04 fixed-persona test session and personas endpoints.
status: active
---
# TASK-FT018-04 Progress

## 2026-05-13
- Protocol artifacts were prepared for execution.
- Recorded owning capability `runtime/testing enablement`, contour ownership for `mini-app` / `seller-web` / `admin-web` plus narrow `telegram-bot` test-identity separation, touched test-only presentation, application bootstrap and auth/session integration layers, and no-broad-shared decision.
- Initial status: `planned`; depends on `TASK-FT018-03`.
- Implementation has not been executed in this protocol-preparation pass.
- Confirmed `TASK-FT018-02` and `TASK-FT018-03` verifier reports are `PASS`.
- Implementation executed.
- Required micro-check before edit:
  - Owning capability: `runtime/testing enablement`.
  - Owning contours: `mini-app` / `seller-web` / `admin-web` test session bootstrap; `telegram-bot` only narrow test identity metadata.
  - Touched layers: test-only presentation, application bootstrap, auth/session integration.
  - Shared justification: no broad shared extraction; only a local `dev-runtime` test guard helper was added to avoid duplicated unsafe env/token checks.
- Added guarded `GET /api/v1/test/personas` and `POST /api/v1/test/session`.
- Routes are available only when staging/test harness mode is enabled (`E2E_TEST_MODE=TRUE`, non-production, explicit local/test/staging `APP_ENV`) and require `X-E2E-Test-Token`; disabled/production routes return `404`, missing/wrong token returns `403`.
- `GET /api/v1/test/personas` returns safe fixed metadata only for currently supported personas: `client_alina`, `seller_plov`, `admin_boss`, `courier_7`.
- `POST /api/v1/test/session` rejects arbitrary identity authority fields (`telegramId`, `userId`, `role`, `shopId`, `adminAccountId`, `password`) with controlled `400 VALIDATION_ERROR`.
- Mini App `client_alina` and `seller_plov` sessions are created through the existing checkout-payment user/session repository and the normal `khujandi_mini_app_session` HttpOnly cookie family; seller access remains dependent on seeded catalog binding, not request body authority.
- Admin `admin_boss` session is created through the existing admin-access `createSessionBaseline` primitive and normal admin cookie names.
- `operator_manager` is recognized as a fixed key but returns controlled unsupported `400` because the current dev runtime has only one seeded `BOSS` admin account and no distinct manager/operator account.
- `courier_7` creates only narrow test identity metadata in runtime state and does not set Mini App/admin cookies or claim Telegram transport verification.
- JSON responses do not include cookie values, session token hashes, raw initData, E2E token, payment secrets or database URLs.
- Checks passed:
  - `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts --runInBand --testTimeout=30000`
  - `npm run lint`
  - `git diff --check`
- Note: the reset/seed spec can exceed Jest's default 5s timeout on this machine when run in the focused runtime bundle, so the final focused run used `--testTimeout=30000`; assertions pass.
