---
description: Independent verifier report for TASK-FT018-04 fixed-persona test session and personas endpoints.
status: active
---
# TASK-FT018-04 Verification Report

## Result

PASS

## Scope Verified

- Guarded `GET /api/v1/test/personas`.
- Guarded `POST /api/v1/test/session`.
- FT-018 staging test auth harness contract alignment for fixed personas, token guard, production/disabled absence, normal auth/session primitives, no arbitrary identity authority, no cookie/session JSON leakage, and narrow courier metadata behavior.

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
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.protocols/TASK-FT018-04/context.md`
- `.protocols/TASK-FT018-04/plan.md`
- `.protocols/TASK-FT018-04/verification.md`
- `.tasks/TASK-FT018-04/TASK-FT018-04-S-IMPL-final-report-code-01.md`
- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/http-runtime.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/runtime-mode.ts`
- `backend/src/dev-runtime/routes/test-runtime-guards.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `backend/src/slices/checkout-payment/application/checkout-payment.service.ts`
- `backend/src/slices/admin-access/application/admin-access.service.ts`
- `backend/src/slices/admin-access/presentation/admin-auth-http.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts`

## Files Changed

- `.protocols/TASK-FT018-04/verification.md`
- `.tasks/TASK-FT018-04/TASK-FT018-04-S-VERIFY-final-report-code-01.md`

## Evidence

- Routes are absent as `404` when staging test harness mode is disabled and under production-like runtime.
- Enabled routes require `X-E2E-Test-Token`; missing or wrong token returns `403`.
- `GET /api/v1/test/personas` returns fixed safe metadata only: `client_alina`, `seller_plov`, `admin_boss`, `courier_7`.
- `POST /api/v1/test/session` rejects unknown personas and arbitrary identity authority fields with controlled `400 VALIDATION_ERROR`.
- `client_alina` and `seller_plov` create `khujandi_mini_app_session` cookies through the checkout-payment session repository/hash/token family.
- `seller_plov` does not gain seller access from request body authority; access fails before seed and resolves only after the seeded `seller_owned_shop` catalog binding.
- `admin_boss` creates `khujandi_admin_access_token` and `khujandi_admin_refresh_token` through admin-access session baseline storage and can access an admin-protected route with allowed origin.
- `operator_manager` returns controlled unsupported `400`; implementation does not fake operator/admin identity by reusing the boss account.
- `courier_7` returns `transport: testMetadata`, sets no Mini App/admin cookies, and does not claim real Telegram transport verification.
- Response body assertions and route review show cookie/session values are not returned in JSON.

## Checks Run

- `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts --runInBand --testTimeout=30000` — PASS; 3 suites, 17 tests.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

## Blockers/Risks

- No blocking verifier finding.
- `operator_manager` remains unsupported until admin-access runtime has a distinct seeded manager/operator account; current behavior is controlled and does not fake identity.
- Admin cookie behavior over plain local HTTP remains a later UI QA/server-staging concern because the admin-access HTTP runtime defaults secure cookies. This does not block this task's server-side session primitive verification.

## Recommendation

Proceed with TASK-FT018-04 closure and continue to TASK-FT018-05 for UI QA fixture/workflow consumption.
