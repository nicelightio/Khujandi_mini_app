---
description: Final implementation report for TASK-FT018-05 UI QA fixtures and workflow docs.
status: active
---
# TASK-FT018-05 Final Report

## Result

Implemented the smallest repo-local staging UI QA fixture/workflow surface. Browser smoke is blocked by missing Playwright runtime; API-level staging reset/seed/session fixture smoke passes locally.

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
- `.memory-bank/guides/staging-server-usage.md`
- `.memory-bank/tasks/plans/IMPL-FT-018.md`
- `.tasks/TASK-FT018-02/*`
- `.tasks/TASK-FT018-03/*`
- `.tasks/TASK-FT018-04/*`
- `.protocols/TASK-FT018-05/{context,plan,progress,verification}.md`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `backend/src/dev-runtime/routes/health.routes.ts`
- `backend/src/dev-runtime/routes/test-runtime-guards.ts`
- `vite.config.mjs`
- `package.json`
- existing `reports/ui-qa/*`

## Files Changed

- `tests/e2e/staging-ui-qa-fixture.mjs`
- `tests/e2e/README.md`
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/guides/staging-server-usage.md`
- `.protocols/TASK-FT018-05/progress.md`
- `.protocols/TASK-FT018-05/verification.md`
- `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-21-34-016Z.json`
- `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-21-40-565Z.json`
- `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-25-07-701Z.json`
- `.tasks/TASK-FT018-05/TASK-FT018-05-S-IMPL-final-report-code-01.md`

## Scope Notes

- Owning capability: runtime/testing enablement.
- Owning contours: UI QA workflow spanning mini-app/admin-web/seller-web via staging; no product behavior.
- Touched layers: test fixture/docs/evidence workflow only.
- Shared justification: none.

## Behavior Added

- Added `tests/e2e/staging-ui-qa-fixture.mjs`.
- Fixture inputs:
  - `UI_QA_BASE_URL`
  - `E2E_TEST_TOKEN`
  - optional `UI_QA_SCENARIO`
  - optional `UI_QA_PERSONA`
  - optional `UI_QA_EVIDENCE_DIR`
- Fixture workflow:
  - `GET /api/v1/health`
  - `POST /api/v1/test/reset`
  - `POST /api/v1/test/seed`
  - `GET /api/v1/test/personas`
  - `POST /api/v1/test/session`
- Fixture validates staging mode facts, mock payment mode, enabled e2e mode, fixed-persona session transport and absence of forbidden secret/session material in JSON responses.
- Fixture writes sanitized evidence under `.tasks/TASK-FT018-05/` by default.
- Browser mode dynamically imports Playwright, preserves cookies in a browser context if available, and returns `BLOCKED` with exact missing prerequisite when unavailable.

## Checks Run

- `node --check tests/e2e/staging-ui-qa-fixture.mjs` — PASS.
- Local API staging smoke with temporary state under `/tmp/khujandi-task-ft018-05`:
  - `node tests/e2e/staging-ui-qa-fixture.mjs api-smoke` — PASS.
  - Latest evidence: `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-25-07-701Z.json`.
- Local browser smoke:
  - `node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke` — BLOCKED, exit code `2`.
  - Evidence: `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-21-40-565Z.json`.
  - Blocker: Playwright package/browser runtime is not installed.
- `npm run build:frontend` — NOT RUN; no frontend/UI code changed.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

## Blockers / Risks

- Browser smoke was not completed because Playwright is unavailable in this repo/runtime.
- Full client checkout browser happy path was not verified. Current checkout UI submit still expects Telegram WebApp `initData`; the fixture intentionally does not forge `initData` or add an auth/payment shortcut.
- UI QA evidence with fixed-persona sessions is labeled as not proving Telegram HMAC/replay/WebView correctness or real payment provider trust.

## Recommendation

Proceed to `TASK-FT018-06` for server staging deploy profile. For full UI QA checkout smoke, provide a Playwright runtime and resolve the current checkout UI dependency on real Telegram `initData` through an orchestrator-approved staging-only approach, not through fixture-side forging.
