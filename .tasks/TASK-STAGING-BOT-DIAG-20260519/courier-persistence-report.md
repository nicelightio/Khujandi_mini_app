---
description: Read-only diagnosis of staging courier Staff persistence loss after container recreate.
status: active
---
# Courier Staff Persistence Diagnosis

## Task

Diagnose why a Staff courier created on public staging, specifically Telegram user id `5281851429` / nickname `Луганский`, disappears after staging deploy/container recreate.

## Role And Scope

- Role: `SUBAGENT`
- Type: `explorer`
- Scope: read-only analysis of specs, runtime code, tests, compose/runtime persistence paths and public staging health.
- Writes: this report only.
- No state mutation was performed: no staff create/delete/update, no reset/seed, no restart/deploy.

## Micro-Check

- Owning capability slice: `delivery-assignment` for courier staff roster and courier availability; `admin-access` only for Staff panel auth/RBAC and operator staff.
- Owning contour: `admin-web` for Staff panel; `telegram-bot` consumes courier identity for courier runtime actions.
- Touched layers inspected: presentation routes, application service, dev-runtime infrastructure/storage adapters, tests and staging compose wiring.
- Shared extraction: not justified for diagnosis. The issue is runtime persistence wiring, not a shared abstraction need.

## Expected Persistence Behavior From Specs

Normative specs say courier Staff state is supposed to be persistent staff identity state:

- `.memory-bank/features/FT-019-staff-panel.md`: courier Staff profile is `User` with role `COURIER`, `telegram_user_id` and `nickname`; operator Staff profile is `AdminAccount(OPERATOR)`.
- `.memory-bank/contracts/staff-panel-contract.md`: `Create courier` creates a courier staff profile with Telegram user id, nickname, creator actor, created timestamp and active status. Hard delete is out of scope.
- `.memory-bank/architecture/data-boundaries-and-persistence.md`: Staff panel is not a new shared user abstraction. Courier profile is `User(COURIER)` with `telegram_user_id`, nickname/display name and delivery-assignment state fields. Soft delete/deactivate must preserve historical references.
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`: server staging uses separate durable runtime volume `tgmeal_staging_runtime_data` mounted at `/var/lib/khujandi-staging`; `ADMIN_DB_PATH` and `CATALOG_DB_PATH` point into that runtime dir.

Interpretation: a courier created through Staff panel on staging should survive a container recreate when the same staging runtime volume is reused. Reset/seed may intentionally clear test state, but plain deploy/container recreate should not.

## Actual Persistence Path In Code

### Runtime construction

`backend/src/dev-runtime/modules/dev-api-runtime.ts` wires three different runtime stores:

- Admin access uses persisted SQLite state:
  - `resolveAdminDatabasePersistence(options.adminDatabasePath)`
  - `createAdminAccessRuntimePrisma(adminPersistence.loadState(), { persist: adminPersistence.saveState })`
- Catalog uses persisted SQLite state:
  - `resolveCatalogDatabasePersistence(options.catalogDatabasePath)`
  - `createInMemoryCatalogPrisma(catalogState, { persist: catalogPersistence.saveState })`
- Checkout/payment/users/orders are always in-memory:
  - `const checkoutPaymentPrisma = createInMemoryCheckoutPaymentPrisma();`
  - `const checkoutPaymentState = checkoutPaymentPrisma.state;`
  - no `CHECKOUT_DB_PATH`, no load/save callback, no mounted file.

### Courier Staff create/list path

The Staff panel route for `POST /api/v1/admin/staff/couriers` calls:

```text
admin-staff.routes.ts -> deliveryAssignmentModule.service.createCourierStaff(...)
```

`createOperationalRuntimeModules(checkoutPaymentState, ...)` provides the delivery-assignment runtime repository. Its `user.create` implementation:

- allocates id `courier-staff-${state.nextUserId++}`;
- writes `telegramId`, `role: courier`, `name`, `staffNickname`, lifecycle fields;
- pushes the user into `state.users`;
- returns a courier Staff read model.

That `state` is the in-memory `checkoutPaymentState` created by `createInMemoryCheckoutPaymentPrisma()`.

Therefore courier Staff rows created in staging live only in process memory:

```text
checkoutPaymentState.users[]
```

They are not serialized to `ADMIN_DB_PATH`, `CATALOG_DB_PATH`, `DATABASE_URL`, or any mounted runtime file.

### Operator Staff contrast

Operator Staff creation goes through `adminAccessModule.controller.createOperatorStaffAccount(...)`.

`admin-access-runtime.ts` persists `operatorAccounts`, sessions, audits, lifecycle events and rating adjustments into the SQLite table `admin_access_runtime_state`, backed by `ADMIN_DB_PATH`. This is why operator Staff state has a restart-safe path while courier Staff does not.

### Compose/runtime volume contrast

`docker-compose.yml` mounts one runtime volume into the API container:

```text
catalog_runtime_data:${TGMEAL_RUNTIME_DIR:-/var/lib/khujandi}
```

and passes:

```text
ADMIN_DB_PATH=${ADMIN_DB_PATH:-/var/lib/khujandi/admin-access-runtime.sqlite}
CATALOG_DB_PATH=${CATALOG_DB_PATH:-/var/lib/khujandi/catalog-runtime.sqlite}
```

The runbook says staging should set these under `/var/lib/khujandi-staging`. That covers admin and catalog only. There is no equivalent path for checkout/payment/users or courier Staff.

## Public Staging Read-Only Checks

Public health checks were read-only:

- `GET https://staging-tgmeal.natureonzoom.win/api/v1/health` returned `appEnv=staging`, `nodeEnv=staging`, `paymentProvider=mock`, `e2eTestMode=true`.
- `GET https://staging-tgmeal.natureonzoom.win/api/v1/shops` returned an array with 2 shops.
- `.env` has `E2E_TEST_TOKEN`, but no local SSH target variables were found under checked variable names (`TGMEAL_SSH_HOST`, `TGMEAL_SSH_USER`, `TGMEAL_SSH_TARGET`), so no SSH diagnostics were run.

