---
description: Context package for durable non-production dev-runtime persistence implementation.
status: final
---
# Non-Production Runtime Persistence Context

ROLE: SUBAGENT
TYPE: explorer

## Result

The immediate staging bug is confirmed as spec/code drift: Staff-created courier records are stored in `checkoutPaymentState.users[]`, which is process memory only. Production/staging Compose already gives the API container a persistent runtime volume, and `catalog` plus `admin-access` already use SQLite JSON-state files there, but checkout/order/user/session and operational delivery state do not.

A bounded implementer can safely fix this with a narrow non-production runtime persistence adapter if they follow the scope below. Confidence is HIGH.

## Owning Slice / Contour / Layers

- Owning capability for this task: `runtime/testing enablement` from `FT-018`, because the requested fix is durable non-production server runtime persistence, not a new product capability.
- Affected product slices:
  - `checkout-payment`: current runtime source for `users`, `orders`, Mini App sessions, replay guards.
  - `delivery-assignment`: courier Staff roster, availability, assignment offers, courier lifecycle/rating events.
  - `delivery-tracking` / `order-cancellation`: status updates, history/events, cancellation metadata that currently live in operational runtime state.
  - `reviews-feedback`: currently uses `checkoutPaymentState.users/orders` and its own in-memory review state; should not be widened unless explicitly scoped.
- Owning contour: non-production server runtime profile used by `admin-web`, `mini-app`, and `telegram-bot`; not production behavior.
- Touched layers likely needed:
  - `infrastructure`: SQLite JSON-state persistence adapter(s), env/path wiring.
  - `presentation/runtime`: dev-runtime composition root and route test harness reset/seed orchestration.
  - Tests: runtime restart tests.
- Shared extraction: not justified. Reuse the existing local persistence pattern from `admin-access`/`catalog`; do not create a broad shared storage abstraction unless duplication becomes concrete and small.

## Expected Behavior From Specs

- `REQ-037` / `FT-018`: staging is a real non-production runtime with separate state/volumes/db paths, guarded mock payment, and safe reset/seed; it must not reuse production state or weaken production auth/payment boundaries.
- `REQ-038` / `FT-019`: Staff courier profile is `User(COURIER)` with Telegram user id, nickname, creator metadata, active/soft-deleted lifecycle, staff cards and ratings. Hard delete is out of scope.
- `.memory-bank/architecture/data-boundaries-and-persistence.md`: Staff panel is not a new shared user abstraction. Courier Staff profile uses `User(COURIER)` plus delivery-assignment fields; operator Staff uses `AdminAccount(OPERATOR)`.
- Staging reset/seed may intentionally clear test-owned state. Plain deploy/container recreate using the same staging volume should not delete runtime-created Staff couriers/orders/sessions.
- Production must remain production-safe: no `/api/v1/test/*`, no mock payment in `NODE_ENV=production`, no test-auth/session backdoor.

## Current Runtime State / Persistence Map

Durable today:

- `admin-access`: `backend/src/dev-runtime/admin-access-runtime.ts` persists one JSON payload in SQLite table `admin_access_runtime_state`. It covers boss account, operator accounts, admin sessions, auth audits, operator lifecycle events and operator rating adjustments. Writes call `persistState()` after mutation.
- `catalog`: `backend/src/dev-runtime/catalog-runtime-persistence.ts` persists `CatalogRuntimeState` as one JSON payload in SQLite table `catalog_runtime_state`. The composition root wires `loadState()` and `saveState()`.

Ephemeral today:

- `checkout-payment`: `backend/src/dev-runtime/checkout-payment-runtime.ts` always calls `createCheckoutPaymentRuntimeState()` with empty `orders`, `users`, `sessions`, `replayGuards` and counters. No persistence option exists.
- Staff courier records: `backend/src/dev-runtime/order-ops-runtime.ts` implements `user.create` by pushing `courier-staff-${state.nextUserId++}` into `checkoutPaymentState.users`.
- Operational state: `orderMetadata`, `courierAvailability`, `assignmentOffers`, `statusHistory`, `events`, courier Staff lifecycle events and courier rating adjustments are in `OperationalRuntimeState` arrays/maps.
- Reviews runtime: in-memory reviews/drafts/events; it reads users/orders from `checkoutPaymentState`.

Important current reset behavior:

- `staging-test-harness.ts` reset clears checkout users/orders/sessions/replay guards and operational state, then saves only catalog/admin state. That is correct in intent, but after adding persistence it must also persist the cleared checkout/operational state.

