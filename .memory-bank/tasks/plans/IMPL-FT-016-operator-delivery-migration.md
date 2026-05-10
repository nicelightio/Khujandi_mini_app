---
description: Execution-ready staged TASK cards for migrating implemented FT-004/FT-005 v1 delivery operations to FT-016 operator delivery flow.
status: active
---
# IMPL-FT-016 Operator Delivery Migration

## Purpose

Разложить миграцию implemented `FT-004`/`FT-005` v1 baseline к целевому `FT-016` operator delivery flow на маленькие execution-ready TASK-и.

План намеренно additive-first: текущие active orders остаются readable/operational, `orders.courierId`, `orders.status`, history/events сохраняются как compatibility anchor, а существующая admin panel сначала repair/extend-ится. Rebuild admin panel не выбран: inspection показывает, что уже есть защищенный `admin-web` shell, dashboard, assignment/cancellation routes, API clients, frontend tests and mounted runtime routes; дешевле и безопаснее нарастить operator read model рядом с существующей панелью.

## Source Artifacts

- [AGENTS.md](../../../AGENTS.md): project operating guide.
- [.memory-bank/commands/prd-to-tasks.md](../../commands/prd-to-tasks.md): feature-to-task process.
- [.memory-bank/features/FT-004-courier-assignment.md](../../features/FT-004-courier-assignment.md): assignment offer/claim target.
- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../../features/FT-005-order-tracking-and-events-polling.md): tracking/event target.
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../../features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md): operator panel, courier availability and auto-offer target.
- [.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md](../../features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md): customer read-only dependency on lifecycle states.
- [.memory-bank/states/order-lifecycle.md](../../states/order-lifecycle.md): canonical lifecycle.
- [.memory-bank/contracts/api-events-baseline.md](../../contracts/api-events-baseline.md): events/cursor/error contract.
- [.memory-bank/contracts/telegram-bot-contract.md](../../contracts/telegram-bot-contract.md): bot menu, offer/claim and notification contract.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../../contracts/operator-delivery-ops-contract.md): operator delivery ops boundary.
- [.memory-bank/tasks/plans/MIGRATE-FT-004-FT-005-to-FT-016.md](MIGRATE-FT-004-FT-005-to-FT-016.md): staged migration principles.

## Ownership

- Owning capability slices: `delivery-assignment` for offers/claims and `CREATED|DELAYED -> ASSIGNED`; `delivery-tracking` for `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`; `order-cancellation` is consumed but not redefined.
- Main contours: `backend`, `admin-web`, `telegram-bot`, with `mini-app` follow-up only for customer-safe new state copy.
- Touched layers across the migration: ui/app, application, domain, infra, persistence, tests.
- Shared extraction: not justified beyond existing `shared` DB/error/auth/event primitives. Do not create shared business modules for assignment, dispatch, state machine, chat, or courier scoring.

## Current Implementation Map

### FT-004 v1 already exists

- Backend slice files exist under `backend/src/slices/delivery-assignment/*`.
- `DeliveryAssignmentService.assignCourier` currently allows only role `admin`, requires order status `CREATED`, validates active `courier`, then directly writes `courierId` and status `ASSIGNED`.
- `PrismaDeliveryAssignmentRepository.assignCourier` writes `Order`, `OrderStatusHistory`, `DeliveryAssignmentAudit`, and `Event(type=order.assigned)` in one transaction-like boundary and returns string `revision`.
- Mounted dev runtime route exists: `POST /api/v1/admin/orders/:id/assignment`.
- Telegram assignment notifier exists, but message semantics are "assigned to you", not "offer pending / claim".
- Tests exist in `tests/slices/delivery-assignment/*` and `frontend/src/tests/admin/admin-assignment-*`.

### FT-005 v1 already exists

