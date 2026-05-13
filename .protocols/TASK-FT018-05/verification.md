---
description: Verification notes for TASK-FT018-05 UI QA fixtures and workflow docs.
status: active
---
# TASK-FT018-05 Verification

## Verdict

- Result: `IMPLEMENTED_WITH_LOCAL_BROWSER_CHECKOUT_SMOKE_PASS`
- Date: `2026-05-13`
- Scope to verify: UI QA fixtures/workflow documentation and at least one staging browser smoke when prerequisites are available.

## Required Evidence

- `UI_QA_BASE_URL` and `E2E_TEST_TOKEN` are consumed from external env/secret inputs without hard-coded secrets.
- `POST /api/v1/test/reset`, `POST /api/v1/test/seed` and `POST /api/v1/test/session` workflow is documented and exercised or clearly marked blocked by missing runtime.
- `client_alina` checkout/status happy path uses fixed-persona cookies and guarded mock payment: PASS locally through staging-only checkout harness.
- No session IDs or cookie values are returned in JSON artifacts/log excerpts.
- Evidence report distinguishes UI workflow evidence from Telegram auth/payment trust-boundary evidence.

## Commands

- `node --check tests/e2e/staging-ui-qa-fixture.mjs` — PASS.
- Local host-OS staging API smoke:
  - API started with `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE`, `HOST=127.0.0.1`, `PORT=3001`, and temporary DB paths under `/tmp/khujandi-task-ft018-05`.
  - `node tests/e2e/staging-ui-qa-fixture.mjs api-smoke` — PASS; latest evidence `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-25-07-701Z.json`.
- Browser smoke:
  - Historical pre-harness run: `node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke` — BLOCKED with exit code `2`; evidence `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-21-40-565Z.json`.
  - Historical blocker: Playwright package/browser runtime was not installed in this repo/runtime.
- Superseding local browser smoke after Playwright devDependency and checkout harness:
  - `node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke` — PASS; evidence `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T11-15-41-115Z.json`.
- `npm run build:frontend` — PASS.
- `npm run lint` — PASS.
- `git diff --check` — PASS.

## Evidence Summary

- Fixture consumes `UI_QA_BASE_URL` and `E2E_TEST_TOKEN` from env only.
- Fixture calls health, reset, seed, personas and session endpoints.
- `client_alina` session response used `httpOnlyCookie` transport and set `khujandi_mini_app_session`; evidence stores cookie name/attributes only, not value.
- Checkout browser path uses fixed-persona HttpOnly cookie session and backend `testSessionAuthAvailable=true`; it does not forge Telegram `initData`.
- Evidence contains the required trust-boundary label: fixed-persona UI QA does not prove Telegram HMAC/replay/WebView correctness or real payment provider trust.
- No `E2E_TEST_TOKEN`, cookie values, session values, raw `initData`, payment secrets or database URLs were recorded in generated evidence.

## Blockers / Residual Risks

- Server staging browser smoke remains pending until staging deploy/render closure.
- UI QA still does not verify Telegram HMAC/replay/WebView correctness or real provider payment trust.

## Scope Guard

- Production auth/payment semantics must remain unchanged.
- Test auth routes must remain staging-only and token-guarded.
- No arbitrary persona/identity creation is accepted.

## Historical Independent Tester Verification 2026-05-13

- Result: `PASS_WITH_BROWSER_SMOKE_BLOCKED`.
- Verified against `FT-018`, `staging-test-auth-harness-contract`, staging UI QA testing policy, task plan and implementation report.
- Fixture input boundary is correct: `UI_QA_BASE_URL` and `E2E_TEST_TOKEN` are consumed from env only, and tracked docs use placeholders/secret-source wording rather than hard-coded token values.
- Fixture workflow is correct for API preparation: health, reset, seed, personas and fixed-persona session were run against local staging runtime on temporary state paths.
- New verifier evidence:
  - `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-29-48-803Z.json` - API smoke `PASS`.
  - `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T10-30-08-748Z.json` - browser smoke `BLOCKED` after API/session preparation because Playwright is unavailable.
- Evidence is sanitized: it records cookie names/attributes only and contains no token, raw cookie/session value, raw `initData`, payment secret or database URL.
- Browser smoke blocked status is honest and precise: local `import("playwright")` check fails, and fixture exits `2` with missing prerequisite instead of treating browser smoke as pass.
- Documentation clearly separates staging UI QA evidence from Telegram HMAC/replay/WebView correctness and real payment provider trust.
- No frontend/product UI code or production auth/payment behavior was changed by this task's fixture/docs scope.

Independent checks run:

- `node --check tests/e2e/staging-ui-qa-fixture.mjs` - PASS.
- Local staging API fixture smoke with temporary state paths and throwaway env token - PASS.
- Local staging browser-smoke fixture path with temporary state paths and throwaway env token - expected `BLOCKED`, exit code `2`.
- `node -e "import('playwright')..."` - confirms Playwright package missing.
- `npm run lint` - PASS.
- `git diff --check` - PASS.

Residual risk:

- Full browser checkout happy path remains unverified until a Playwright package/browser runtime is provided and the existing checkout UI dependency on real Telegram `initData` is addressed through an orchestrator-approved staging-only path.