## Existing Patterns To Reuse

- `admin-access-runtime.ts` pattern:
  - `resolveAdminDatabasePersistence(path?)`
  - `loadState()`, `saveState()`, `close()`, `cleanup()`
  - SQLite via `node:sqlite` `DatabaseSync`
  - JSON payload in a single table row
  - clone/rehydrate date/bigint fields at boundaries
- `catalog-runtime-persistence.ts` pattern:
  - explicit path from runtime options/env, temporary directory only for Jest when no path is supplied
  - normalize loaded state before returning
  - production/staging container durability comes from paths under mounted `${TGMEAL_RUNTIME_DIR}`
- Env wiring pattern:
  - `scripts/dev-api.ts` resolves staging defaults under `.runtime/staging`
  - `docker-compose.yml` passes runtime file paths into the API container
  - `.env.example` documents production-safe defaults and staging override examples

## Recommended Implementation Strategy

Recommended narrow path:

1. Add a durable `dev-runtime` persistence adapter for checkout/payment runtime state, named around the slice/runtime state rather than staging:
   - Candidate file: `backend/src/dev-runtime/checkout-payment-runtime-persistence.ts`
   - Candidate env/option: `CHECKOUT_PAYMENT_DB_PATH`
   - Candidate default path:
     - host staging: `.runtime/staging/checkout-payment-runtime.sqlite`
     - container staging/prod-like runtime: `/var/lib/khujandi-staging/checkout-payment-runtime.sqlite`
   - Keep no-path Jest behavior isolated with a temp DB, like `catalog`.

2. Change `createInMemoryCheckoutPaymentPrisma` to accept an initial state and optional `persist` callback, while preserving current default in-memory behavior for tests that do not pass a path.
   - Persist after `order.create`.
   - Persist after `user.upsert` / `user.update`.
   - Persist after `telegramAuthReplay.create`.
   - Persist after `miniAppSession.create`.
   - Rehydrate `Date` fields in sessions/replay guards and clone state before save/load.

3. Persist operational runtime state as a separate non-production runtime state, not by stuffing operational fields into checkout state.
   - Candidate file: `backend/src/dev-runtime/order-ops-runtime-persistence.ts`
   - Candidate env/option: `OPERATIONAL_RUNTIME_DB_PATH`
   - Persist `orderMetadata`, `courierAvailability`, `assignmentOffers`, `statusHistory`, `events`, courier lifecycle events, courier rating adjustments and counters.
   - Add `initialOperationalState` + `persistOperationalState` parameters to `createOperationalRuntimeModules`.
   - Call persist after mutations in order updates, status history/event creation, offer create/update, courier availability updates, courier lifecycle/rating event writes, reset and seed.
   - Serialize `Map` fields as arrays and `bigint` counters/ids as strings; rehydrate to `Map`, `Date`, and `bigint`.

4. Wire composition root:
   - Add `checkoutPaymentDatabasePath?: string` and `operationalRuntimeDatabasePath?: string` to `RuntimeServerOptions`.
   - In `createDevApiRuntime`, resolve both persistences before creating checkout/operational modules.
   - Return these paths from `startDevApiServer` for tests, similar to `catalogDatabasePath`.
   - Close/cleanup both persistences in `dispose()`.

5. Wire env/profile:
   - `scripts/dev-api.ts`: add `CHECKOUT_PAYMENT_DB_PATH` and `OPERATIONAL_RUNTIME_DB_PATH`, defaulting under `.runtime/staging` for `APP_ENV=staging` and under `backend/prisma` otherwise.
   - `docker-compose.yml`: pass both env vars with defaults under `/var/lib/khujandi`.
   - `.env.example`: document production-safe defaults and staging override examples under `/var/lib/khujandi-staging`.
   - This should be profile-generic for non-production server runtime, not hardcoded to `staging` in the persistence implementation.

6. Update reset/seed:
   - Extend `createStagingTestHarness` dependencies with `saveCheckoutPaymentState` and `saveOperationalRuntimeState` or equivalent.
   - After reset/seed, save checkout and operational state in addition to catalog/admin.
   - Keep `POST /api/v1/test/reset` token-gated and non-production-only.

7. Do not change production contracts:
   - Do not mount `/api/v1/test/*` in production.
   - Do not enable mock payment in production.
   - Do not introduce arbitrary identity creation.
   - Do not migrate to real Prisma/Postgres in this task.

