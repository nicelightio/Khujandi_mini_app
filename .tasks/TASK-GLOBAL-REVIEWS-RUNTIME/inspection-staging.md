# Inspection: staging UI QA fixture + server readiness for fresh checkout/order/reviews runtime

Role: SUBAGENT / explorer-tester  
Scope: inspection only; no source code edits. This file is the requested operational artifact under `.tasks/`.

## Spec/context loaded

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- FT-018 docs:
  - `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
  - `.memory-bank/contracts/staging-test-auth-harness-contract.md`
  - `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
  - `.memory-bank/testing/staging-ui-qa.md`

## Architecture/scope note

- Owning capability for reset/seed/session fixture: `runtime/testing enablement` (`FT-018`), not product behavior.
- Product slices involved in the target global flow: `catalog`, `checkout-payment`, `delivery-assignment`, `delivery-tracking`, `reviews-feedback`, `admin-access`/`staff panel`.
- Contours involved: `mini-app`, `admin-web`, `telegram-bot`.
- This inspection did not justify any `shared` extraction.

## Public staging readiness checks run

Commands run from repo root:

```bash
git status --short --branch

set -euo pipefail
printf 'DNS: '; getent hosts staging-tgmeal.natureonzoom.win || true
printf '\nHEALTH:\n'; curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/health
printf '\nSHOPS HEAD:\n'; curl -fsS https://staging-tgmeal.natureonzoom.win/api/v1/shops | python3 -c 'import sys,json; data=json.load(sys.stdin); print(json.dumps(data if not isinstance(data, list) else data[:2], ensure_ascii=False)[:1200])'
printf '\nPERSONAS no token status:\n'; curl -sS -o /tmp/personas.out -w '%{http_code}\n' https://staging-tgmeal.natureonzoom.win/api/v1/test/personas; head -c 300 /tmp/personas.out || true
printf '\nTEST SESSION no token status:\n'; curl -sS -o /tmp/session.out -w '%{http_code}\n' -X POST https://staging-tgmeal.natureonzoom.win/api/v1/test/session -H 'content-type: application/json' --data '{"persona":"client_alina"}'; head -c 300 /tmp/session.out || true
```

Observed:

- Git before artifact write: `## main...origin/main`.
- DNS resolves for `staging-tgmeal.natureonzoom.win`.
- Health response:

```json
{"ok":true,"appEnv":"staging","nodeEnv":"staging","debug":true,"paymentProvider":"mock","e2eTestMode":true,"version":"dev"}
```

- `/api/v1/shops` public read works and returned at least:
  - `shop-1`: `Плов в парке Сомони`, publicPath `plov-v-parke-somoni`
  - `shop-2`: `Бобоча самбуса`, publicPath `bobocha-sambуса` in shell output as `bobocha-sambusa`
- Token guard works for public test endpoints without token:
  - `GET /api/v1/test/personas` => `403`, `Test runtime token is required`
  - `POST /api/v1/test/session` => `403`, `Test runtime token is required`

I did not have `E2E_TEST_TOKEN` in the execution environment, so I did not run destructive reset/seed against public staging.

## Current fixture behavior inspected

File: `tests/e2e/staging-ui-qa-fixture.mjs`

- Inputs:
  - `UI_QA_BASE_URL` required.
  - `E2E_TEST_TOKEN` required; fixture fails closed if absent.
  - `UI_QA_SCENARIO` defaults to `checkout_happy`.
  - `UI_QA_PERSONA` defaults to `client_alina`.
  - `UI_QA_EVIDENCE_DIR` defaults to `.tasks/TASK-FT018-05`.
- API workflow performs:
  1. `GET /api/v1/health`
  2. `POST /api/v1/test/reset` with `{ "scope": "all" }`
  3. `POST /api/v1/test/seed` with `{ "scenario": UI_QA_SCENARIO }`
  4. `GET /api/v1/test/personas`
  5. `POST /api/v1/test/session` with `{ "persona": UI_QA_PERSONA }`