No staging mutation was performed.

## Root Cause Hypothesis With Evidence

Root cause: staging courier Staff persistence is missing. The courier Staff state is stored in `checkoutPaymentState.users`, an in-memory runtime state that is recreated on every API process/container start.

Evidence chain:

1. Specs require courier Staff identity to be `User(COURIER)` with Telegram id/nickname and soft-delete lifecycle, not ephemeral UI state.
2. Staff route creates courier Staff through `deliveryAssignmentModule.service.createCourierStaff`.
3. The dev-runtime delivery-assignment repository implements `user.create` by pushing into `checkoutPaymentState.users`.
4. `checkoutPaymentState` comes from `createInMemoryCheckoutPaymentPrisma()`, whose state is initialized with empty `orders`, `users`, `sessions`, `replayGuards` and counters.
5. Unlike admin/catalog runtime stores, no persistence adapter is attached to checkout/payment runtime state.
6. `ensureOperationalRuntimeBaseline()` only re-adds default demo users (`courier-7`, `courier-8`, `client-demo-1`), so custom courier `5281851429` / `Луганский` is not rehydrated.
7. Staging reset/seed also clears `checkoutPaymentState.users`, but the observed deploy/container-recreate loss does not require reset; process restart alone is sufficient.

Concrete implication: after deploy/container recreate, the bot lookup by Telegram user id `5281851429` cannot find an active courier Staff record, so the user appears to "disappear" from Staff panel/bot state.

## Important Drift

There is spec/code drift in server staging runtime:

- Spec expectation: courier Staff is durable `User(COURIER)` state.
- Runtime reality: courier Staff is process-local memory.
- Admin/operator Staff durability was implemented separately and does not imply courier Staff durability.

This drift is hidden by current Staff runtime tests because they create/list courier Staff inside one running process.

## Tests Inspected

- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts`
  - Covers operator/courier Staff route happy paths, RBAC, deactivation, cards and rating adjustments.
  - Does not restart runtime and verify courier Staff survives.
- `tests/slices/admin-access/admin-auth-http.integration.spec.ts`
  - Has an admin session restart test on same `adminDatabasePath`, proving this pattern exists for persisted runtime state.
- `tests/slices/catalog/catalog.runtime.provisioning.cases.ts`
  - Has catalog restart persistence tests on same `catalogDatabasePath`.
- `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts`
  - Covers service/repository contracts and Prisma-backed `User(COURIER)` intent.
  - Does not cover dev-runtime restart persistence.

Missing test: runtime restart/container-recreate simulation for courier Staff on the same durable state path.

## Minimal Fix Recommendation

Recommended minimal implementation, if approved:

1. Add a dev-runtime persistence adapter for checkout/payment runtime state, or narrower courier-user runtime state if the orchestrator wants the smallest blast radius.
2. Add a runtime option/env path such as `CHECKOUT_PAYMENT_DB_PATH` or `USER_RUNTIME_DB_PATH` under `${TGMEAL_RUNTIME_DIR}` for staging.
3. Wire `createDevApiRuntime()` so checkout/payment state loads from that path and persists on mutations that affect:
   - `users` including courier Staff;
   - orders if current staging checkout/order durability is also intended;
   - sessions/replay guards only if preserving sessions across restart is desired. If not, explicitly exclude them and document the choice.
4. Ensure delivery-assignment runtime mutations that update courier Staff lifecycle/availability trigger persistence, not only initial create.
5. Update compose/runbook env paths for staging.
6. Add restart tests for courier Staff create/list and bot Telegram id lookup after runtime restart on the same persisted path.

Candidate touched files:

- `backend/src/dev-runtime/checkout-payment-runtime.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `docker-compose.yml`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md` if the chosen persistence split needs clarification
- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts` or a new focused `tests/slices/delivery-assignment/*runtime*.spec.ts`
- `tests/slices/delivery-assignment/telegram-bot-runtime.spec.ts` for lookup after persisted restart

## Tests To Add/Run

Add:

- Create courier Staff `telegram_user_id=5281851429`, stop runtime, start runtime with same new checkout/user DB path, login admin/boss, `GET /api/v1/admin/staff/couriers`, expect the courier remains.
- Same restart test for soft-deactivated courier with `boss includeInactive=true`.
- Telegram bot runtime lookup test: after restart, Telegram update from `5281851429` resolves to courier Staff instead of `COURIER_NOT_FOUND`.
- Persistence test for courier lifecycle event and rating adjustment history if those remain part of the same adapter.
- Negative test: explicit staging reset still clears test-owned state when `POST /api/v1/test/reset` is used.

Run:

- Focused Staff runtime tests.
- Focused delivery-assignment courier Staff tests.
- Telegram bot runtime tests.
- Existing catalog/admin runtime restart tests to ensure no regression in mounted staging paths.
- `git diff --check`.

## Risks And Blockers

- Choosing whether checkout orders/sessions/replay guards should persist with users is an architecture decision for the orchestrator. Persisting all checkout runtime state changes staging semantics more broadly than courier Staff.
- Persisting only courier users can be minimal, but it creates a split inside `checkoutPaymentState` and must be documented carefully.
- The current runtime uses in-memory Maps for courier availability, offers, status history and events. If courier availability must also survive recreate, that is a broader delivery-assignment runtime persistence task.
- No SSH diagnostics were run because the local ignored `.env` did not expose a staging SSH target under the checked variable names.
