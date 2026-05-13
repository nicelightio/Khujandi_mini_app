---
description: Independent verifier report for TASK-FT018-05 UI QA fixtures and workflow docs.
status: active
---
# TASK-FT018-05 Verify Report

## Result

`PASS_WITH_BROWSER_SMOKE_BLOCKED`

The API fixture/workflow satisfies the FT-018 UI QA handoff contract. Browser smoke is correctly blocked by missing Playwright runtime and is not counted as a pass.

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
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.protocols/TASK-FT018-05/context.md`
- `.protocols/TASK-FT018-05/plan.md`
- `.protocols/TASK-FT018-05/progress.md`
- `.protocols/TASK-FT018-05/verification.md`
- `.tasks/TASK-FT018-05/TASK-FT018-05-S-IMPL-final-report-code-01.md`
- `tests/e2e/staging-ui-qa-fixture.mjs`
- `tests/e2e/README.md`
- `backend/src/dev-runtime/routes/health.routes.ts`
- `backend/src/dev-runtime/routes/test-runtime-guards.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `.tasks/TASK-FT018-05/ui-qa-fixture-*.json`

## Files Changed

- `.protocols/TASK-FT018-05/verification.md`
- `.tasks/TASK-FT018-05/TASK-FT018-05-S-VERIFY-final-report-code-01.md`
- `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-29-48-803Z.json`
- `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-30-08-748Z.json`

## Findings

- Fixture inputs are environment-only: `UI_QA_BASE_URL` and `E2E_TEST_TOKEN` are read from `process.env`, with no tracked token value in fixture/docs/evidence.
- Fixture performs the required preparation flow: `GET /api/v1/health`, `POST /api/v1/test/reset`, `POST /api/v1/test/seed`, `GET /api/v1/test/personas`, `POST /api/v1/test/session`.
- Session evidence is sanitized. Cookie values are used only in memory for optional Playwright context preservation; written evidence contains cookie name/domain/path/httpOnly/secure/sameSite only.
- Browser smoke path preserves cookies when Playwright is present and returns `BLOCKED` with a precise missing prerequisite when Playwright is absent.
- Docs explicitly state that staging UI QA does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.
- No production UI/auth/payment behavior changes were introduced in TASK-FT018-05 scope.

## Checks Run

- `node --check tests/e2e/staging-ui-qa-fixture.mjs` - PASS.
- `node -e "import('playwright')..."` - confirms Playwright missing.
- Local staging API fixture smoke with temporary state paths and throwaway env token - PASS.
  - Evidence: `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-29-48-803Z.json`.
- Local staging browser-smoke fixture path with temporary state paths and throwaway env token - `BLOCKED`, exit code `2`, expected.
  - Evidence: `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-30-08-748Z.json`.
- `npm run lint` - PASS.
- `git diff --check` - PASS.

## Blockers / Risks

- Browser smoke is blocked because the Playwright package/browser runtime is not installed in this repo/runtime.
- Full checkout browser happy path is still unverified. The current checkout UI expects real Telegram WebApp `initData`; the fixture correctly avoids forging `initData` or adding a production UI/auth shortcut.
- Minor residual risk: the fixture records `appEnv`, `nodeEnv` and `debug` from health evidence, but its hard assertions currently focus on `e2eTestMode=true` and `paymentProvider=mock`.

## Recommendation

Proceed with `TASK-FT018-06`/server staging work. Full browser checkout smoke should be run after Playwright is available and any staging-only resolution for the checkout `initData` dependency is approved by the orchestrator.
