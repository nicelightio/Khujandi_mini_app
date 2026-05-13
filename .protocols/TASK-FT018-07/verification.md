---
description: Verification notes for TASK-FT018-07 security review and final verification/evidence closure.
status: active
---
# TASK-FT018-07 Verification

## Verdict

- Result: `PASS_WITH_SERVER_RENDER_DEPLOY_BLOCKERS`
- Date: `2026-05-13`
- Scope to verify: final FT-018 security review, production-negative/staging-positive guard evidence and closure recommendation.

## Required Evidence

- All prerequisite task verification notes (`TASK-FT018-02..06`) are read and reconciled.
- Production-like runtime cannot expose test auth routes or mock payment trust.
- Staging runtime requires explicit `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE` and token guard.
- Fixed persona session endpoint does not accept arbitrary identities and does not echo cookie/session values.
- Reset/seed touches only staging-owned state.
- Server staging profile is isolated from production host/project/volume/logs/router names.
- UI QA evidence is separated from Telegram auth and real payment provider trust-boundary evidence.
- No secrets are present in reports or Memory Bank summaries.

## Commands Placeholder

- Focused runtime/auth/mock guard tests:
  - `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand --testTimeout=30000` — `PASS`; 4 suites, 28 tests.
- UI QA fixture syntax:
  - `node --check tests/e2e/staging-ui-qa-fixture.mjs` — `PASS`.
- `npm run lint` — `PASS`.
- `git diff --check` — `PASS`.
- `bash -n deploy/scripts/tgmeal-deploy-alma.sh` — `PASS`.
- Production `docker compose config` — `BLOCKED`; `docker` command is not installed.
- Staging `docker compose config` with explicit staging env — `BLOCKED`; `docker` command is not installed.
- Superseding checkout harness focused tests:
  - `npm run test:catalog -- tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts tests/slices/checkout-payment/checkout-payment.runtime.spec.ts frontend/src/tests/slices/checkout-payment/checkout-payment-api.spec.ts frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx --runInBand --testTimeout=30000` — `PASS`; 4 suites, 33 tests.
- Local browser smoke:
  - `node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke` against local host-OS staging — `PASS`; evidence `.tasks/TASK-FT018-05/ui-qa-fixture-2026-05-13T11-15-41-115Z.json`.
- `npm run build:frontend` — `PASS`.

## Evidence Matrix

| Area | Status | Evidence |
|---|---|---|
| Production-negative test auth guards | `PASS` | Focused tests cover production/disabled route absence, startup refusal for production `E2E_TEST_MODE=TRUE`, token `403`, and fixed route mounting conditions. |
| Production-negative mock payment guard | `PASS` | Focused checkout runtime tests cover production refusal, missing explicit guard rejection, and `DEBUG=TRUE` not being trusted payment selection. |
| Health endpoint | `PASS` | Health returns mode facts only: `ok`, `appEnv`, `nodeEnv`, `debug`, `paymentProvider`, `e2eTestMode`, `version`; focused tests assert no token/cookie/session/DB/payment secret fields. |
| Reset/seed lifecycle | `PASS` | Focused tests cover disabled/production `404`, token `403`, fixed scenarios, controlled `400`, deterministic summaries; implementation resets dev-runtime state only. |
| Fixed-persona sessions | `PASS_WITH_LIMITATION` | Focused tests cover fixed personas, arbitrary identity rejection, Mini App/admin cookie session primitives, no cookie value in JSON; `operator_manager` is controlled unsupported. |
| Sanitized UI QA fixture | `PASS_LOCAL` | API fixture evidence from TASK-FT018-05 is sanitized and trust-boundary-labeled; `node --check` passes; local browser smoke passes. |
| Full checkout browser path | `PASS_LOCAL` | Checkout uses fixed-persona HttpOnly cookie session only when backend bootstrap exposes `testSessionAuthAvailable=true`; fixture does not forge Telegram `initData`. |
| Compose/deploy isolation | `PARTIAL` | Static evidence and deploy dirty-check safety pass; production/staging `docker compose config` renders are blocked because Docker Compose is unavailable. |
| Secrets/session leakage | `PASS_WITH_SCOPE_LIMIT` | Reviewed evidence stores cookie names/attributes only. Static search found no tracked token/cookie/session values in reviewed FT-018 evidence; code symbols/placeholders remain expected. |
| Trust-boundary evidence split | `PASS` | Specs, runbooks, fixture reports and task evidence state UI QA/mock payment do not prove Telegram HMAC/replay/WebView or real payment provider correctness. |

## Closure Recommendation Placeholder

- `REQ-037`: keep `planned` or at most `partial/implemented`, not verified.
- FT-018: terminal status recommendation is `PASS_WITH_SERVER_RENDER_DEPLOY_BLOCKERS`, not full `PASS`.
- Do not deploy or expose public staging until branch/GitHub checkout, Compose render and staging secrets/environment gates are complete.

## Scope Guard

- Final closure must fail or block if production-negative evidence is absent.
- Final closure must not hide trust-boundary limitations behind browser UI QA success.

## Blockers

- Docker Compose render unavailable locally: `docker`/`docker-compose` are not installed in this environment.
- Server staging render is blocked because `/srv/tgmeal/staging/app` does not exist as a clean GitHub checkout containing the staging-aware Compose/deploy changes.
- Staging deploy is not allowed until branch/GitHub checkout, Compose render, isolated env/secret configuration and approved deploy gates are complete.
