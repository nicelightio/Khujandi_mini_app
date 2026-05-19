---
description: Read-only diagnosis of checked-in staging Telegram bot courier interactivity runtime path.
status: active
---
# TASK-STAGING-BOT-DIAG-20260519 Code Runtime Report

ROLE: SUBAGENT
TYPE: explorer

## Result

Most likely causes for a real courier sending `/start` or `Курьер` to the staging bot and seeing no inline menu/buttons:

1. Runtime never receives the Telegram update: checked-in Compose defaults disable polling, no checked-in code configures `setWebhook`, and webhook ingress requires a secret when a real bot token is enabled.
2. Runtime receives the update but rejects the sender before sending any message: `/start` and `Курьер` are courier-only and require an active courier staff record whose `telegramId` exactly matches `message.from.id`.
3. Polling path swallows per-update and transport errors without logging or user feedback, so invalid actor, webhook/polling conflict, Telegram API errors, and token/config issues can look like "nothing happens".
4. Staging reset/seed flows can remove courier users; only `operator_orders`/`delivery_happy_path` seed courier `70007`, while default checked-in courier ids are fixed demo ids `70007`/`70008`, not a real courier's Telegram id.

No evidence found that inline keyboard serialization itself is broken: `sendMessage` maps `buttons` to `reply_markup.inline_keyboard` when a real Telegram API client is enabled.

## Owning Boundary

- Owning slices: `delivery-assignment` for courier availability/claim, `delivery-tracking` for status progression.
- Owning contour: `telegram-bot`.
- Touched layers inspected: presentation/runtime adapter plus application/service calls.
- Shared extraction: not justified for this diagnostic task.

## Spec Evidence

- `doc/ARCHITECTURE.md:89-98`: Telegram bot is a monolith presentation channel and must send required notifications.
- `doc/ARCHITECTURE.md:190-194`: `ASSIGNED` means successful claim; Telegram replay must not duplicate domain effects.
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md:69-79`: bot must have `Курьер` menu with active/stop/auto-offer actions.
- `.memory-bank/contracts/telegram-bot-contract.md:24-36`: courier menu baseline and state fields.
- `.memory-bank/contracts/telegram-bot-contract.md:75-85`: inbound courier actions must validate actor and use trusted ingress.
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md:104-111`: staging defaults `TELEGRAM_BOT_POLLING=FALSE`; real smoke requires a real token plus explicit polling or webhook secret.
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md:14-20`: `telegram-bot` in staging is advisory smoke/contract-runtime testing, not UI QA proof.

## Code Path Evidence

### Runtime ingress and transport

- `scripts/dev-api.ts:40-42` passes `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_POLLING`, `TELEGRAM_WEBHOOK_SECRET` into the dev API runtime.
- `docker-compose.yml:19-21` defaults are `TELEGRAM_BOT_TOKEN=test-bot-token`, `TELEGRAM_BOT_POLLING=FALSE`, `TELEGRAM_WEBHOOK_SECRET=`. With defaults, real Telegram interactivity is off.
- `backend/src/dev-runtime/telegram-bot-api.ts:48-75` treats only tokens matching `^\d+:[A-Za-z0-9_-]+$` as real; otherwise it returns a noop API client.
- `backend/src/dev-runtime/dev-api-server.ts:75-78` starts polling only when `telegramBotPollingEnabled === true` and the Telegram API client is enabled.
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts:9-12` mounts only `POST /api/v1/telegram/webhook`.
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts:14-26` requires matching `x-telegram-bot-api-secret-token` when a webhook secret is configured, and requires some secret if a real token is enabled.
- `deploy/nginx/web-container.conf:8-15` proxies `/api/` to the API container, so `/api/v1/telegram/webhook` is externally reachable if Telegram webhook is configured.
- `rg setWebhook/deleteWebhook/getWebhookInfo` found no checked-in webhook management code. Webhook registration must be external/manual.

### `/start` / `Курьер` handling

- `backend/src/dev-runtime/telegram-bot-runtime.ts:31` accepts only exact `"/start"`, `"Курьер"`, and `"курьер"` as courier menu text.
- `backend/src/dev-runtime/telegram-bot-runtime.ts:153-162` extracts `message.from.id` and `message.chat.id`, resolves courier by Telegram id, then sends the menu.
- `backend/src/dev-runtime/telegram-bot-runtime.ts:91-99` uses `deliveryAssignmentModule.controller.getCourierStaffByTelegramUserId(telegramId)` and throws `COURIER_NOT_FOUND` if not active courier staff.
- `backend/src/dev-runtime/telegram-bot-runtime.ts:101-108` sends text `"Курьер"` with three availability buttons.
- `backend/src/dev-runtime/telegram-bot-api.ts:107-123` serializes runtime `buttons` into Telegram `reply_markup.inline_keyboard`.

### Error visibility

- Message-path courier lookup errors occur before the callback `try/catch` block. In webhook mode they are returned as HTTP error JSON by `routes/telegram-bot.routes.ts:37-40`; Telegram users do not see that JSON.
- In polling mode, `backend/src/dev-runtime/telegram-bot-runtime.ts:333-340` catches and ignores any single update error.
- `backend/src/dev-runtime/telegram-bot-runtime.ts:342-343` also catches and ignores Telegram transport errors.
- Therefore a real courier not registered as active staff, an old webhook vs polling conflict, a failed `sendMessage`, or a bad token can all produce no visible courier response.

### Runtime seed/identity mismatch

- `backend/src/dev-runtime/order-ops-runtime.ts:164-182` hard-codes default demo couriers with Telegram ids `70007` and `70008`.
- `backend/src/dev-runtime/order-ops-runtime.ts:762-770` seeds those defaults at runtime creation.
- `backend/src/dev-runtime/staging-test-harness.ts:96-104` reset clears checkout users, sessions and orders.
- `backend/src/dev-runtime/staging-test-harness.ts:360-363` reset calls that checkout reset and operational reset.
- `backend/src/dev-runtime/staging-test-harness.ts:406-414` only `operator_orders` and `delivery_happy_path` seed operator orders/courier state; `checkout_happy` only ensures the client.
- `backend/src/dev-runtime/routes/test-session.routes.ts:198-220` `courier_7` test session only returns metadata and ensures fixed Telegram id `70007`; it does not bind a real Telegram sender.
- `backend/src/dev-runtime/routes/admin-staff.routes.ts:253-264` can create a courier staff record from admin Staff API using `telegram_user_id`; a real courier must be provisioned this way, or otherwise exist in runtime state.

### Tests

- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts:58-91` covers unsigned webhook rejection when a real token is configured.
- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts:93-152` proves menu/buttons only for demo courier Telegram id `70008` through the test dispatcher.
- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts:255-367` proves offer/claim/status callbacks for demo courier `70008`.
- No focused test found for an unregistered real Telegram user receiving a user-facing fallback message.
- No focused test found for actual Telegram polling startup against a real bot, webhook registration, `getWebhookInfo`, or polling/webhook conflict observability.

