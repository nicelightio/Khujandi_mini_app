---
description: Verification notes for TASK-FT018-07 security review and final verification/evidence closure.
status: active
---
# TASK-FT018-07 Verification

## Verdict

- Result: `STAGING_PUBLIC_SMOKE_PASS_RESOLVER_CACHE_PENDING`
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
- Server staging deploy from GitHub:
  - commit `47a4a37` pushed to `origin/main`;
  - `/srv/tgmeal/staging/app` clean checkout on `main`;
  - `/usr/local/bin/tgmeal-deploy` installed from checked-in script;
  - `APP_DIR=/srv/tgmeal/staging/app COMPOSE_PROJECT_NAME=tgmeal-staging ... DEPLOY_BRANCH=main /usr/local/bin/tgmeal-deploy` — containers built/started, internal checks PASS, final public HTTPS gate FAIL because DNS does not resolve.
- Server post-deploy checks:
  - `tgmeal-staging-api-1` — healthy.
  - `tgmeal-staging-web-1` — running.
  - host-local Traefik TLS health with `--resolve staging-tgmeal.natureonzoom.win:443:127.0.0.1` — PASS; returns `appEnv=staging`, `paymentProvider=mock`, `e2eTestMode=true`.
  - `getent hosts staging-tgmeal.natureonzoom.win` — FAIL; DNS status `2`.
  - production `/api/v1/shops` — PASS.
- DNS after Cloudflare record creation:
  - `dig @1.1.1.1 staging-tgmeal.natureonzoom.win A/AAAA` — PASS; returns Cloudflare proxied addresses.
  - `dig @8.8.8.8 staging-tgmeal.natureonzoom.win A/AAAA` — PASS; returns Cloudflare proxied addresses.
  - local `getent hosts staging-tgmeal.natureonzoom.win` — still NXDOMAIN at check time.
  - server `getent hosts staging-tgmeal.natureonzoom.win` — still NXDOMAIN at check time.
- Public staging checks with explicit resolver workaround:
  - `curl --resolve staging-tgmeal.natureonzoom.win:443:<cloudflare-ip> https://staging-tgmeal.natureonzoom.win/api/v1/health` — PASS.
  - public staging browser checkout smoke with browser host-resolver rule — PASS; evidence `.tasks/TASK-FT018-05/ui-qa-public-fixture-2026-05-13T11-45-44-088Z.json`.

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
| Compose/deploy isolation | `DEPLOYED` | Server deploy used `tgmeal-staging` project, `tgmeal_staging_runtime_data` volume, `tgmeal-staging` Traefik labels and `/srv/tgmeal/staging/app` checkout. Staging containers are running. |
| Public staging DNS | `PARTIAL` | Public resolvers have Cloudflare records; local/server resolvers still return stale NXDOMAIN. |
| Public browser smoke | `PASS_WITH_RESOLVER_WORKAROUND` | Browser checkout happy path passed against the public hostname using a host-resolver rule to bypass stale local DNS cache. |
| Secrets/session leakage | `PASS_WITH_SCOPE_LIMIT` | Reviewed evidence stores cookie names/attributes only. Static search found no tracked token/cookie/session values in reviewed FT-018 evidence; code symbols/placeholders remain expected. |
| Trust-boundary evidence split | `PASS` | Specs, runbooks, fixture reports and task evidence state UI QA/mock payment do not prove Telegram HMAC/replay/WebView or real payment provider correctness. |

## Closure Recommendation Placeholder

- `REQ-037`: keep `planned` or at most `partial/implemented`, not verified.
- FT-018: terminal status recommendation is `STAGING_PUBLIC_SMOKE_PASS_RESOLVER_CACHE_PENDING`, not full `PASS`.
- Repeat public HTTPS health/UI QA smoke without resolver workaround after local/server DNS caches pick up the new Cloudflare record.

## Scope Guard

- Final closure must fail or block if production-negative evidence is absent.
- Final closure must not hide trust-boundary limitations behind browser UI QA success.

## Blockers

- Local and server resolvers still return stale NXDOMAIN for `staging-tgmeal.natureonzoom.win`, although Cloudflare/public resolvers already return records.
- The original deploy script returned non-zero at the final public HTTPS gate for that DNS reason, after containers had already been built and started successfully.