- It records cookie metadata only, not cookie values or tokens.
- Browser smoke currently uses a direct `/checkout` path and injects `khujandi.customer_order_composition` into `sessionStorage`. That is useful as a fixture smoke but is not a clean "fresh browse -> add product -> checkout" proof. For the requested global test, prefer a manual/Playwright flow that creates the order through real storefront UI, or API-create the order and explicitly label it as API-created.

## Fixed personas / seed reality inspected

Files:

- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`

Supported deployed-code personas:

- `client_alina`
- `seller_plov`
- `admin_boss`
- `courier_7`

Important details:

- `operator` is typed but not listed in `supportedPersonas`; endpoint will reject it in current code.
- `client_alina` Telegram id: `910001`.
- `seller_plov` Telegram id: `920001`.
- `courier_7` Telegram id: `70007`.
- `admin_boss` uses seeded `boss@example.com` account and yields `admin-access` cookies.
- Seed scenarios supported:
  - `baseline_catalog`
  - `checkout_happy`
  - `seller_owned_shop`
  - `operator_orders`
  - `delivery_happy_path`
- `operator_orders` / `delivery_happy_path` seed old deterministic orders:
  - `test-order-created-1001` (`CREATED`, no courier)
  - `test-order-delivered-2001` (`DELIVERED`, courier `courier-7`)
  - `test-order-cancellable-3001` (`IN_PROGRESS`, courier `courier-7`)
- These seeded orders are not suitable for the requested fresh order flow because they are deterministic demo orders.

## Does the seed likely include real courier Telegram user `5281851429` / `Луганский` / `courier-staff-1`?

Likely no.

Evidence from checked-in staging seed/session code:

- `staging-test-harness.ts` seeds only `courier7` with Telegram id `70007`, name `Courier 7`, id `courier-7`.
- `test-session.routes.ts` only has `courier_7` with Telegram id `70007`.
- Search did not find checked-in occurrences of `5281851429` or `Луганский`.
- `courier-staff-1` appears as a generated id pattern in `order-ops-runtime.ts` when courier staff is created at runtime (`courier-staff-${state.nextUserId++}`), not as a deterministic seed for Telegram id `5281851429`.

Conclusion: before a real manual bot run with Telegram user `5281851429`, create/verify the courier staff row through Staff panel/API after reset. If reset clears runtime state, `courier-staff-1` is a plausible first generated id, but do not rely on it without reading the create/list response.

## Exact reset/seed/persona commands

Assumptions:

```bash
export UI_QA_BASE_URL=https://staging-tgmeal.natureonzoom.win
export E2E_TEST_TOKEN='<secret from ignored/CI/orchestrator source>'
```

Reset + minimal catalog/checkout seed for fresh checkout:

```bash
curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/test/reset" \
  -H 'content-type: application/json' \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"scope":"all"}'

curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/test/seed" \
  -H 'content-type: application/json' \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"scenario":"checkout_happy"}'

curl -fsS "$UI_QA_BASE_URL/api/v1/test/personas" \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN"
```

Bootstrap cookies into jars:

```bash
# client_alina Mini App cookie
curl -fsS -c /tmp/khujandi-client-alina.cookies -X POST "$UI_QA_BASE_URL/api/v1/test/session" \
  -H 'content-type: application/json' \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"persona":"client_alina"}'

# admin_boss admin-web cookies
curl -fsS -c /tmp/khujandi-admin-boss.cookies -X POST "$UI_QA_BASE_URL/api/v1/test/session" \
  -H 'content-type: application/json' \
  -H "x-e2e-test-token: $E2E_TEST_TOKEN" \
  --data '{"persona":"admin_boss"}'
