---
description: Runbook staging runtime, server staging deploy outline и UI QA workflow.
status: active
---
# Staging Runtime And UI QA

## Purpose

Describe how the staging server should look, how to run the same staging profile locally, and how humans or `ui_qa` use it safely.

This runbook is normative for `FT-018` implementation. It is not a production deploy runbook.

## Staging Principles

- Staging is explicit non-production runtime.
- Staging has separate state, volumes and database paths from production.
- Staging may use guarded mock payment.
- Staging may expose test auth harness only under `E2E_TEST_MODE=TRUE`.
- Production auth/payment trust boundaries are not weakened.
- UI QA evidence is separated from Telegram auth correctness evidence.

## Local Host-OS Staging

Use this profile for fast implementation and Playwright runs from a developer machine.

Local secret source:

```bash
set -a
. ./.env
set +a
```

`.env` is ignored and may contain `E2E_TEST_TOKEN`. Do not print token values.

API:

```bash
mkdir -p .runtime/staging

APP_ENV=staging NODE_ENV=staging DEBUG=TRUE PAYMENT_PROVIDER=mock \
E2E_TEST_MODE=TRUE E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
HOST=127.0.0.1 PORT=3001 \
ADMIN_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173 \
ADMIN_DB_PATH=$PWD/.runtime/staging/admin-access.sqlite \
CATALOG_DB_PATH=$PWD/.runtime/staging/catalog-runtime.sqlite \
npm run dev:api
```

Frontend:

```bash
DEBUG=TRUE npm run dev:frontend
```

Expected local URLs:

- frontend: `http://127.0.0.1:5173`
- API health: `http://127.0.0.1:5173/api/v1/health`

Local reset flow:

```bash
curl -fsS -X POST http://127.0.0.1:5173/api/v1/test/reset \
  -H 'content-type: application/json' \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"scope":"all"}'

curl -fsS -X POST http://127.0.0.1:5173/api/v1/test/seed \
  -H 'content-type: application/json' \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"scenario":"checkout_happy"}'
```

## Server Staging Target

Target layout:

- App user: `tgmeal`.
- App checkout: `/srv/tgmeal/staging/app`.
- Compose file: `/srv/tgmeal/staging/app/docker-compose.yml`.
- Compose project: `tgmeal-staging`.
- Public host: `staging-tgmeal.natureonzoom.win` or an equivalent staging-only host.
- Runtime volume: `tgmeal_staging_runtime_data`.
- Logs: `/var/log/tgmeal/staging`.
- Public edge: existing Traefik via external Docker network `web`.

Required env in `/srv/tgmeal/staging/app/.env`:

```bash
TGMEAL_HOST=staging-tgmeal.natureonzoom.win
TRAEFIK_ROUTER_PREFIX=tgmeal-staging
TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data
TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging
ADMIN_ALLOWED_ORIGINS=https://staging-tgmeal.natureonzoom.win
APP_ENV=staging
NODE_ENV=staging
DEBUG=TRUE
PAYMENT_PROVIDER=mock
E2E_TEST_MODE=TRUE
E2E_TEST_TOKEN=replace-with-secret-outside-docs
ADMIN_DB_PATH=/var/lib/khujandi-staging/admin-access-runtime.sqlite
CATALOG_DB_PATH=/var/lib/khujandi-staging/catalog-runtime.sqlite
TELEGRAM_BOT_TOKEN=test-bot-token
```

Never put `E2E_TEST_TOKEN`, real Telegram bot token, `DATABASE_URL` or other secrets into Memory Bank.

## Server Deploy Outline

Server staging should reuse the current Compose/Traefik deploy pattern, but must parameterize production-specific names.

Before deploy, run Docker Compose render checks from clean GitHub checkouts. Current project rule: do not use local dirty files as server deploy/render evidence and do not copy development files manually to the server. Staging render belongs on the production host once `/srv/tgmeal/staging/app` exists as a clean checkout containing the staging-aware Compose/deploy changes.

Command shape:

```bash
APP_DIR=/srv/tgmeal/staging/app \
COMPOSE_PROJECT_NAME=tgmeal-staging \
TGMEAL_HOST=staging-tgmeal.natureonzoom.win \
TRAEFIK_ROUTER_PREFIX=tgmeal-staging \
TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data \
TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging \
LOG_DIR=/var/log/tgmeal/staging \
DEPLOY_BRANCH=main \
/usr/local/bin/tgmeal-deploy
```

The current staging target is deployed from GitHub `main`. Use a different `DEPLOY_BRANCH` only after it is explicitly approved for staging.

Implementation must ensure:

- Docker labels do not collide with production router/service/middleware names.
- Compose volume names do not collide with production.
- Runtime mount and SQLite paths point at the staging runtime directory, not production `/var/lib/khujandi`.
- Health checks target staging host.
- Deploy script still refuses dirty checkout and non-GitHub remotes.
- No PhotoChanger, Traefik config, production `tgmeal` containers, production volumes or production DB are modified.

## Health Checks

Required checks:

```bash
dig +short staging-tgmeal.natureonzoom.win
curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/health
curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/shops
```

Expected health facts:

- `appEnv=staging`
- `nodeEnv=staging`
- `paymentProvider=mock`
- `e2eTestMode=true`
- no secrets or session values

Production host health must remain separate:

```bash
curl -fsS https://tgmeal.natureonzoom.win/api/v1/health
```

Production response must not expose test mode.

DNS note:

