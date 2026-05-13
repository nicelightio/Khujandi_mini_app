---
description: Verification plan for TASK-FT018-04 fixed-persona test session and personas endpoints.
status: active
---
# TASK-FT018-04 Verification

## Verdict

- Result: `PASS`
- Scope to verify: guarded `/api/v1/test/personas` and `/api/v1/test/session`.
- Independent verifier run: `PASS`; evidence recorded in `.tasks/TASK-FT018-04/TASK-FT018-04-S-VERIFY-final-report-code-01.md`.

## Required Commands

- `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts --runInBand --testTimeout=30000` — PASS; 3 suites, 17 tests.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

## Criteria To Verify

- Production-like runtime cannot mount or use `/api/v1/test/personas` or `/api/v1/test/session` — PASS.
- Non-production runtime with `E2E_TEST_MODE` disabled cannot use test routes — PASS.
- Missing/wrong `X-E2E-Test-Token` returns `403` when routes are mounted — PASS.
- `GET /api/v1/test/personas` returns only fixed safe metadata — PASS.
- `POST /api/v1/test/session` accepts only fixed supported persona keys — PASS.
- Unknown persona returns controlled `400 VALIDATION_ERROR` — PASS.
- Arbitrary identity fields are rejected and cannot create custom production-like identities — PASS.
- Mini App and admin personas use normal cookie/session primitives from their owning contours — PASS.
- Seller access comes from seeded `catalog` binding, not request-body authority — PASS.
- Cookie/session values are not returned in JSON — PASS.
- Courier persona does not claim to verify real Telegram transport — PASS.

## Evidence

- `client_alina` sets `khujandi_mini_app_session` and can use the existing Mini App session path for language sync as Telegram user `910001`.
- `seller_plov` without seed fails closed for seller shops; after `seller_owned_shop` seed, the same fixed persona session resolves the seeded catalog binding for `shop-1`.
- `admin_boss` sets `khujandi_admin_access_token` and `khujandi_admin_refresh_token` via admin-access session baseline and can access admin-protected operator delivery read route with allowed origin.
- `operator_manager` returns controlled unsupported `400` because current runtime lacks a distinct seeded manager/operator account.
- `courier_7` returns `transport: testMetadata`, creates/keeps only courier runtime identity metadata, and sets no Mini App/admin cookies.
- Response body assertions check cookie values are not echoed in JSON; route code does not log or return raw initData, E2E token, payment secrets or DB URLs.

## Residual Risks To Report

- `operator_manager` remains unsupported until the admin-access dev runtime has a distinct seeded manager/operator account; this was intentionally not faked with the `BOSS` account.
- Admin test-session cookies use the existing admin cookie names and token hash/session primitive. The current admin HTTP runtime defaults `Secure` cookies; local browser handling over plain `http://127.0.0.1` remains a broader runtime behavior to verify in the later UI QA fixture/server-staging tasks.
- Focused reset/seed spec passed with `--testTimeout=30000`; default 5s Jest timeout can be tight on this machine for the existing multi-request runtime test.
