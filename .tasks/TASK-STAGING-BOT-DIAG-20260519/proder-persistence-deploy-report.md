---
description: Proder commit/push/deploy report for non-production runtime persistence staging rollout.
status: complete
---
# Proder Persistence Deploy Report

## Result

PASS. Non-production runtime persistence fix was committed, pushed to GitHub `main`, and deployed to staging `https://staging-tgmeal.natureonzoom.win`.

Final deployed commit:

- `583a3c8afe7f06c4f9be71708c8e83b199aa7cce` - `Derive runtime database paths from volume mount`

Implementation commit included in the deployed history:

- `14ebba66453c8cb1c1d12d5f08cd793cdffb4942` - `Persist nonprod runtime state`

## Scope And Boundary

- Role: `SUBAGENT implementer`, Proder.
- Target: staging only.
- Server checkout: `/srv/tgmeal/staging/app`.
- Deploy source: GitHub `origin/main`, branch `main`.
- Compose project: `tgmeal-staging`.
- Public host: `staging-tgmeal.natureonzoom.win`.
- Owning capability: runtime/testing enablement for `FT-018`.
- Contours touched: non-production `mini-app`, `admin-web`, `telegram-bot` runtime/test harness surfaces.
- Layers touched: dev-runtime infra/adapters, runtime composition, staging test harness routes, tests and Memory Bank docs.
- Shared extraction: not introduced.

Requested local `.agents/skills/proder/SKILL.md` was absent because `.agents/` does not exist in this checkout. Deployment safety followed `AGENTS.md`, `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`, existing Proder report precedent and project deploy boundaries.

## Files Committed

Implementation commit `14ebba6`:

- `.env.example`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/index.md`
- `.tasks/TASK-STAGING-BOT-DIAG-20260519/nonprod-runtime-persistence-implementation-report.md`
- `backend/src/dev-runtime/checkout-payment-runtime.ts`
- `backend/src/dev-runtime/checkout-payment-runtime-persistence.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/dev-runtime/order-ops-runtime-persistence.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `scripts/dev-api.ts`
- `docker-compose.yml`
- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts`

Follow-up deploy-safety commit `583a3c8`:

- `docker-compose.yml`

Pre-existing unrelated dirty files were not staged or committed:

- `AGENTS.md`
- `.memory-bank/guides/server-deploy-and-rollout.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`

## Checks Run

Local:

- `git diff --check` - PASS.
- `npx tsc --noEmit -p tsconfig.jest.json` - PASS.
- `git diff --cached --check` before each commit - PASS.
- Exact staging allowlist was used for `git add`; unrelated local dirty files and unrelated `.tasks` diagnostics were left unstaged.

Darwin implementation report also records broader focused test coverage:

- focused admin-access runtime spec;
- focused checkout/payment runtime test-state spec;
- admin-access, delivery-assignment, order-cancellation, delivery-tracking, checkout-payment and catalog runtime gates;
- lint and TypeScript.

## Deploy Commands

Command shape used through SSH, with credentials and secrets loaded from ignored `.env` and not printed:

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

## Deploy Result And Evidence

Preflight:

- Docker and firewalld were active.
- Docker network `web` existed.
- Staging checkout was clean on `main`.
- Existing shared containers were inspected only; no PhotoChanger, Traefik config or production TgMeal resources were modified.
- Non-secret staging flags showed `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=TRUE`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=TRUE`, `TELEGRAM_BOT_POLLING=TRUE`.

Deploy:

- First deploy fast-forwarded staging from `4532702` to `14ebba6`.
- Compose render then exposed a path fallback bug: new `CHECKOUT_PAYMENT_DB_PATH` and `OPERATIONAL_RUNTIME_DB_PATH` defaulted to `/var/lib/khujandi/...` instead of the staging runtime mount.
- Fixed this in `583a3c8` by deriving all runtime DB path defaults from `TGMEAL_RUNTIME_DIR`.
- Second deploy fast-forwarded staging from `14ebba6` to `583a3c8` and completed successfully.
- Deploy log: `/var/log/tgmeal/staging/deploy-2026-05-20_034533.log`.

Post-deploy verification:

- Deployed commit: `583a3c8afe7f06c4f9be71708c8e83b199aa7cce`.
- Server git status: `## main...origin/main`.
- Compose status:
  - `tgmeal-staging-api-1`: `Up`, `healthy`, port `3001/tcp`.
  - `tgmeal-staging-web-1`: `Up`, port `80/tcp`.
- Runtime DB paths inside the running API container:
  - `ADMIN_DB_PATH=/var/lib/khujandi-staging/admin-access-runtime.sqlite`
  - `CATALOG_DB_PATH=/var/lib/khujandi-staging/catalog-runtime.sqlite`
  - `CHECKOUT_PAYMENT_DB_PATH=/var/lib/khujandi-staging/checkout-payment-runtime.sqlite`
  - `OPERATIONAL_RUNTIME_DB_PATH=/var/lib/khujandi-staging/operational-runtime.sqlite`
- Public health:
  - `ok=true`
  - `appEnv=staging`
  - `nodeEnv=staging`
  - `debug=true`
  - `paymentProvider=mock`
  - `e2eTestMode=true`
- Public shops:
  - `GET /api/v1/shops` returned HTTP 200 with 2 seed shops.
- Telegram polling telemetry:
  - `{"scope":"telegram-bot-runtime","event":"telegram.polling.started"}`.

## Blockers / Risks

- `.agents/skills/proder/SKILL.md` was missing. Fallback was safe because project runbooks and prior Proder report covered the deploy protocol.
- Public HTTPS root check returned one transient `404` during each Traefik provider refresh, then passed on retry. This matches prior staging deploy behavior.
- Telegram polling startup is verified; no new live Telegram update was sent during this deployment.
- Local Docker CLI was not available, so compose render validation was performed by the server deploy script and verified from server output.

## Local Files Changed After Run

This report was added locally:

- `.tasks/TASK-STAGING-BOT-DIAG-20260519/proder-persistence-deploy-report.md`

Other local dirty/untracked files still present after the run are pre-existing unrelated artifacts unless explicitly listed above.

## Recommendation

Keep staging on `583a3c8`. For the next validation step, run the guarded reset/seed plus a restart persistence smoke on staging, then send a real staging bot `/start` or `Курьер` action from a mapped courier account to capture update-processing telemetry beyond startup.