- Standard Playwright staging QA expects normal system DNS resolution for `staging-tgmeal.natureonzoom.win`.
- If local/server DNS still returns stale `NXDOMAIN`, compare public resolvers such as `1.1.1.1`/`8.8.8.8` and record the run as resolver-blocked.
- Do not count a browser-only host resolver override as full fixture evidence because reset/seed/session setup runs through Node fetch before the browser starts.

## UI QA Workflow

Inputs for `ui_qa`:

- `UI_QA_BASE_URL=https://staging-tgmeal.natureonzoom.win`
- `E2E_TEST_TOKEN` from ignored local file, CI secret, or orchestrator-provided secret.

Repo-local fixture:

```bash
UI_QA_BASE_URL="$UI_QA_BASE_URL" \
E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
UI_QA_SCENARIO=checkout_happy \
UI_QA_PERSONA=client_alina \
node tests/e2e/staging-ui-qa-fixture.mjs api-smoke
```

The fixture performs health, reset, seed, personas and fixed-persona session bootstrap, then writes sanitized evidence to `.tasks/TASK-FT018-05/`. It records cookie names/attributes only and does not print token, cookie values, session values, raw `initData`, payment secrets or database URLs.

`playwright` is a repo `devDependency`. Browser smoke also requires Playwright browser binaries/runtime on the runner, for example Chromium installed through Playwright.

The same fixture can preserve fixed-persona cookies into a browser context and run the guarded checkout path:

```bash
UI_QA_BASE_URL="$UI_QA_BASE_URL" \
E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke
```

The checkout browser path must use the fixed-persona HttpOnly cookie session from `POST /api/v1/test/session`. It may skip Telegram auth only when checkout bootstrap returns `testSessionAuthAvailable=true` for guarded staging/test runtime. Do not forge Telegram `initData` or introduce another auth shortcut.

If Playwright browser runtime is missing, record the fixture `BLOCKED` evidence instead of using Telegram `initData` forging or another auth shortcut.

Session bootstrap:

```bash
curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/test/session" \
  -H "content-type: application/json" \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"persona":"client_alina"}'
```

Playwright should preserve returned cookies in browser context. The JSON response must not contain cookie values.

Recommended UI QA sequence:

1. `POST /api/v1/test/reset`.
2. `POST /api/v1/test/seed` with `checkout_happy`.
3. Bootstrap `client_alina`.
4. Browse storefront, add product, checkout with mock payment, open customer tracking.
5. Bootstrap `admin_boss`.
6. Verify admin/operator panel visibility and allowed operations.
7. Bootstrap `seller_plov`.
8. Verify seller-owned storefront/status workflow.

Route checklist:

- Customer Mini App: `/`, `/shops`, `/shops/:publicPath`, `/checkout`, `/tracking?orderId=...&cursor=...`.
- Seller web: `/seller/shops/status`.
- Admin web: `/admin`, `/admin/login`, `/admin/catalog/shops/provision`, `/admin/orders/assignment`, `/admin/orders/cancellation`.

Persona note:

- Treat `GET /api/v1/test/personas` as the source of truth for the deployed runtime.
- `operator_manager` is not guaranteed; if the endpoint reports it as unsupported, use `admin_boss` for admin/operator web checks and record operator-specific browser coverage as not applicable for that runtime.

## Evidence Split

UI QA evidence may prove:

- frontend routing and browser-visible workflows;
- same-origin cookie behavior in staging;
- guarded mock payment happy path;
- admin/seller/client workflow ergonomics;
- regression-free reset/seed lifecycle.

UI QA evidence does not prove:

- Telegram raw `initData` signature correctness;
- `auth_date` expiration/replay handling;
- real Telegram WebView runtime behavior;
- real payment provider trust, callbacks or settlement.

Those checks remain in:

- [.memory-bank/runbooks/telegram-mini-app-verification.md](telegram-mini-app-verification.md): Telegram runtime/advisory smoke.
- [.memory-bank/runbooks/e2e-mock-payment.md](e2e-mock-payment.md): mock payment boundary.
- auth/payment contract/runtime tests for negative trust cases.

## Reset And Seed Policy

Staging reset may delete or recreate only staging-owned state:

- `.runtime/staging/*` for local host-OS profile;
- `tgmeal_staging_runtime_data` for server staging profile;
- in-memory runtime state.

Staging reset must not:

- delete production volumes;
- run `docker system prune`;
- remove shared Traefik network;
- touch PhotoChanger resources;
- touch production database.

Seed data lifecycle:

- deterministic baseline seed after reset;
- fixed personas only;
- fixed shops/products/orders for repeatable tests;
- safe test audit events only;
- no real user identities.

## Security Constraints

- Test token is a secret and is never printed in docs or logs.
- Test routes return `404` outside enabled staging mode.
- Production startup refuses test auth/mock payment combinations.
- Session cookies stay HttpOnly.
- No session id or cookie value is returned in JSON.
- Raw Telegram `initData`, payment secrets and database URLs are never logged.

## Source Artifacts

- [.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md](../features/FT-018-staging-runtime-and-test-auth-harness.md): feature scope.
- [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md): test auth contract.
- [.memory-bank/testing/staging-ui-qa.md](../testing/staging-ui-qa.md): testing/evidence rules.
- [.memory-bank/runbooks/telegram-mini-app-container-deploy.md](telegram-mini-app-container-deploy.md): production deploy path to adapt safely for staging.
- [.memory-bank/architecture/deployment-and-runtime-topology.md](../architecture/deployment-and-runtime-topology.md): deployment topology and co-tenancy constraints.
