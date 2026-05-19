---
description: Read-only staging server/runtime diagnostics for Telegram bot courier interactivity on 2026-05-19.
status: final
---
# TASK-STAGING-BOT-DIAG-20260519 Server Runtime Report

## Scope

Role: `SUBAGENT`, type `explorer`.

Task scope was read-only staging diagnostics for Telegram bot courier interactivity:

- project root: `/home/serg/Projects/Khujandi_mini_app`;
- server paths/resources: `/srv/tgmeal/staging/app`, `/var/log/tgmeal/staging`, Docker Compose project `tgmeal-staging`, public health checks;
- no file edits, container restarts, deploys, or state mutations on the server;
- secrets were classified only and not recorded.

## Spec Context

Required context loaded before diagnostics:

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`

Micro-check:

- owning capability: runtime/testing enablement with Telegram bot courier interactivity evidence;
- owning contour: `telegram-bot`, with staging infrastructure contour involvement;
- touched layers: infrastructure/runtime diagnostics and presentation ingress evidence only;
- shared extraction: not applicable; no implementation change was made.

## Code Baseline Relevant To Diagnostics

Inspected code paths:

- `scripts/dev-api.ts`
- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/telegram-bot-api.ts`
- `backend/src/dev-runtime/telegram-bot-runtime.ts`
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts`
- `backend/src/dev-runtime/routes/health.routes.ts`
- `docker-compose.yml`

Important runtime facts from code:

- `TELEGRAM_BOT_TOKEN` enables the real Telegram API client only when it matches the real bot token shape.
- `TELEGRAM_BOT_POLLING=TRUE` starts polling only when the real Telegram API client is enabled.
- `POST /api/v1/telegram/webhook` exists, but with a real Telegram bot runtime it requires `TELEGRAM_WEBHOOK_SECRET`.
- Polling loop catches Telegram transport errors and per-update handler errors without logging them.
- Successful update handling is not logged.

Implication: logs are not reliable evidence for successful or failed polling/update handling unless the process crashes or another layer logs externally.

## Server Checks Run

All server checks were read-only.

- SSH connectivity using ignored local `.env` credentials.
- Staging checkout metadata under `/srv/tgmeal/staging/app`.
- Server `.env` key classification only.
- `docker compose ps` for `COMPOSE_PROJECT_NAME=tgmeal-staging`.
- `docker ps --filter name=tgmeal-staging`.
- `docker inspect` classification for `tgmeal-staging-api-1` env.
- `docker inspect` basic state/health/restart count for `tgmeal-staging-api-1`.
- Public DNS and health checks:
  - `https://staging-tgmeal.natureonzoom.win/api/v1/health`
  - `https://staging-tgmeal.natureonzoom.win/api/v1/shops`
- Webhook route behavior without secret:
  - `POST https://staging-tgmeal.natureonzoom.win/api/v1/telegram/webhook`
- Telegram read-only API checks using the container token:
  - `getWebhookInfo`
  - `getMe`
- Recent Docker logs:
  - `docker logs --since 48h tgmeal-staging-api-1`
  - `docker logs --since 72h tgmeal-staging-api-1`
  - `docker logs --tail 300 tgmeal-staging-api-1`
- Staging log directory listing under `/var/log/tgmeal/staging`.

## Evidence Summary

Diagnostic timestamp:

- Server time: `2026-05-19T22:07:07+07:00`.

Staging checkout:

- Path owner: `tgmeal`.
- Branch: `main`.
- Commit: `b1ca2c4fafd1`.
- Origin: `https://github.com/nicelightio/Khujandi_mini_app.git`.
- Working tree status line count: `0`.
- Running `git` as root hit Git `safe.directory` protection; read-only retry as checkout owner succeeded.

Server `.env` classifications:

