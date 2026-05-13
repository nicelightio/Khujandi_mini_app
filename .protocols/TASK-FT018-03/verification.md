---
description: Verification plan for TASK-FT018-03 local staging profile plus guarded reset and seed endpoints.
status: active
---
# TASK-FT018-03 Verification

## Independent Verifier Verdict

- Result: `PASS`
- Verifier role: `SUBAGENT TYPE: tester`
- Scope verified: local staging profile plus guarded reset/seed endpoints.
- Verification date: 2026-05-13.

## Checks Run

- Focused runtime reset/seed tests selected by the implementer:
  - `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts --runInBand` — PASS; 2 suites, 10 tests.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

## Criteria To Verify

- Local staging state uses isolated `.runtime/staging/*` or explicitly configured staging paths.
- `/api/v1/test/reset` and `/api/v1/test/seed` return `404` or fail closed outside enabled test mode.
- Missing or wrong `X-E2E-Test-Token` returns `403`.
- Reset does not touch production DB, production volumes, shared Docker resources or unrelated project files.
- Seed scenarios are deterministic and do not depend on production identities.
- Fixed-persona session creation remains out of scope.

## Evidence

- `scripts/dev-api.ts` defaults admin/catalog runtime DB paths to `.runtime/staging/*` when `APP_ENV=staging`; existing non-staging dev defaults are preserved.
- `handleTestStateRoutes` matches only `POST /api/v1/test/reset` and `POST /api/v1/test/seed`; disabled mode and production-like mode fall through to `404`.
- Enabled route calls require `X-E2E-Test-Token`; focused tests cover missing and wrong token returning `403`.
- Reset reinitializes catalog/admin/checkout/operational in-process staging state and persists catalog/admin runtime baselines through the configured local DB paths.
- Seed scenarios are fixed-key only: `baseline_catalog`, `checkout_happy`, `seller_owned_shop`, `operator_orders`, `delivery_happy_path`; unknown scenario returns controlled `400 VALIDATION_ERROR`.
- Response payloads include non-secret counts and scenario/scope metadata only; no token/session/cookie/raw initData is returned.
- `http-runtime` preflight/json CORS headers include `x-e2e-test-token`, so health/test routes are usable by browser clients with the required test token header.
- `rg` over scoped runtime/test files found no implementation of `/api/v1/test/session`; `/api/v1/test/personas` appears only in a negative production-route test.
- `.gitignore` / related ignore files do not currently ignore `.runtime/`; this matches the implementer-reported artifact risk.

## Residual Risks To Report

- `.runtime/` is not currently ignored by `.gitignore`; local smoke artifacts were removed manually. Ignoring `.runtime/` should be handled by an orchestrator-approved docs/config follow-up because `.gitignore` is outside this task write scope.
- Fixed-persona `/api/v1/test/session` and `/api/v1/test/personas` remain out of scope for `TASK-FT018-04`.
