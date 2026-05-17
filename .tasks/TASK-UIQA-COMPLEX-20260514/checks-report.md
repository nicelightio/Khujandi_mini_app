---
description: Backend checks report for complex UI QA flow on 2026-05-14.
status: active
---
# TASK-UIQA-COMPLEX-20260514 Checks Report

## Result

Backend/runtime semantic checks are mostly green for the requested flow, with one important environment finding:

- `checkout-payment` passes under the repo-local runtime suite.
- `delivery-assignment` passes for offer/claim/timeout/staff-related semantics.
- `delivery-tracking` passes when run with explicit staging/mock-payment env.
- `reviews-feedback` passes for two-sided bot review, duplicate safety, negative alert and staff metric semantics.
- `admin-access` passes for auth/session and Staff/operator account runtime checks.
- Running `delivery-tracking` without explicit mock-payment env fails two mounted customer polling cases because checkout returns `503`; rerunning the same suite with `APP_ENV=staging NODE_ENV=test PAYMENT_PROVIDER=mock E2E_TEST_MODE=TRUE` passes. This confirms the complex flow must be prepared under the guarded mock-payment staging profile.

Existing UI QA fixture coverage is checkout-focused, not full-flow:

- It covers health/reset/seed/personas/session bootstrap and optional browser `/checkout` smoke for `client_alina`.
- It does not drive courier active/login, courier claim, courier status progression, admin completion, or client/courier review callbacks.
- Existing `.tasks/TASK-UIQA-COMPLEX-20260514/entrypoints-report.md` correctly records that courier and review steps need Telegram/manual interaction or an internal harness/script.

## Checks Run

- `npx jest --config jest.config.cjs tests/slices/checkout-payment --runInBand --testTimeout=30000`
  - PASS: 11 suites / 103 tests.
- `npm run test:delivery-assignment -- --runInBand --testTimeout=30000`
  - PASS: 8 suites / 69 tests.
- `npm run test:delivery-tracking -- --runInBand --testTimeout=30000`
  - FAIL: 4 suites passed, 1 suite failed; 32 tests passed, 2 failed.
  - Failure excerpt: `delivery-tracking.runtime.spec.ts` expected checkout response `200`, received `503` in customer event/polling cases.
- `APP_ENV=staging NODE_ENV=test PAYMENT_PROVIDER=mock E2E_TEST_MODE=TRUE E2E_TEST_TOKEN=<test-token> npm run test:delivery-tracking -- --runInBand --testTimeout=30000`
  - PASS: 5 suites / 34 tests.
  - Token value was not printed.
- `npm run test:reviews-feedback -- --runInBand --testTimeout=30000`
  - PASS: 3 suites / 25 passed, 1 todo.
- `npm run test:admin-access -- --runInBand --testTimeout=30000`
  - PASS: 7 suites / 34 tests.
- `node --check tests/e2e/staging-ui-qa-fixture.mjs`
  - PASS.

## Files Inspected

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `package.json`
- `tests/e2e/README.md`
- `tests/e2e/staging-ui-qa-fixture.mjs`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts`
- `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment-claim.spec.ts`
- `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts`
- `.tasks/TASK-FT016-18/TASK-FT016-18-S-VERIFY-final-report-docs-01.md`
- `.tasks/TASK-UIQA-COMPLEX-20260514/entrypoints-report.md`
- `.tasks/TASK-UIQA-COMPLEX-20260514/ui-qa-fixture-2026-05-14T09-32-44-962Z.json`

## Files Changed

- `.tasks/TASK-UIQA-COMPLEX-20260514/checks-report.md`

## Blockers / Risks

- Browser-only `ui_qa` cannot complete the full requested flow today because courier and review actions are bot/harness-owned, not mounted browser UI paths.
- `courier_7` fixed persona returns test metadata, not a browser cookie session.
- A real/manual courier step is only meaningful if the real staging Telegram bot is wired to the same staging runtime/state as the UI QA target.
- UI QA fixture evidence with fixed sessions does not prove Telegram HMAC/replay/WebView behavior or real payment provider trust.
- Full flow must run with guarded staging/mock-payment runtime flags; otherwise checkout-dependent tracking tests can hit `503`.

## Recommendation

Proceed with a hybrid orchestration:

1. Use `ui_qa` for client checkout, customer tracking, admin/operator panel visibility, manual offer UI/API and admin `DELIVERED -> COMPLETED`.
2. Use a narrow tester/harness step or the human acting through the real staging Telegram bot for courier active/claim/status progression.
3. Use bot/manual/harness execution for both reviews after `COMPLETED`.
4. Before starting the live UI QA, run the staging preflight fixture against the chosen base URL and verify personas include `client_alina`, `admin_boss` and `courier_7`.