- `TGMEAL_HOST=staging-tgmeal.natureonzoom.win`
- `TRAEFIK_ROUTER_PREFIX=tgmeal-staging`
- `TGMEAL_RUNTIME_VOLUME=tgmeal_staging_runtime_data`
- `TGMEAL_RUNTIME_DIR=/var/lib/khujandi-staging`
- `ADMIN_ALLOWED_ORIGINS=https://staging-tgmeal.natureonzoom.win`
- `APP_ENV=staging`
- `NODE_ENV=staging`
- `DEBUG=TRUE`
- `PAYMENT_PROVIDER=mock`
- `E2E_TEST_MODE=TRUE`
- `E2E_TEST_TOKEN=present`
- `ADMIN_DB_PATH=/var/lib/khujandi-staging/admin-access-runtime.sqlite`
- `CATALOG_DB_PATH=/var/lib/khujandi-staging/catalog-runtime.sqlite`
- `TELEGRAM_BOT_TOKEN=real-looking`
- `TELEGRAM_BOT_POLLING=TRUE`
- `TELEGRAM_WEBHOOK_SECRET=missing_or_empty`
- `DATABASE_URL=missing_or_empty`

Running API container env classifications:

- `HOST=0.0.0.0`
- `PORT=3001`
- `APP_ENV=staging`
- `NODE_ENV=staging`
- `DEBUG=TRUE`
- `PAYMENT_PROVIDER=mock`
- `E2E_TEST_MODE=TRUE`
- `E2E_TEST_TOKEN=present`
- `ADMIN_ALLOWED_ORIGINS=https://staging-tgmeal.natureonzoom.win`
- `ADMIN_DB_PATH=/var/lib/khujandi-staging/admin-access-runtime.sqlite`
- `CATALOG_DB_PATH=/var/lib/khujandi-staging/catalog-runtime.sqlite`
- `TELEGRAM_BOT_TOKEN=real-looking`
- `TELEGRAM_BOT_POLLING=TRUE`
- `TELEGRAM_WEBHOOK_SECRET=missing_or_empty`
- `DATABASE_URL=present`
- `TGMEAL_HOST=missing_or_empty` in the API container, which is expected because `TGMEAL_HOST` is used by Compose/Traefik labels rather than by the API process.

Compose/container state:

- `tgmeal-staging-api-1`: running, healthy, up 2 days.
- `tgmeal-staging-web-1`: running, up 2 days.
- API container inspect:
  - image: `tgmeal-staging-api`;
  - state: `running`;
  - health: `healthy`;
  - started: `2026-05-17T13:30:41.067516868Z`;
  - restart count: `0`.

Public health:

- DNS resolved to a Cloudflare address.
- `/api/v1/health` returned:
  - `ok=true`
  - `appEnv=staging`
  - `nodeEnv=staging`
  - `debug=true`
  - `paymentProvider=mock`
  - `e2eTestMode=true`
  - `version=dev`
- `/api/v1/shops` returned HTTP `200`.

Telegram transport:

- Server env and container env both indicate polling is configured: `TELEGRAM_BOT_POLLING=TRUE` and `TELEGRAM_BOT_TOKEN=real-looking`.
- Telegram `getMe` returned HTTP `200`, so the configured token is not only real-looking but accepted by Telegram at check time.
- Telegram bot identity from `getMe`: `TgMeal Staging`, username `staging_khujandi_bot`.
- Telegram `getWebhookInfo` returned:
  - `url=""`;
  - `pending_update_count=0`;
  - `allowed_updates=["message","callback_query"]`.
- Therefore Telegram webhook is not configured at Telegram side.
- Public webhook route without secret returned HTTP `403`.
- Because `TELEGRAM_WEBHOOK_SECRET` is missing and real bot runtime is enabled, the route is intentionally not usable for real Telegram webhook ingress in this configuration.

Logs:

