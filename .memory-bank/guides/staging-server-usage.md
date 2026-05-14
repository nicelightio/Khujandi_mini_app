---
description: Практический guide для использования local/server staging, test personas, reset/seed и UI QA workflow.
status: active
---
# Staging Server Usage

## Purpose

Этот guide отвечает на практический вопрос: как пользоваться staging после реализации `FT-018`.

Нормативные детали живут в:

- [.memory-bank/runbooks/staging-runtime-and-ui-qa.md](../runbooks/staging-runtime-and-ui-qa.md): полный operational runbook.
- [.memory-bank/contracts/staging-test-auth-harness-contract.md](../contracts/staging-test-auth-harness-contract.md): контракт test auth endpoints.
- [.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md](../features/FT-018-staging-runtime-and-test-auth-harness.md): feature boundaries.

## Current Status

`FT-018` реализован и развернут на server staging:

- runtime mode guards, reset/seed endpoints and fixed-persona session endpoints exist;
- repo-local UI QA fixture exists;
- Playwright is a repo `devDependency`;
- checkout browser smoke can use the fixed-persona HttpOnly cookie session without Telegram auth only when backend bootstrap returns `testSessionAuthAvailable=true`;
- staging checkout exists at `/srv/tgmeal/staging/app`, Compose project is `tgmeal-staging`, runtime volume is `tgmeal_staging_runtime_data`;
- public staging URL is `https://staging-tgmeal.natureonzoom.win`;
- Cloudflare DNS is configured, but individual local/server resolvers can temporarily keep stale `NXDOMAIN`; run the DNS preflight below before treating public URL failures as application failures.

## Mode Flags

Staging включается явными runtime flags:

```bash
APP_ENV=staging
NODE_ENV=staging
DEBUG=TRUE
PAYMENT_PROVIDER=mock
E2E_TEST_MODE=TRUE
E2E_TEST_TOKEN=<secret>
```

Правило:

- `APP_ENV=staging` говорит, что это staging runtime.
- `E2E_TEST_MODE=TRUE` включает test auth/reset/seed surface.
- `PAYMENT_PROVIDER=mock` включает mock payment только в разрешенном non-production runtime.
- `NODE_ENV=production` всегда запрещает mock payment и test auth.
- `NODE_ENV` не должен быть смысловым переключателем mock payment; staging/test режим задается через `APP_ENV` и `E2E_TEST_MODE`.

## Local Staging

Local staging нужен для быстрой проверки с host OS: один терминал для API, второй для frontend.

### Start API

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

### Start Frontend

```bash
DEBUG=TRUE npm run dev:frontend
```

### Open

```text
http://127.0.0.1:5173
```

### Health

```bash
curl -fsS http://127.0.0.1:5173/api/v1/health
```

Expected non-secret facts:

- `appEnv=staging`
- `nodeEnv=staging`
- `paymentProvider=mock`
- `e2eTestMode=true`

## Server Staging

Server staging is a separate deployment from production.

Target layout:

```text
/srv/tgmeal/staging/app
```

Expected server identity:

```text
host: staging-tgmeal.natureonzoom.win
compose project: tgmeal-staging
runtime volume: tgmeal_staging_runtime_data
logs: /var/log/tgmeal/staging
```

Staging `.env` lives in:

```text
/srv/tgmeal/staging/app/.env
```

Required shape:

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
E2E_TEST_TOKEN=<secret-outside-docs>
ADMIN_DB_PATH=/var/lib/khujandi-staging/admin-access-runtime.sqlite
CATALOG_DB_PATH=/var/lib/khujandi-staging/catalog-runtime.sqlite
TELEGRAM_BOT_TOKEN=test-bot-token
```

Deploy command shape:

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

Do not run this against production `/srv/tgmeal/app`.

Current staging deploy follows the approved GitHub checkout flow from `main`. Use another `DEPLOY_BRANCH` only after the branch is explicitly approved for staging.

DNS/public URL preflight:

```bash
dig +short staging-tgmeal.natureonzoom.win
curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/health
```

If the local resolver still returns `NXDOMAIN`, compare with public resolvers such as `1.1.1.1`/`8.8.8.8` and record the run as resolver-blocked. The standard UI QA fixture expects normal system DNS because API reset/seed/session setup runs through Node fetch before Playwright opens the browser.

## Reset And Seed

Reset staging before a repeatable QA run:

```bash
export UI_QA_BASE_URL=https://staging-tgmeal.natureonzoom.win
export E2E_TEST_TOKEN=<secret>

curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/test/reset" \
  -H "content-type: application/json" \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"scope":"all"}'