```

Optional fixture API smoke for current harness:

```bash
UI_QA_BASE_URL="$UI_QA_BASE_URL" \
E2E_TEST_TOKEN="$E2E_TEST_TOKEN" \
UI_QA_SCENARIO=checkout_happy \
UI_QA_PERSONA=client_alina \
UI_QA_EVIDENCE_DIR=.tasks/TASK-GLOBAL-REVIEWS-RUNTIME \
node tests/e2e/staging-ui-qa-fixture.mjs api-smoke
```

## Exact API commands to create and record a fresh checkout order

API-created fresh order path (not old seed order):

```bash
ORDER_JSON="$({
  curl -fsS -b /tmp/khujandi-client-alina.cookies \
    -H 'content-type: application/json' \
    -X POST "$UI_QA_BASE_URL/api/v1/orders/checkout" \
    --data '{
      "composition": {
        "composition_id": "manual-global-review-'"$(date +%s)"'",
        "shop_public_path": "plov-v-parke-somoni",
        "shop_id": "shop-1",
        "items": [
          {
            "product_id": "product-1",
            "quantity": 1,
            "display_snapshot": {
              "product_name": "Плов зарвода",
              "unit_price_minor": 4500,
              "currency": "TJS"
            }
          }
        ],
        "preview_total": { "amount_minor": 4500, "currency": "TJS" },
        "created_at": "'"$(date -u +%FT%TZ)"'"
      }
    }'
})"
printf '%s\n' "$ORDER_JSON" | tee .tasks/TASK-GLOBAL-REVIEWS-RUNTIME/fresh-order.json
ORDER_ID="$(printf '%s' "$ORDER_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["orderId"])')"
printf 'ORDER_ID=%s\n' "$ORDER_ID"
```

Then verify it is visible to admin/operator panel and not one of the seeded demo ids:

```bash
curl -fsS -b /tmp/khujandi-admin-boss.cookies \
  "$UI_QA_BASE_URL/api/v1/admin/operator/delivery/orders" \
  | python3 -m json.tool \
  | tee .tasks/TASK-GLOBAL-REVIEWS-RUNTIME/admin-orders-after-fresh-checkout.json
```

Expected: `ORDER_ID` is a new runtime-generated id (not `test-order-created-1001`).

## Create/verify real courier staff for Telegram user 5281851429

After reset + admin_boss session, create the real courier staff record if it is not already present:

```bash
curl -fsS -b /tmp/khujandi-admin-boss.cookies \
  -H 'content-type: application/json' \
  -X POST "$UI_QA_BASE_URL/api/v1/admin/staff/couriers" \
  --data '{"telegram_user_id":"5281851429","nickname":"Луганский"}' \
  | tee .tasks/TASK-GLOBAL-REVIEWS-RUNTIME/courier-luganskiy-create.json

curl -fsS -b /tmp/khujandi-admin-boss.cookies \
  "$UI_QA_BASE_URL/api/v1/admin/staff/couriers?includeInactive=true" \
  | python3 -m json.tool \
  | tee .tasks/TASK-GLOBAL-REVIEWS-RUNTIME/couriers-after-create.json
```

Record the returned `courierUserId`. If reset was clean and no other courier staff exists, it may be `courier-staff-1`, but verify from response.

## Assignment options for the fresh order

### Preferred real-bot/manual flow

1. Make sure staging has a real staging `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_POLLING=TRUE` or a configured webhook secret. The public health endpoint does not expose these facts, so verify on server/ops side before manual bot.
2. Make sure Telegram user `5281851429` can open the staging bot and send `Курьер`.
3. The bot runtime resolves Telegram actor id -> active courier staff by `getCourierStaffByTelegramUserId`. If `5281851429` is not an active staff courier, bot actions return `COURIER_NOT_FOUND`/403.
4. In admin/operator UI, create a manual offer for the fresh `ORDER_ID` to the verified `courierUserId`:

```bash
COURIER_ID='<from couriers-after-create.json, e.g. courier-staff-1>'

curl -fsS -b /tmp/khujandi-admin-boss.cookies \
  -H 'content-type: application/json' \
  -X POST "$UI_QA_BASE_URL/api/v1/admin/orders/$ORDER_ID/assignment-offers" \
  --data '{"courierId":"'"$COURIER_ID"'"}' \
  | tee .tasks/TASK-GLOBAL-REVIEWS-RUNTIME/manual-offer.json
