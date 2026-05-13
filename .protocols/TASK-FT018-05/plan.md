---
description: План выполнения TASK-FT018-05 UI QA fixtures and workflow docs.
status: active
---
# TASK-FT018-05 Plan

## Steps

1. Re-read `FT-018`, staging test auth contract, staging UI QA testing policy, runbook and completed `TASK-FT018-02/03/04` verification notes.
2. Inspect existing UI QA/browser artifacts and test structure:
   - `reports/ui-qa/playwright/*`
   - existing frontend tests under `frontend/src/tests/**/*`
   - any existing Playwright/e2e setup if present.
3. Add the smallest fixture/workflow surface needed for UI QA to consume staging:
   - `UI_QA_BASE_URL` input.
   - `E2E_TEST_TOKEN` from ignored local/CI secret only.
   - helper sequence for `reset -> seed -> fixed persona session`.
   - cookie-preserving browser context after `POST /api/v1/test/session`.
4. Document the workflow in the appropriate existing docs:
   - `.memory-bank/testing/staging-ui-qa.md`
   - `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
   - optional short `.tasks/TASK-FT018-05/` evidence report.
5. Run the minimal browser smoke when staging runtime is available:
   - base URL health check.
   - reset/seed `checkout_happy`.
   - bootstrap `client_alina`.
   - open catalog/storefront, add product, checkout with guarded mock payment, open status/tracking.
6. If browser smoke cannot run because prerequisite runtime is absent, record a clear `BLOCKED`/`NOT RUN` with missing prerequisite and keep docs/fixtures deterministic.
7. Run quality gates:
   - focused UI/fixture tests if added.
   - `npm run build:frontend` if UI/frontend code changed.
   - `npm run lint` if practical for touched files.
   - `git diff --check`.
8. Update `.protocols/TASK-FT018-05/{progress,verification}.md` and detailed final report in `.tasks/TASK-FT018-05/`.

## Candidate Touched Files

- `reports/ui-qa/playwright/*` or a repo-local UI QA fixture location if already established.
- `frontend/src/tests/**/*` only for smoke/fixture tests that do not change production UI behavior.
- `.memory-bank/testing/staging-ui-qa.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.tasks/TASK-FT018-05/**/*`
- `.protocols/TASK-FT018-05/**/*`

## Verification Targets

- `GET /api/v1/health` confirms staging mode facts without secrets.
- Test routes require token and fixed personas.
- `client_alina` session bootstrap sets cookies without echoing cookie values in JSON.
- UI QA workflow can run from `UI_QA_BASE_URL` without local hard-coded host assumptions.
- Checkout smoke uses `PAYMENT_PROVIDER=mock` only through server-side staging guard.
- Evidence explicitly labels Telegram/payment trust-boundary checks as out of scope for browser UI QA.

## Non-Goals

- No new auth contour.
- No arbitrary test users.
- No production route or deploy change.
- No real payment provider work.
- No Telegram HMAC/replay verification in browser fixture.
- No broad frontend redesign or product UX changes.