```

Seed a workflow:

```bash
curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/test/seed" \
  -H "content-type: application/json" \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"scenario":"checkout_happy"}'
```

Useful scenarios:

- `baseline_catalog`
- `checkout_happy`
- `seller_owned_shop`
- `operator_orders`
- `delivery_happy_path`

## Login As Test Persona

Use fixed personas only.

```bash
curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/test/session" \
  -H "content-type: application/json" \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"persona":"client_alina"}'
```

Available persona keys:

- `client_alina`: customer Mini App workflow.
- `seller_plov`: seller-owned storefront/status workflow.
- `admin_boss`: admin/operator web workflow.
- `operator`: controlled unsupported unless the deployed runtime exposes it through `GET /api/v1/test/personas`.
- `courier_7`: courier runtime workflow, not real Telegram verification.

The response must not include cookie values. Browser/Playwright should keep `Set-Cookie` headers in its context.

## Human QA Workflow

Recommended order:

1. Open staging URL.
2. Check `/api/v1/health`.
3. Reset and seed `checkout_happy`.
4. Bootstrap `client_alina`.
5. Run catalog -> cart -> checkout -> mock payment -> order tracking.
6. Bootstrap `seller_plov`.
7. Check seller-owned shop/status surface.
8. Bootstrap `admin_boss`.
9. Check admin/operator panel and allowed operations.

Route checklist:

- Customer Mini App: `/`, `/shops`, `/shops/:publicPath`, `/checkout`, `/tracking?orderId=...&cursor=...`.
- Seller web: `/seller/shops/status`.
- Admin web: `/admin`, `/admin/login`, `/admin/catalog/shops/provision`, `/admin/orders/assignment`, `/admin/orders/cancellation`.

## UI QA Inputs

Give `ui_qa`:

```bash
UI_QA_BASE_URL=https://staging-tgmeal.natureonzoom.win
E2E_TEST_TOKEN=<secret>
```

Do not put `E2E_TEST_TOKEN` into Memory Bank, screenshots, task reports or chat logs.

For local developer runs the token may live in ignored `.env`; load it into the process environment without printing it.

Repo-local fixture handoff:

```bash
UI_QA_BASE_URL="$UI_QA_BASE_URL" \
E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
UI_QA_SCENARIO=checkout_happy \
UI_QA_PERSONA=client_alina \
node tests/e2e/staging-ui-qa-fixture.mjs api-smoke
```

This fixture prepares deterministic UI QA state by calling health, reset, seed, personas and fixed-persona session endpoints. It writes sanitized evidence under `.tasks/TASK-FT018-05/` and records cookie names/attributes only.

When Playwright is available locally:

```bash
UI_QA_BASE_URL="$UI_QA_BASE_URL" \
E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
node tests/e2e/staging-ui-qa-fixture.mjs browser-smoke
```

If Playwright or a reachable staging runtime is missing, mark browser smoke `BLOCKED/NOT RUN` with the exact prerequisite instead of using a Telegram auth or payment shortcut.

## What Staging Can Prove

Staging UI QA can prove:

- user-visible browser workflows;
- same-origin cookie behavior;
- fixed-persona session bootstrap;
- mock payment happy path;
- reset/seed repeatability;
- admin/seller/client route integration.

Staging UI QA cannot prove:

- Telegram raw `initData` HMAC correctness;
- expired `auth_date` rejection;
- replay guard;
- real Telegram WebView behavior;
- real payment provider callbacks.
- real payment provider trust or settlement.

Those checks stay in contract/runtime tests and advisory Android Telegram smoke.

## Never Do

- Do not enable `E2E_TEST_MODE=TRUE` in production.
- Do not enable `PAYMENT_PROVIDER=mock` in production.
- Do not reuse production volumes or database for staging.
- Do not accept arbitrary `telegramId`, `userId`, `role` or `shopId` in test session body.
- Do not print session cookies, test token, bot token or database URL.
- Do not run destructive Docker cleanup for staging.
- Do not touch PhotoChanger, Traefik config or unrelated host services while deploying staging.

## Troubleshooting

If `/api/v1/test/session` returns `404`:

- check `E2E_TEST_MODE=TRUE`;
- check `NODE_ENV` is not `production`;
- check the route exists in the deployed commit.

If it returns `403`:

- check `X-E2E-Test-Token`;
- check the token comes from staging secret config.

If checkout cannot create a mock paid order:

- check `PAYMENT_PROVIDER=mock`;
- check production guard did not disable mock mode;
- check a valid seeded composition and fixed-persona session exist.

If data looks stale:

- run reset/seed again;
- verify staging uses `tgmeal_staging_runtime_data`, not production volume;
- verify local staging uses `.runtime/staging/*`, not regular dev paths.