- Backend slice files exist under `backend/src/slices/delivery-tracking/*`.
- Current state machine is courier-only: `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- `PICKED_UP` and `DELAYED` are absent from Prisma enum/domain/frontend parsers.
- `DELIVERED -> COMPLETED` is currently courier-driven, which conflicts with target operator/admin-owned completion.
- Event polling exists through `DeliveryTrackingRepository.listEventsSince`, but Prisma repository normalizes non-numeric cursors to `0n`; mounted customer runtime separately accepts opaque cursors by filtering results and returning the input cursor for empty windows.
- Customer `mini-app` order tracking consumes `order.assigned` and `order.status_changed`, but customer copy predates `PICKED_UP`/`DELAYED`.

### Admin panel already exists

- `admin-web` shell, protected auth shell, dashboard and navigation exist under `frontend/src/admin/*`.
- Assignment page exists as a narrow direct assignment form with default fixture bootstrap, not a 4-day operator orders list.
- Cancellation/refund page exists and should be preserved.
- Dashboard links include assignment, cancellation, catalog provisioning, customer tracking and seller status.
- Mounted admin runtime supports assignment/cancellation/refund commands, but no operator read endpoint for today + previous 3 days, severity, expandable history, courier claim state, latest message, or top delayed/unassigned alert.

### Drift Against New Specs

- `REQ-007` drift: manual assignment directly sets `ASSIGNED`; target says manual assignment creates pending offer and courier claim sets `ASSIGNED`.
- `REQ-008` drift: `PICKED_UP` is missing and courier can complete; target says courier stops at `DELIVERED`, operator/admin closes `COMPLETED`.
- `REQ-035` drift: existing admin assignment page is not the desktop-first operator monitoring panel.
- `REQ-036` drift: courier availability fields/menu, auto-offer participation, assignment offers, atomic claim, timeout and `DELAYED` escalation are missing.
- Role drift: Prisma `UserRole` has `ADMIN`/`MANAGER` but no `OPERATOR`; spec says `operator` role and `admin` includes operator capability. Minimal resolution: add `OPERATOR` while preserving `ADMIN` behavior; treat existing `MANAGER` only if a later policy explicitly maps it.
- Cursor drift: normative boundary says opaque string cursor; current Prisma repository parses numeric event ids. Minimal resolution: preserve numeric event-id runtime while adding compatibility tests and not exposing numeric assumptions to consumers; only change persistence cursor storage if a future SSE/WS task requires it.

## Execution Phases And TASK Cards

### Phase 0 - baseline inspection/drift map

#### TASK-FT016-00 - Baseline drift report and execution handoff

- Status: ready
- Owning capability slice: `delivery-assignment`, `delivery-tracking`
- Contour: backend / admin-web / telegram-bot
- Touched layers: docs, tests inventory
- Objective: create an implementation handoff that confirms current v1 behavior before code changes.
- Exact scope: inspect current delivery assignment, tracking, admin panel, dev runtime, bot notifiers, Prisma schema and tests; write `.protocols/TASK-FT016-00/context.md` and `.tasks/TASK-FT016-00/TASK-FT016-00-S-00-final-report-docs-01.md` with drift, existing tests and first files to touch.
- Out of scope: code changes, schema changes, backlog expansion.
- Dependencies: none.
- Files/areas likely touched: `.protocols/TASK-FT016-00/*`, `.tasks/TASK-FT016-00/*`.
- Acceptance criteria: report names v1 direct assignment and old tracking chain as baseline, not bug; confirms admin panel repair-first strategy; records owning slices/contours/layers/shared justification.
- Verification/tests: no runtime tests required; `git diff --check` for docs.
- Risk/rollback note: docs-only; rollback is deleting the task report.

### Phase 1 - persistence/API compatibility

#### TASK-FT016-01 - Add lifecycle and role compatibility to Prisma/domain types

- Status: planned
- Owning capability slice: `delivery-assignment`, `delivery-tracking`
- Contour: backend
- Touched layers: domain, persistence, tests
- Objective: make `DELAYED`, `PICKED_UP` and `OPERATOR` representable without changing runtime behavior.
- Exact scope: add Prisma enum values; update domain union types in assignment/tracking/checkout/order-cancellation/customer tracking parsers as needed; add migration; keep existing orders valid.
- Out of scope: enabling new transitions, offers, bot menu, UI behavior.
- Dependencies: TASK-FT016-00.
- Files/areas likely touched: `backend/prisma/schema.prisma`, new `backend/prisma/migrations/*/migration.sql`, `backend/src/slices/*/domain/*.types.ts`, `frontend/src/slices/order-tracking/api/order-tracking-api.ts`, tests parsing statuses.
- Acceptance criteria: old statuses still parse; new statuses parse; no active order rewrite; `ADMIN` still works as operator-capable.
- Verification/tests: `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`; focused backend type/test suite for affected slices; `npm run test:order-tracking:frontend`.
- Risk/rollback note: enum additions are forward-only in PostgreSQL; rollback should disable feature flags/routes rather than remove enum values.

#### TASK-FT016-02 - Add courier availability and assignment offer persistence compatibility

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: backend
- Touched layers: domain, infra, persistence, tests
- Objective: add durable fields/tables required by courier availability and offers while leaving direct assignment readable.
- Exact scope: add user/courier fields `isActive`, `acceptingOrdersUntil`, `autoOfferEnabled`, `ratingScore` or compatible naming; add `AssignmentOffer` table/model with order id, optional target courier, kind, status and timestamps; add indexes for active pending offers and order lookup.
- Out of scope: bot menu, offer creation behavior, claim behavior, timeout behavior.
- Dependencies: TASK-FT016-01.
- Files/areas likely touched: `backend/prisma/schema.prisma`, migration SQL, `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`, `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`.
- Acceptance criteria: schema validates; existing `assignCourier` tests still pass or are intentionally updated only for schema shape; no code path requires offers yet.
- Verification/tests: `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`; `npm run test:delivery-assignment`; migration dry-run against empty DB if available.
- Risk/rollback note: if offer model causes runtime issues, do not delete table; leave unused until service code is fixed.

#### TASK-FT016-03 - Add backend operator delivery read contract endpoint

- Status: planned
- Owning capability slice: `delivery-tracking`
- Contour: backend / admin-web
- Touched layers: application, infra, presentation, tests
- Objective: expose a read-only operator orders model for today + previous 3 days before UI repair.
- Exact scope: add backend read model endpoint under admin-protected route, returning order row summary, status, courier marker, claimed/assigned time, computed severity, history rows and latest message placeholders where message data is absent.
- Out of scope: new UI, offer creation, status mutation.
- Dependencies: TASK-FT016-01.
- Files/areas likely touched: `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`, `backend/src/dev-runtime/order-ops-runtime.ts`, possibly `backend/src/slices/delivery-tracking/*`.
- Acceptance criteria: existing assignment/cancellation routes still work; read endpoint includes old v1 orders and new enum statuses; empty message data returns controlled null/empty fields.
- Verification/tests: new runtime tests in `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts` or a new FT-016 runtime spec.
- Risk/rollback note: read-only endpoint can be hidden from frontend without affecting order commands.

### Phase 2 - existing admin panel repair/read model

#### TASK-FT016-04 - Convert admin assignment route into operator orders read surface

- Status: planned
- Owning capability slice: `delivery-tracking`
- Contour: admin-web
- Touched layers: ui, app, tests
- Objective: repair/extend the existing assignment admin page into a desktop-first operator order list.
- Exact scope: replace fixture-only assignment form content with API-backed 4-day orders list, severity chips, current courier/absent marker and expandable history; keep protected admin shell/theme/navigation.
- Out of scope: manual offer submit, auto-offer toggle, chat redirect, cancellation UI changes.
- Dependencies: TASK-FT016-03.
- Files/areas likely touched: `frontend/src/admin/components/admin-assignment-page.tsx`, `frontend/src/admin/routes/admin-assignment-route.tsx`, `frontend/src/admin/model/admin-assignment-view-model.ts`, `frontend/src/admin/api/admin-assignment-api.ts`, `frontend/src/tests/admin/admin-assignment-*`.
- Acceptance criteria: page renders read model from backend; default list window is today + previous 3 days; old direct assignment CTA is not the primary/default action.
- Verification/tests: focused `frontend/src/tests/admin/admin-assignment-route.spec.tsx`, `frontend/src/tests/admin/admin-assignment-api.spec.ts`, `npm run build:frontend`.
- Risk/rollback note: keep old route path and shell so dashboard links do not break.

#### TASK-FT016-05 - Add top unassigned/DELAYED alert and severity sorting

- Status: planned
- Owning capability slice: `delivery-tracking`
- Contour: admin-web
- Touched layers: ui, app, tests
- Objective: surface orders requiring courier attention without introducing a separate dispatcher product.
- Exact scope: compute/render top alert for no accepted courier and `DELAYED`; add sort controls for urgency, created time, status, courier absent/name, assigned time and last message time; add severity color mapping.
- Out of scope: creating delayed state, timeout timers, bot notifications.
- Dependencies: TASK-FT016-04.
- Files/areas likely touched: same admin assignment/operator files, `frontend/src/admin/styles/admin-theme.css`.
- Acceptance criteria: `DELAYED` rows are blinking red; no-courier rows are visible in top alert; `COMPLETED` neutral and cancelled purple; sorting is deterministic.
- Verification/tests: frontend route/model tests for severity and sorting; visual smoke through existing admin route test.
- Risk/rollback note: this is read-side presentation; rollback by removing sort/alert UI while retaining table.

#### TASK-FT016-06 - Add operator action placeholders for offer, status control and bot chat redirect

- Status: planned
- Owning capability slice: `delivery-assignment`, `delivery-tracking`
- Contour: admin-web
- Touched layers: ui, app, tests
- Objective: prepare coherent UI affordances before enabling mutation paths.
- Exact scope: add disabled or guarded action cells for targeted offer, status control confirmation and bot chat redirect; labels must state pending backend availability where needed.
- Out of scope: backend mutations, actual bot deep-link execution, message persistence.
- Dependencies: TASK-FT016-05.
- Files/areas likely touched: admin assignment/operator page/model/tests.
- Acceptance criteria: UI no longer presents direct assignment as normal flow; actions are visibly unavailable until backend phases land; unrelated cancellation/provisioning/admin routes remain unchanged.
- Verification/tests: admin router/route tests proving action states and no broken protected shell.
- Risk/rollback note: placeholders are safe to hide if backend sequencing changes.

### Phase 3 - courier availability/bot menu

#### TASK-FT016-07 - Implement courier availability application boundary

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: backend / telegram-bot
- Touched layers: application, domain, infra, tests
- Objective: make courier active/free/auto-offer participation state server-owned.
- Exact scope: add service/repository methods to start work, stop after 5 minutes, toggle auto-offer participation, and query active/free status; free means no current order in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`.
- Out of scope: offer creation, claim, admin UI toggle.
- Dependencies: TASK-FT016-02.
- Files/areas likely touched: `backend/src/slices/delivery-assignment/*`, tests in `tests/slices/delivery-assignment/*`.
- Acceptance criteria: active/free calculation matches spec; stop-after cutoff is time-testable; rating score is preserved.
- Verification/tests: unit tests for availability transitions and free/busy calculation.
- Risk/rollback note: availability commands can remain bot-hidden if tests expose issues.

#### TASK-FT016-08 - Add Telegram courier menu harness and callback parsing

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: telegram-bot
- Touched layers: ui/app adapter, tests
- Objective: add transport-only `Курьер` menu without moving state ownership into bot code.
- Exact scope: build menu text/buttons for `Выйти на работу`, `Завершить прием заказов через 5 минут`, and `Автоматически принимать заказы: ON/OFF`; parse callbacks into service intents; keep duplicate callbacks side-effect safe through service idempotency.
- Out of scope: full Telegram webhook server, offers/claims, status progression changes.
- Dependencies: TASK-FT016-07.
- Files/areas likely touched: `backend/src/integrations/telegram-bot/*`, `tests/slices/delivery-assignment/*`.
- Acceptance criteria: harness emits correct buttons/callback data; callbacks are parsed as intents only; bot never writes directly to Prisma.
- Verification/tests: bot harness unit tests and service tests.
- Risk/rollback note: menu can be disabled at dispatcher wiring while backend availability remains harmless.

### Phase 4 - assignment offers and atomic claim

#### TASK-FT016-09 - Implement manual targeted offer creation

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: backend / admin-web / telegram-bot
- Touched layers: application, domain, infra, presentation, tests
- Objective: replace normal manual direct assignment with pending targeted offer.
- Exact scope: add `createManualOffer` command for operator/admin; validate order `CREATED|DELAYED`, target courier active/free, and create pending offer + `order.offer_created` event/notification while order status remains unchanged.
- Out of scope: claim, timeout, auto-offer broadcast, legacy direct assignment cleanup.
- Dependencies: TASK-FT016-07, TASK-FT016-08.
- Files/areas likely touched: delivery-assignment backend files, `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`, admin API/page files, Telegram assignment notifier/harness.
- Acceptance criteria: manual offer does not set `ASSIGNED`; `order.assigned` is not published; courier gets offer notification; invalid courier/order returns controlled error.
- Verification/tests: backend unit/integration/runtime tests; admin frontend submit test updated from direct assignment to offer-created result.
- Risk/rollback note: keep legacy direct assignment as hidden override until claim is stable.

#### TASK-FT016-10 - Implement atomic courier claim

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: backend / telegram-bot
- Touched layers: application, domain, infra, persistence, tests
- Objective: make first successful courier claim the only normal path to `ASSIGNED`.
- Exact scope: add claim command from bot callback; use transaction/conditional update to require claimable offer, order `CREATED|DELAYED`, empty `courierId`, courier active/free; success writes `courierId`, status `ASSIGNED`, history/audit/event, derives assignment time from status history/event metadata/read model and marks offer claimed.
- Out of scope: auto-offer broadcast, timeout, status progression after `ASSIGNED`.
- Dependencies: TASK-FT016-09.
- Files/areas likely touched: delivery-assignment service/repository/types, Telegram offer callback harness, tests.
- Acceptance criteria: exactly one concurrent claimant wins; losers get already-taken/expired outcome without history/event side effects; duplicate Telegram callback is idempotent/controlled.
- Verification/tests: integration race test, duplicate callback unit test, runtime claim smoke.
- Risk/rollback note: if claim fails in rollout, disable offer creation and use legacy override temporarily.

#### TASK-FT016-11 - Implement optional auto-offer broadcast trigger

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: backend / telegram-bot / admin-web
- Touched layers: application, infra, ui, tests
- Objective: add KISS auto-offer fan-out to active free couriers when explicitly enabled.
- Exact scope: add admin/operator setting endpoint/UI toggle default OFF; when enabled for new unassigned orders, create broadcast offer and notify active/free/auto-offer-enabled couriers; still require claim.
- Out of scope: Redis, queues, route optimization, auto-accept.
- Dependencies: TASK-FT016-10.
- Files/areas likely touched: delivery-assignment backend, admin operator page/API, dev runtime, Telegram notifier tests.
- Acceptance criteria: default is OFF; broadcast excludes inactive/busy/toggled-off couriers; order remains `CREATED|DELAYED` until claim.
- Verification/tests: backend fan-out tests, admin setting frontend test, runtime smoke with two eligible couriers.
- Risk/rollback note: operational rollback is setting auto-offer OFF.

### Phase 5 - timeout and DELAYED escalation

#### TASK-FT016-12 - Implement offer timeout evaluator as explicit KISS application command

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: backend
- Touched layers: application, domain, infra, tests
- Objective: implement 3+3 minute timeout semantics without queues.
- Exact scope: add service command/evaluator callable by runtime/manual tick/test harness: after 3 minutes repeat notification; after 6 minutes expire offer, set/keep order `DELAYED`, publish `order.assignment_timeout`/`order.delayed`, notify operators, penalize only personal target courier.
- Out of scope: background worker architecture, cron deployment, admin UI.
- Dependencies: TASK-FT016-10.
- Files/areas likely touched: delivery-assignment backend, dev runtime support, Telegram notifier.
- Acceptance criteria: repeat happens once; second timeout is idempotent; broadcast timeout does not decrement rating; personal timeout decrements rating once.
- Verification/tests: timer/evaluator unit and integration tests using injected clock.
- Risk/rollback note: evaluator can be run manually or disabled; pending offers remain readable.

#### TASK-FT016-13 - Surface DELAYED escalation in operator panel and customer status copy

- Status: planned
- Owning capability slice: `delivery-tracking`
- Contour: admin-web / mini-app
- Touched layers: ui, app, tests
- Objective: make `DELAYED` visible to operators and safe for customers.
- Exact scope: admin panel top alert consumes `DELAYED`; customer order tracking parser/view copy supports `DELAYED`; no customer mutation commands.
- Out of scope: changing timeout evaluator or assignment rules.
- Dependencies: TASK-FT016-12.
- Files/areas likely touched: `frontend/src/admin/*`, `frontend/src/slices/order-tracking/*`, corresponding tests.
- Acceptance criteria: admin sees blinking red `DELAYED`; customer sees waiting/problem copy, not courier progress; existing active orders still render.
- Verification/tests: admin frontend tests and `npm run test:order-tracking:frontend`.
- Risk/rollback note: presentation-only; rollback can hide delayed copy but backend remains compatible.

### Phase 6 - PICKED_UP and operator completion

#### TASK-FT016-14 - Enable v2 delivery tracking state machine

- Status: planned
- Owning capability slice: `delivery-tracking`
- Contour: backend / telegram-bot
- Touched layers: application, domain, infra, tests
- Objective: change normal lifecycle to `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, with courier no longer completing orders.
- Exact scope: update transition map, action statuses, bot tracking harness labels/callback parsing and notification available actions; preserve old orders already in `IN_PROGRESS`/`DELIVERED`.
- Out of scope: operator completion UI, cancellation/refund changes.
- Dependencies: TASK-FT016-01, TASK-FT016-10.
- Files/areas likely touched: `backend/src/slices/delivery-tracking/*`, `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.*`, tests in `tests/slices/delivery-tracking/*`.
- Acceptance criteria: courier can do `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`; skip/replay/regression returns `409`; old `IN_PROGRESS -> DELIVERED` remains valid for already-in-progress orders.
- Verification/tests: backend unit/integration tests and bot harness tests.
- Risk/rollback note: if UI lags, keep bot prompt hidden for `PICKED_UP` until frontend/admin is ready.

#### TASK-FT016-15 - Add operator/admin status control and DELIVERED -> COMPLETED closure

- Status: planned
- Owning capability slice: `delivery-tracking`
- Contour: backend / admin-web
- Touched layers: application, presentation, ui, tests
- Objective: move final successful closure to operator/admin with confirmation and history/audit-visible actor.
- Exact scope: add admin/operator status command for allowed next transitions, especially `DELIVERED -> COMPLETED`; add confirmation popup in operator panel; require actor role/name in history/read model.
- Out of scope: broad arbitrary status overrides, cancellation reason logic.
- Dependencies: TASK-FT016-14, TASK-FT016-06.
- Files/areas likely touched: delivery-tracking backend, admin operator page/API/model/tests, runtime routes.
- Acceptance criteria: courier `DELIVERED -> COMPLETED` rejected; operator/admin closure succeeds with event/revision; invalid transition returns `409` without side effects.
- Verification/tests: backend integration tests, admin route tests, runtime smoke.
- Risk/rollback note: retain read-only delivered attention state if command path is disabled.

#### TASK-FT016-16 - Update polling consumers for PICKED_UP/DELAYED/operator completion

- Status: planned
- Owning capability slice: `delivery-tracking`
- Contour: mini-app / admin-web
- Touched layers: ui, app, tests
- Objective: align polling consumers with v2 lifecycle without duplicating state machine ownership.
- Exact scope: update order status rank, available actions, customer-safe copy, admin read updates and event parsing for `PICKED_UP`/`DELAYED`; keep opaque cursor handling.
- Out of scope: backend transition logic, offer claim.
- Dependencies: TASK-FT016-14, TASK-FT016-15.
- Files/areas likely touched: `frontend/src/slices/order-tracking/*`, admin operator files, frontend tests.
- Acceptance criteria: customer and admin UIs apply v2 events in order; terminal states remain closed; read-only customer has no operator controls.
- Verification/tests: `npm run test:order-tracking:frontend`, admin route tests.
- Risk/rollback note: if customer copy is incomplete, backend can still operate; customer state can show controlled generic waiting copy.

### Phase 7 - cleanup legacy direct assignment

#### TASK-FT016-17 - Isolate or remove legacy direct assignment path

- Status: planned
- Owning capability slice: `delivery-assignment`
- Contour: backend / admin-web
- Touched layers: application, presentation, ui, tests
- Objective: stop presenting direct assignment as normal flow after offer/claim is proven.
- Exact scope: remove normal frontend/API usage of `assignCourier` direct path or rename it explicit override; require operator/admin confirmation and audit action if retained.
- Out of scope: deleting historical assignment audits/events or rewriting existing orders.
- Dependencies: TASK-FT016-10, TASK-FT016-15.
- Files/areas likely touched: delivery-assignment service/controller/routes, admin assignment API/page/tests, docs references.
- Acceptance criteria: normal manual path creates offer; direct assignment, if present, is explicit override only; active v1 assigned orders remain readable.
- Verification/tests: regression tests proving no default direct `CREATED -> ASSIGNED` from admin page; override tests if retained.
- Risk/rollback note: keep override temporarily behind explicit guard for operational fallback.

### Phase 8 - final integration/e2e/docs verification

#### TASK-FT016-18 - End-to-end operator delivery flow verification

- Status: planned
- Owning capability slice: `delivery-assignment`, `delivery-tracking`
- Contour: backend / admin-web / telegram-bot / mini-app
- Touched layers: tests, docs
- Objective: prove the full v2 flow across slices and contours.
- Exact scope: run scenario: paid order `CREATED`, operator panel sees unassigned, manual offer, courier claim, `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, operator closes `COMPLETED`, polling visible, old v1 active order readable.
- Out of scope: production deploy, real Android Telegram evidence unless separately requested.
- Dependencies: TASK-FT016-13, TASK-FT016-16, TASK-FT016-17.
- Files/areas likely touched: integration/e2e tests, `.memory-bank/requirements.md`, `.memory-bank/features/FT-016-*`, `.memory-bank/changelog.md`.
- Acceptance criteria: `REQ-007`, `REQ-008`, `REQ-035`, `REQ-036` evidence recorded; no Redis/queues/GPS introduced; docs mention residual risks.
- Verification/tests: `npm run test:delivery-assignment`, `npm run test:delivery-tracking`, admin frontend tests, `npm run test:order-tracking:frontend`, `npm run lint`, `npm run build:frontend`.
- Risk/rollback note: if final e2e fails, leave feature partially disabled and keep legacy override/read model documented.

#### TASK-FT016-19 - Documentation and Memory Bank sync

- Status: planned
- Owning capability slice: `delivery-assignment`, `delivery-tracking`
- Contour: docs
- Touched layers: docs
- Objective: close the migration with updated SSOT navigation and RTM lifecycle.
- Exact scope: update feature docs, requirements RTM lifecycle, tasks/plans index, changelog, runbook notes if needed; archive/record residual debt.
- Out of scope: code fixes after failed verification.
- Dependencies: TASK-FT016-18.
- Files/areas likely touched: `.memory-bank/features/FT-004-courier-assignment.md`, `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`, `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`, `.memory-bank/requirements.md`, `.memory-bank/tasks/plans/index.md`, `.memory-bank/changelog.md`.
- Acceptance criteria: Memory Bank describes implemented v2 behavior and remaining follow-ups; no drift between RTM and verification evidence.
- Verification/tests: `git diff --check`; markdown link validation.
- Risk/rollback note: docs-only; rollback is reverting docs sync if verification evidence is invalid.

## Backlog Sync Note

This plan contains execution-ready cards but does not append them to `.memory-bank/tasks/backlog.md` yet. That keeps the active backlog from ballooning before the team chooses the first execution wave. When ready to execute, copy cards phase-by-phase into backlog with `TASK-ID`, `Status`, `Wave`, `Feature`, `REQs`, `Depends on`, `Touched files`, `Tests`, `Verify`, and `Docs` fields preserved.

## Main Risks

- Prisma enum additions are forward-only in PostgreSQL; rollback must be feature-disable, not destructive schema rollback.
- Direct assignment v1 and offer/claim v2 may coexist during migration; UI labels and audit actions must make the distinction explicit.
- Existing customer tracking copy and parsers can silently drop new statuses unless updated with `PICKED_UP`/`DELAYED`.
- Runtime event cursor internals are still numeric in the Prisma repository; consumers must continue treating cursors as opaque strings.
- Timeout behavior without queues requires an explicit KISS evaluator/tick path; it must be idempotent before operational use.
