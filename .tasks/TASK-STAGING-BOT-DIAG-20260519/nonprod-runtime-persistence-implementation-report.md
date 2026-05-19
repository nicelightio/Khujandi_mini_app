# Non-production runtime persistence implementation report

## Результат

Implemented durable runtime persistence for the non-production dev-runtime server profile.

The implementation keeps production guards unchanged and persists runtime-only checkout/payment and operational delivery state when explicit runtime database paths are configured:

- `CHECKOUT_PAYMENT_DB_PATH`
- `OPERATIONAL_RUNTIME_DB_PATH`

This fixes the disappearing Staff-created `User(COURIER)` records after runtime stop/restart because courier users now live in persisted checkout/payment runtime state, while courier lifecycle/rating/availability/assignment/tracking state lives in persisted operational runtime state.

## Owning slice / contour / layers

- Owning capability: non-production runtime and staging/test harness enablement.
- Affected slices by state ownership: `checkout-payment`, `delivery-assignment`, `delivery-tracking`, `order-cancellation`, `admin-access` integration surface.
- Contour: non-production `dev-runtime` server profile used for local/staging QA.
- Touched layers: dev-runtime infra/adapters, runtime composition, staging test harness routes, focused slice tests, Memory Bank runbook/architecture notes.
- Shared extraction: not added. Persistence is kept inside `backend/src/dev-runtime`.

## Files changed by this implementation

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
- `.env.example`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/deployment-and-runtime-topology.md`
- `.memory-bank/runbooks/staging-runtime-and-ui-qa.md`
- `.memory-bank/testing/index.md`
- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts`

Pre-existing unrelated dirty files were present and were not intentionally changed by this task:

- `AGENTS.md`
- `.memory-bank/guides/server-deploy-and-rollout.md`
- `.memory-bank/runbooks/telegram-mini-app-container-deploy.md`

## Implementation details

- Added SQLite JSON-state adapter for checkout/payment runtime state.
- Added SQLite JSON-state adapter for operational runtime state.
- Added clone/initial-state/persist hooks to in-memory checkout/payment runtime.
- Added clone/initial-state/persist hooks to operational runtime modules.
- Persisted checkout/payment mutations for orders, users, Mini App sessions, and replay guards.
- Persisted operational mutations for assignment offers, order status/history/events, cancellations, tracking updates, courier lifecycle, courier rating, reset, and seed operations.
- Wired optional persistence paths through `RuntimeServerOptions`, env vars, `scripts/dev-api.ts`, and compose env.
- Kept `startDevApiServer()` in-memory by default unless explicit paths are passed or env vars are set.
- Skipped demo operational baseline seeding for explicit persisted runtime profiles so reset/seed remains deterministic after restart.
- Exposed runtime database paths in `startDevApiServer()` return value for tests/debugging.
- Ensured staging reset/seed flushes both checkout/payment and operational persisted state.
- Ensured test-session route writes fixed courier metadata sessions to persistence after direct checkout state mutation.

## Acceptance coverage

- Staff-created courier survives runtime restart with same persisted paths.
- Courier lifecycle events and rating adjustments survive restart.
- Telegram bot courier lookup works after restart for a persisted courier Telegram id.
- Staging reset clears persisted checkout/payment and operational runtime state.
- Staging seed writes deterministic checkout/payment and operational runtime state and survives restart.
- Production mock-payment refusal remains covered by existing checkout/payment negative tests.

## Tests added

- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts`
  - Added restart persistence coverage for Staff-created courier identity, lifecycle, rating, archived view, active courier, and Telegram webhook courier menu lookup after restart.
- `tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts`
  - Added restart persistence coverage for staging seed/reset and persisted operational delivery read model clearing.

## Checks run

Passed:

- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-staff-runtime.spec.ts --runInBand`
- `npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts --runInBand`
- `npm run test:admin-access -- --runInBand`
- `npm run test:delivery-assignment -- --runInBand`
- `npm run test:order-cancellation -- --runInBand`
- `APP_ENV=test PAYMENT_PROVIDER=mock npm run test:delivery-tracking -- --runInBand`
- `env -u PAYMENT_PROVIDER -u APP_ENV npx jest --config jest.config.cjs tests/slices/checkout-payment --runInBand`
- `npm run test:catalog:runtime -- --runInBand`
- `npx tsc --noEmit -p tsconfig.jest.json`
- `npm run lint -- --max-warnings=0`
- `git diff --check`

Diagnostic run:

- `npm run test:delivery-tracking -- --runInBand` without `PAYMENT_PROVIDER=mock` failed only in runtime checkout-backed tracking cases with `PAYMENT_PROVIDER_UNAVAILABLE`.
- Re-running the same suite with the explicit contract guard `APP_ENV=test PAYMENT_PROVIDER=mock` passed.

## Risks / compatibility notes

- The new persistence is scoped to dev-runtime and activated only by explicit checkout/payment or operational runtime DB paths.
- `scripts/dev-api.ts` now supplies default local/staging persisted runtime paths, so script-launched non-production runtime behaves durably by default.
- `startDevApiServer()` tests and direct callers remain in-memory unless they pass paths or env vars.
- Reset/seed is intentionally authoritative for persisted non-production state; explicit persisted profiles do not silently restore the old demo operational baseline after reset.
- SQLite `node:sqlite` still emits Node experimental warnings during tests; this matches existing catalog/admin runtime persistence behavior.
- Production guard behavior for `PAYMENT_PROVIDER=mock` is unchanged and remains covered by existing negative tests.

## Recommendation

Ready for orchestrator review and a bounded implementation review. The fix is intentionally limited to non-production dev-runtime persistence and focused tests/docs.