- `docker logs --tail 300 tgmeal-staging-api-1` contained only startup/runtime warnings and `Demo API listening on http://0.0.0.0:3001`.
- `docker logs --since 48h tgmeal-staging-api-1` had `0` non-empty lines.
- `docker logs --since 72h tgmeal-staging-api-1` had `11` non-empty lines, with:
  - `telegram_mentions=0`;
  - `error_mentions=0`;
  - relevant line: `Demo API listening on http://0.0.0.0:3001`.
- No log evidence was found for courier message handling, webhook handling, polling startup, polling failures, callback handling, courier claim handling, or Telegram API transport failures.
- Staging deploy logs exist under `/var/log/tgmeal/staging`, latest listed deploy logs from `2026-05-17`.

## Result

The live staging API container is configured for Telegram long polling, not webhook ingress:

- `TELEGRAM_BOT_TOKEN` is present, real-looking, and accepted by Telegram (`getMe` HTTP `200`);
- `TELEGRAM_BOT_POLLING=TRUE` is present in both server `.env` and running API container env;
- Telegram `getWebhookInfo` reports no webhook URL;
- `TELEGRAM_WEBHOOK_SECRET` is missing, and the public webhook route correctly rejects real-runtime webhook requests without the secret.

The running container did pick up the relevant staging and Telegram env. Public staging health is good and the API container is healthy.

No logs prove that a courier message was handled. No logs show Telegram update failures either. Given the inspected code, this is expected: polling startup, successful update handling, Telegram transport errors, and per-update handler errors are not logged.

## Most Likely Live-Runtime Failure Modes

1. Silent handler failure for an unrecognized courier Telegram identity.
   - `/start` or `Курьер` requires the Telegram `from.id` to match an active courier staff record.
   - For message updates, `COURIER_NOT_FOUND` is thrown from the runtime.
   - In polling mode, that per-update error is swallowed by the polling loop without log output or user-visible response.

2. Silent Telegram transport failure.
   - `getUpdates` errors are caught and retried without logging.
   - If Telegram rejects polling intermittently or another consumer conflicts, current logs may remain clean.

3. Misaligned expectation of webhook vs polling.
   - Staging is configured for polling.
   - Telegram-side webhook URL is empty.
   - Public webhook ingress rejects without `TELEGRAM_WEBHOOK_SECRET`.
   - Any test expecting webhook delivery will not work in this runtime shape.

4. No observability for successful updates.
   - Even if polling is working and consumes courier messages, Docker logs will not show update receipt or action result.
   - `pending_update_count=0` can mean messages were consumed by polling, but it can also mean no messages are pending. It is not enough to prove interactive behavior.

5. Process was restarted after any earlier interaction evidence.
   - Current API container started on `2026-05-17T13:30:41Z`.
   - Docker logs available from this container do not include Telegram interaction evidence.

## Blockers / Risks

- Read-only scope prevented sending a controlled Telegram message, changing env, setting webhook, restarting the container, or adding temporary logging.
- Current code intentionally suppresses the exact evidence needed to distinguish "polling is healthy but no messages arrived" from "messages arrived and failed inside handler".
- I did not mutate staging state by creating test sessions or staff records.
- I did not print or record token/password/DSN values.

## Recommendation

For immediate human smoke:

1. Treat staging as polling-only.
2. Have the courier send `/start` or `Курьер` to `staging_khujandi_bot`.
3. Use a courier Telegram account whose numeric Telegram id is already present as an active courier staff record in staging.
4. If the bot stays silent, the leading suspicion is actor mismatch or another swallowed polling/handler error, not missing env.

For the next implementation/ops fix:

- Add minimal sanitized logs around Telegram polling startup, `getUpdates` error class, update receipt/action result, and `AppError` code from `handleUpdate`.
- Log only non-secret metadata: `update_id`, update kind, action, AppError code, and courier lookup outcome classification; do not log token, raw payload, chat text, or full Telegram profile.
- Consider returning a user-visible "not registered as active courier" response for `/start`/`Курьер` when the Telegram actor is unknown in staging, while preserving production security constraints.
