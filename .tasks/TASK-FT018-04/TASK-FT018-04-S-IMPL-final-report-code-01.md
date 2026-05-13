---
description: Final implementation report for TASK-FT018-04 fixed-persona test session and personas endpoints.
status: active
---
# TASK-FT018-04 Final Report

## Result

Implemented guarded fixed-persona test session bootstrap endpoints for staging/non-production UI QA.

## Files Inspected

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.tasks/TASK-FT018-02/*`
- `.tasks/TASK-FT018-03/*`
- `.protocols/TASK-FT018-04/{context,plan,progress,verification}.md`
- `backend/src/dev-runtime/**`
- `backend/src/slices/checkout-payment/**`
- `backend/src/slices/admin-access/**`
- focused runtime tests under `tests/slices/checkout-payment`

## Files Changed

- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/routes/test-runtime-guards.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts`
- `.protocols/TASK-FT018-04/progress.md`
- `.protocols/TASK-FT018-04/verification.md`
- `.tasks/TASK-FT018-04/TASK-FT018-04-S-IMPL-final-report-code-01.md`

## Scope Notes

- Owning capability: `runtime/testing enablement`.
- Owning contours: `mini-app` / `seller-web` / `admin-web` test session bootstrap; `telegram-bot` only narrow test identity metadata.
- Touched layers: test-only presentation, application bootstrap, auth/session integration.
- Shared justification: no broad shared extraction; a local `dev-runtime` guard helper avoids duplicated unsafe test-route checks.

## Behavior

- Added `GET /api/v1/test/personas`.
- Added `POST /api/v1/test/session`.
- Both routes are absent/`404` unless `E2E_TEST_MODE=TRUE`, non-production `NODE_ENV`, and explicit local/test/staging `APP_ENV` are active.
- Both routes require `X-E2E-Test-Token`; missing/wrong token returns `403`.
- Supported personas:
  - `client_alina`
  - `seller_plov`
  - `admin_boss`
  - `courier_7`
- `operator_manager` is recognized as a fixed key but returns controlled unsupported `400` because the current runtime has no distinct seeded manager/operator admin account.
- Mini App personas use checkout-payment user/session primitives and `khujandi_mini_app_session`; seller access remains dependent on seeded catalog binding.
- `admin_boss` uses admin-access `createSessionBaseline` and normal admin cookie names.
- `courier_7` returns only narrow `testMetadata` and does not set auth cookies or claim Telegram transport verification.
- Arbitrary identity fields are rejected with `400 VALIDATION_ERROR`.
- JSON responses do not include cookie values, session token hashes, raw initData, test token, payment secrets or DB URLs.

## Checks Run

- `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts --runInBand --testTimeout=30000` — PASS; 3 suites, 17 tests.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

## Blockers/Risks

- No blocker for supported personas.
- `operator_manager` is residual unsupported behavior until the admin-access dev runtime has a real distinct manager/operator seeded account.
- Admin cookies follow existing admin cookie names/session validation; local browser behavior over plain HTTP should be verified in later UI QA fixture/server-staging tasks because the admin auth runtime currently defaults secure cookies.

## Recommendation

Proceed to verifier review for `TASK-FT018-04`, then continue to `TASK-FT018-05` for UI QA fixtures/workflow consumption.