```

5. Courier accepts in Telegram via the inline `Принять заказ` button. This should call callback data shape:

```text
delivery-assignment-courier-claim:<offerId>:<courierId>
```

### Fallback if real Telegram callback must be simulated

Only use this as runtime API evidence, not as real Telegram manual evidence. If `TELEGRAM_WEBHOOK_SECRET` is configured, include it in `X-Telegram-Bot-Api-Secret-Token` from secret storage.

```bash
OFFER_ID='<from manual-offer.json>'
COURIER_ID='<from courier create/list response>'
TELEGRAM_WEBHOOK_SECRET='<secret if configured>'

curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/telegram/webhook" \
  ${TELEGRAM_WEBHOOK_SECRET:+-H "X-Telegram-Bot-Api-Secret-Token: $TELEGRAM_WEBHOOK_SECRET"} \
  -H 'content-type: application/json' \
  --data '{
    "update_id": 900001,
    "callback_query": {
      "id": "manual-claim-900001",
      "from": { "id": 5281851429 },
      "message": { "chat": { "id": 5281851429 } },
      "data": "delivery-assignment-courier-claim:'"$OFFER_ID"':'"$COURIER_ID"'"
    }
  }'
```

## Courier status progression

Real Telegram inline status buttons use callback data:

```text
delivery-tracking:<orderId>:PICKED_UP
delivery-tracking:<orderId>:IN_PROGRESS
delivery-tracking:<orderId>:DELIVERED
```

Fallback webhook simulation examples:

```bash
for NEXT in PICKED_UP IN_PROGRESS DELIVERED; do
  curl -fsS -X POST "$UI_QA_BASE_URL/api/v1/telegram/webhook" \
    ${TELEGRAM_WEBHOOK_SECRET:+-H "X-Telegram-Bot-Api-Secret-Token: $TELEGRAM_WEBHOOK_SECRET"} \
    -H 'content-type: application/json' \
    --data '{
      "update_id": '"$((900100 + RANDOM % 800000))"',
      "callback_query": {
        "id": "manual-status-'"$NEXT"'",
        "from": { "id": 5281851429 },
        "message": { "chat": { "id": 5281851429 } },
        "data": "delivery-tracking:'"$ORDER_ID"':'"$NEXT"'"
      }
    }'
done
```

Then admin closes `DELIVERED -> COMPLETED`:

```bash
curl -fsS -b /tmp/khujandi-admin-boss.cookies \
  -H 'content-type: application/json' \
  -X POST "$UI_QA_BASE_URL/api/v1/admin/operator/delivery/orders/$ORDER_ID/status" \
  --data '{"nextStatus":"COMPLETED"}' \
  | tee .tasks/TASK-GLOBAL-REVIEWS-RUNTIME/admin-completed.json
```

## Reviews readiness / risk

Important runtime gap found by inspection:

- The repo has `reviews-feedback` service/module and Telegram review flow classes under `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`.
- The checked-in `dev-runtime` composition inspected here wires `delivery-assignment` and `delivery-tracking` into `telegram-bot-runtime.ts`, but I did not find the review flow mounted into the public `POST /api/v1/telegram/webhook` runtime path.
- I also did not find a staging test HTTP route for direct review submission.

Implication: assignment and courier statuses are staging-runtime ready through current webhook callbacks, but the requested "both reviews" manual bot portion needs a preflight check that the deployed bot actually prompts and handles review callbacks after `COMPLETED`. Based on code inspection, this is a blocker/risk for full global review runtime on staging unless another runtime path exists outside the inspected files.

What to verify before manual bot review run:

1. Server deploy contains the branch/commit with real review bot runtime mounting, if such a change exists.
2. After `COMPLETED`, bot sends both review prompts (client and courier) for the fresh `ORDER_ID`.
3. Callback data accepted by deployed webhook belongs to reviews-feedback flow, not only delivery assignment/tracking.
4. Reviews persist and Staff panel metrics reflect courier/client review ratings.
5. Low rating (`<=2`) creates negative alert.

## Server staging deploy readiness notes

Files inspected:

- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`