## Most Likely Failure Modes

1. **Polling disabled and webhook not registered**
   - Defaults disable polling. Runtime exposes a webhook route but does not call Telegram `setWebhook`.
   - If Telegram still has no webhook, or points to another URL, messages reach Telegram but not this app.

2. **Webhook secret mismatch/missing**
   - With a real bot token enabled, checked-in route requires a configured webhook secret and matching Telegram header.
   - If the Telegram webhook was set without `secret_token`, or with a different value, route returns `403` and no menu.

3. **Real courier Telegram id is not in runtime staff**
   - `/start` is not a public help/menu command. It is treated as courier menu and requires exact active courier staff lookup by `from.id`.
   - Demo ids `70007`/`70008` pass tests; a real Telegram user will fail unless provisioned by Staff API or seeded with the same id.

4. **Staging reset removed courier identities**
   - `POST /api/v1/test/reset` clears users. `checkout_happy` seed does not restore courier demo users.
   - After common UI QA reset/seed, courier `/start` can fail until `operator_orders`, `delivery_happy_path`, Staff API, or another provisioning path recreates the courier.

5. **Polling conflicts or Telegram API errors are swallowed**
   - If polling is enabled while a Telegram webhook is still set, Telegram `getUpdates` normally fails. The checked-in loop catches transport errors and does not log.
   - `sendMessage` failures also disappear in polling because per-update errors are swallowed.

## Suggested Next Checks

Read-only/runtime checks, without printing secrets:

1. Check staging env flags inside the API container/process:
   - `APP_ENV`, `NODE_ENV`, `TELEGRAM_BOT_POLLING`, whether `TELEGRAM_BOT_TOKEN` shape is real, and whether `TELEGRAM_WEBHOOK_SECRET` is non-empty.
2. Use Telegram API from a secure shell with the token kept secret:
   - `getMe` to confirm the token/bot.
   - `getWebhookInfo` to confirm URL, pending update count, last error, and whether `secret_token` was configured.
   - If using polling, ensure webhook is deleted; if using webhook, keep polling disabled.
3. Hit the staging webhook with a synthetic sanitized update for the real courier's Telegram numeric id and correct secret header:
   - Expected success: `{"ok":true,"action":"courier_menu"}` and a Telegram `sendMessage`.
   - Expected actor failure: `403 COURIER_NOT_FOUND`/`Telegram user is not an active courier`.
4. Verify runtime staff state via admin Staff API or DB/runtime state: the real courier Telegram user id must exist as role courier, active, not soft-deactivated.
5. After any `POST /api/v1/test/reset`/`seed`, confirm the chosen seed/provisioning path restored courier identity before real bot smoke.
6. Check container logs around `/api/v1/telegram/webhook` and Telegram API outbound errors. Current code likely lacks enough logging, so absence of logs is not proof of success.

## Blockers/Risks

- This was read-only local inspection; no staging server, Telegram API, env, or logs were queried.
- Secrets were not inspected or printed.
- The checked-in health route does not expose Telegram bot enabled/polling/webhook state, so public `/api/v1/health` cannot prove bot readiness.
- Current tests prove the code path with fixed demo ids and a fake dispatcher, not a real Telegram bot transport.

## Recommendation

For immediate diagnosis, decide whether staging should use polling or webhook and verify that one path end-to-end. Then provision the real courier Telegram numeric id as active courier staff and send `/start`.

For a minimal follow-up implementation, add non-secret bot readiness/logging and a user-facing fallback for unknown courier `/start`/`Курьер` instead of silently failing in polling. Keep any behavior change under orchestrator/product approval because `/start` currently has courier-only semantics.