Why persist both checkout and operational runtime state:

- Persisting only `checkoutPaymentState.users` fixes the visible courier row but leaves courier lifecycle event history, rating adjustments, availability, pending offers, status history/events and order metadata restart-volatile.
- The bug report says runtime user/order/session state is in memory only, and the requested fix is durable runtime persistence for the non-production server profile, not a Staff-only patch.
- Persisting all checkout/payment state plus operational delivery state keeps checkout/payment, admin/staff, assignment/tracking and cancellation behavior coherent after restart while staying inside the existing dev-runtime JSON-state pattern.

## Files Likely To Change

- `backend/src/dev-runtime/checkout-payment-runtime.ts`
- `backend/src/dev-runtime/checkout-payment-runtime-persistence.ts` (new)
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/dev-runtime/order-ops-runtime-persistence.ts` (new)
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `scripts/dev-api.ts`
- `docker-compose.yml`
- `.env.example`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- Tests listed below.

## Tests To Add / Run

Add focused restart tests:

- Staff courier durability:
  - Start runtime with explicit `checkoutPaymentDatabasePath` and `operationalRuntimeDatabasePath`.
  - Login admin/boss.
  - `POST /api/v1/admin/staff/couriers` with a unique Telegram id.
  - Stop runtime.
  - Restart with same paths.
  - Login admin/boss.
  - `GET /api/v1/admin/staff/couriers` contains the courier.
- Staff courier lifecycle durability:
  - Deactivate courier, stop/restart, boss `includeInactive=true` sees soft-deleted courier and lifecycle metadata.
  - Rating adjustment survives restart.
- Telegram lookup durability:
  - After creating courier and restart, synthetic Telegram update from that Telegram id returns `courier_menu` instead of `COURIER_NOT_FOUND`.
- Checkout/payment durability:
  - Fixed persona session or normal auth creates Mini App session; restart with same path preserves authenticated `/api/v1/events` or seller language/session lookup if intended.
  - Checkout mock paid order persists after restart and customer/order-scoped events remain coherent if operational state also persisted.
- Operational delivery durability:
  - Manual offer persists across restart.
  - Claim/status transition event cursor/history persists across restart.
  - Cancellation/refund state persists across restart.
- Reset/seed:
  - `POST /api/v1/test/reset` clears persisted checkout and operational state on disk, not only memory.
  - Repeated seed remains deterministic.
  - Existing sentinel-file test still proves reset does not delete unrelated files.
- Production guards:
  - `/api/v1/test/*` remains `404` in production.
  - `PAYMENT_PROVIDER=mock` with production still fails closed.

Run focused gates:

- `npm run test:admin-access`
- `npm run test:delivery-assignment`
- `npm run test:delivery-tracking`
- `npm run test:order-cancellation`
- checkout runtime tests under `tests/slices/checkout-payment`
- `npm run test:catalog:runtime`
- `git diff --check`

## Compatibility Risks And Avoidance

- Production break risk: adding env vars with defaults under the existing mounted runtime dir can change production-like runtime semantics. Avoid by keeping test routes/payment guards unchanged and by using production-safe defaults. Do not point anything at production DB or shared infrastructure.
- Existing Jest tests may currently assume fresh checkout/operational memory on each `startDevApiServer()`. Avoid by making explicit paths opt-in and keeping temp/isolated persistence when no path is supplied under Jest.
- Reset/seed risk: if checkout/operational persistence is added but reset/seed does not save the cleared state, old disk records will reappear after restart. Must save cleared state after reset and seeded state after seed.
- Counter/id collision risk: `nextUserId`, `nextOrderId`, `nextSessionId` and operational bigint counters must persist/rehydrate. Otherwise restarted runtime can reuse ids.
- Date/bigint serialization risk: sessions, replay guards, metadata, offers, histories, events and lifecycle/rating records need explicit rehydration.
- Atomicity risk: current JSON-state adapters save each state independently. Keep this acceptable for non-production KISS, but persist after each mutation and avoid cross-file partial reset by ordering reset saves consistently. Do not claim production-grade transactional guarantees.
- Staff semantic risk: `User.isActive` is work-active, while staff active/soft-delete comes from `staffDeactivatedAt`. Do not confuse them during persistence or tests.
- Bot risk: Telegram polling/webhook transport is separate. Persistence fix makes actor lookup durable, but does not prove real Telegram transport.
- Reviews-feedback risk: reviews/drafts are still in memory. Do not silently promise durable review runtime unless the implementer explicitly scopes that adapter too.
- Catalog/admin regression risk: do not alter existing `ADMIN_DB_PATH`/`CATALOG_DB_PATH` behavior except to document sibling paths.

## Files Inspected

Specs and runbooks:

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-018-staging-runtime-and-test-auth-harness.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staging-test-auth-harness-contract.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/testing/staging-ui-qa.md`

Runtime and deploy code:

- `backend/src/dev-runtime/dev-api-server.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/checkout-payment-runtime.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `backend/src/dev-runtime/admin-access-runtime.ts`
- `backend/src/dev-runtime/catalog-runtime-persistence.ts`
- `backend/src/dev-runtime/catalog-runtime.ts`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `backend/src/dev-runtime/routes/test-state.routes.ts`
- `backend/src/dev-runtime/routes/test-session.routes.ts`
- `backend/src/dev-runtime/routes/test-runtime-guards.ts`
- `backend/src/dev-runtime/routes/admin-staff.routes.ts`
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
- `backend/src/dev-runtime/routes/mini-app.routes.ts`
- `backend/src/dev-runtime/routes/telegram-bot.routes.ts`
- `backend/src/dev-runtime/routes/health.routes.ts`
- `backend/src/dev-runtime/telegram-bot-runtime.ts`
- `backend/src/dev-runtime/reviews-feedback-runtime.ts`
- `backend/src/dev-runtime/runtime-mode.ts`
- `backend/src/dev-runtime/payment-provider-runtime.ts`
- `scripts/dev-api.ts`
- `docker-compose.yml`
- `.env.example`
- `deploy/scripts/tgmeal-deploy-alma.sh`

Tests and reports:

- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts`
- `tests/slices/admin-access/admin-auth-http.integration.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-mode.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts`
- `tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `tests/slices/catalog/catalog.runtime.provisioning.cases.ts`
- `tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts`
- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts`
- `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`
- `tests/slices/order-cancellation/order-cancellation.runtime.spec.ts`
- `tests/e2e/staging-ui-qa-fixture.mjs`
- `tests/e2e/README.md`
- `.tasks/TASK-STAGING-BOT-DIAG-20260519/code-runtime-report.md`
- `.tasks/TASK-STAGING-BOT-DIAG-20260519/courier-identity-report.md`
- `.tasks/TASK-STAGING-BOT-DIAG-20260519/courier-persistence-report.md`
- `.tasks/TASK-STAGING-BOT-DIAG-20260519/server-runtime-report.md`
- `.tasks/TASK-STAGING-BOT-DIAG-20260519/proder-deploy-4532702.md`

## Evidence Pointers

- Checkout state is initialized empty and in-memory: `backend/src/dev-runtime/checkout-payment-runtime.ts`, lines 28-42.
- Dev runtime currently wires checkout with no persistence: `backend/src/dev-runtime/modules/dev-api-runtime.ts`, lines 57-75.
- Courier Staff create pushes into checkout users: `backend/src/dev-runtime/order-ops-runtime.ts`, lines 1001-1024.
- Operational state uses maps/arrays and resets in memory: `backend/src/dev-runtime/order-ops-runtime.ts`, lines 527-640.
- Reset clears checkout memory but only saves catalog/admin today: `backend/src/dev-runtime/staging-test-harness.ts`, lines 96-103 and 360-365.
- Admin persistence pattern: `backend/src/dev-runtime/admin-access-runtime.ts`, lines 184-218 and 258-366.
- Catalog persistence pattern: `backend/src/dev-runtime/catalog-runtime-persistence.ts`, lines 90-155.
- Compose currently passes only admin/catalog runtime DB paths: `docker-compose.yml`, lines 17-18 and volume line 25.
- `scripts/dev-api.ts` currently defaults only admin/catalog runtime files: lines 34-39.

## Confidence

HIGH.

Reasons:

- The root cause has a direct evidence chain from Staff route to delivery-assignment runtime repository to `checkoutPaymentState.users[]`.
- Existing admin/catalog SQLite JSON-state persistence patterns are simple and already accepted in this repo.
- The fix can be bounded to `dev-runtime` infrastructure/composition and focused runtime tests without changing product contracts or production trust boundaries.
- The main implementation risk is completeness: a Staff-only user-file patch would leave order/status/offer/session state incoherent after restart. Persisting checkout plus operational runtime state avoids that while staying KISS.

Do not write the implementer prompt yet; wait for orchestrator follow-up.