Readiness positives:

- Compose is parameterized for staging-safe host/router/volume/runtime dir via:
  - `TGMEAL_HOST`
  - `TRAEFIK_ROUTER_PREFIX`
  - `TGMEAL_RUNTIME_VOLUME`
  - `TGMEAL_RUNTIME_DIR`
  - `APP_ENV`, `NODE_ENV`, `DEBUG`, `E2E_TEST_MODE`, `PAYMENT_PROVIDER`
  - `TELEGRAM_BOT_POLLING`, `TELEGRAM_WEBHOOK_SECRET`
- Deploy script supports staging command shape through env overrides:

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

- Public staging currently reports correct non-production health: `APP_ENV=staging`, `NODE_ENV=staging`, `DEBUG=true`, `PAYMENT_PROVIDER=mock`, `E2E_TEST_MODE=true`.
- Public test endpoints are token-guarded.

Readiness risks / preflight items:

- Public `/api/v1/health` version is `dev`; confirm server checkout HEAD/commit separately before a high-stakes manual run.
- Health does not expose whether real Telegram bot token/polling/webhook secret is configured. Verify server env/logs before using manual Telegram.
- If real bot token is configured and no webhook secret is set, `/api/v1/telegram/webhook` correctly rejects per code.
- Reset clears runtime state. Create the real courier staff record after reset and before asking `5281851429` to use the bot.
- Current fixed seed does not include `5281851429`.
- Current fixture browser smoke uses `sessionStorage` handoff, so it should not be the only evidence for a fresh end-to-end browse/cart checkout.

## Recommended pre-manual checklist

Before asking the real courier/user to interact with Telegram:

1. Confirm `E2E_TEST_TOKEN` is available only from a secret source.
2. Run reset + `checkout_happy` seed.
3. Bootstrap `admin_boss` and `client_alina` cookie jars.
4. Create/list courier staff with `telegram_user_id=5281851429`, nickname `Луганский`; record actual `courierUserId`.
5. Create a fresh checkout order with `client_alina`; record `ORDER_ID` and prove it is not `test-order-created-1001`.
6. Confirm admin operator panel lists the fresh `ORDER_ID` as `CREATED`/unassigned.
7. Confirm server bot mode:
   - real staging `TELEGRAM_BOT_TOKEN` configured;
   - `TELEGRAM_BOT_POLLING=TRUE` or webhook configured with matching secret;
   - logs show bot runtime is active without exposing secrets.
8. Have courier `5281851429` send `Курьер`; expect bot menu, not `COURIER_NOT_FOUND`.
9. Admin creates manual offer to recorded `courierUserId`; courier accepts in bot.
10. Courier advances `PICKED_UP -> IN_PROGRESS -> DELIVERED` in bot.
11. Admin closes `DELIVERED -> COMPLETED`.
12. Verify review prompts for both client and courier. If no review prompt appears, stop and report runtime mounting gap rather than inventing review callbacks.

## Files inspected

- `AGENTS.md`
- Memory Bank/spec files listed above
- `tests/e2e/staging-ui-qa-fixture.mjs`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `backend/src/dev-runtime/routes/mini-app.routes.ts`
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
- `backend/src/dev-runtime/routes/admin-staff.routes.ts`
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts`
- `backend/src/dev-runtime/telegram-bot-runtime.ts`
- Telegram callback harnesses for availability/claim/tracking
- `docker-compose.yml`
- `deploy/scripts/tgmeal-deploy-alma.sh`
- `package.json`

## Files changed

- Created this requested inspection artifact:
  - `.tasks/TASK-GLOBAL-REVIEWS-RUNTIME/inspection-staging.md`

No source code files were edited.
