---
description: Verification plan for TASK-FT018-01 FT-018 spec freeze and handoff.
status: active
---
# TASK-FT018-01 Verification

## Verdict

- Result: `PASS`
- Scope to verify: docs-only FT-018 spec freeze and handoff readiness.

## Evidence Summary

- Feature spec, contract, runbook, testing policy, implementation handoff and protocol handoff consistently define FT-018 as `runtime/testing enablement`, not product behavior.
- Production guard rules are explicit and aligned:
  - `NODE_ENV=production` cannot expose test auth routes;
  - `PAYMENT_PROVIDER=mock` with production is fail-closed;
  - `DEBUG=TRUE` alone is not a trusted payment/auth selector;
  - test routes require `E2E_TEST_MODE=TRUE`, non-production mode and `X-E2E-Test-Token` on public staging.
- Fixed-persona rule is consistent: `POST /api/v1/test/session` selects seeded personas only and must reject or ignore arbitrary identity fields.
- UI QA evidence remains separated from Telegram `initData`/WebView correctness and real payment-provider trust-boundary evidence.
- `TASK-FT018-02` context and plan consume the same guard rules and are consistent enough to start runtime mode guards plus non-secret health endpoint work.

## Required Checks

- `git diff --check`
- Changed markdown local link validation if FT-018 Memory Bank/protocol links changed.

## Criteria To Verify

- Feature, contract, runbook, testing policy, implementation handoff and protocol handoff do not contradict each other.
- Production guard rules are explicit:
  - `NODE_ENV=production` cannot expose test routes;
  - `PAYMENT_PROVIDER=mock` is refused in production;
  - `DEBUG=TRUE` alone does not create trusted payment behavior;
  - test routes require `E2E_TEST_MODE=TRUE` and staging token where public.
- `POST /api/v1/test/session` remains fixed-persona only in the contract.
- UI QA evidence remains separated from Telegram auth and real payment trust-boundary evidence.

## Out Of Scope For Verification

- Runtime behavior.
- Endpoint implementation.
- Compose/deploy behavior.
- Browser/UI QA execution.

## Checks Run

- `git diff --check`: PASS.
- Markdown link sanity for changed files: PASS.
