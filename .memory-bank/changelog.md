---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## Archive

- [.memory-bank/changelog/archive/changelog-full-pre-compaction-2026-04-19.md](changelog/archive/changelog-full-pre-compaction-2026-04-19.md): Полная historical копия исходного `changelog.md` до compaction; canonical archive source.
- [.memory-bank/changelog/archive/index.md](changelog/archive/index.md): Роутер по архивам changelog.
- [.memory-bank/changelog/archive/2026-03-to-2026-04-02.md](changelog/archive/2026-03-to-2026-04-02.md): Summary/navigation archive для истории от initial setup до `2026-04-02`.
- [.memory-bank/changelog/archive/2026-04-03-to-2026-04-12.md](changelog/archive/2026-04-03-to-2026-04-12.md): Summary/navigation archive для execution/verify/review waves от `2026-04-03` до `2026-04-12`.

> `/mb-sync` продолжает писать новые записи именно в этот файл. Старые записи периодически переносятся в archive layer без смены canonical path.

## Recent entries

## [2026-05-10] Worker delivery-tracking durable actor history repair
- Repaired `delivery-tracking` Prisma status history persistence so operator/admin status changes, including `DELIVERED -> COMPLETED`, write nullable `changedByRole`/`changedByName` into `OrderStatusHistory` when provided.
- Added an additive Prisma migration with no backfill requirement, and focused delivery-tracking coverage for actor metadata persistence plus null legacy row compatibility. Lifecycle transitions, RBAC, assignment/claim/timeout and UI behavior remain unchanged.

## [2026-05-10] Worker A mounted delayed polling mapper repair
- Repaired the `delivery-tracking` polling mapper so timeout-created `order.delayed` events expose canonical `status`/`previousStatus` from `newStatus`/`oldStatus`, while events without a usable status are skipped from the read stream.
- Added focused mounted `/api/v1/events` regression coverage for a manual offer timeout that creates `order.delayed` and is visible to the authenticated customer polling path. No frontend parser, timeout evaluator, schema or assignment semantics were changed.

## [2026-05-10] Worker D docs/scripts consistency repair
- Repaired docs/scripts consistency drift only: `assigned_at`/`assignedAt` wording now says assignment time is derived from status history, event metadata or read model rather than a required `Order.assignedAt` schema field; active Prisma validation task commands now include the required `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi` prefix.
- Narrowed `test:delivery-assignment:frontend` to assignment-specific admin frontend specs so it no longer runs unrelated catalog admin-router coverage.
- Checks: `git diff --check` and changed markdown local link validation passed. `npm run test:delivery-assignment:frontend -- --runInBand` no longer runs `admin-router.spec.tsx`, but still fails on existing `admin-assignment-route.spec.tsx` expectations in the current dirty worktree; no production code, schema, test behavior, commits or pushes were changed.

## [2026-05-09] TASK-FT016-19 verified
- Verified `TASK-FT016-19` with `PASS`: Memory Bank docs now reflect the repo-local FT-016 v2 flow after `TASK-FT016-18`, including offer/claim assignment, `PICKED_UP`, operator/admin `COMPLETED`, disabled normal legacy assignment and old v1 active order readability.
- Confirmed historical failed/repaired task evidence remains preserved and residual real Android Telegram smoke / production deploy smoke / real Telegram bot delivery risks remain explicit. Marked `TASK-FT016-19` done and closed the FT-016 migration as complete for repo-local scope.
- Required docs-only checks passed: `git diff --check` and changed markdown local link validation. No production code, tests, schemas, fixtures, evidence artifacts, implementation behavior, commits or pushes were changed by this verifier.

## [2026-05-09] TASK-FT016-19 documentation closure
- Synced FT-016 Memory Bank docs after `TASK-FT016-18` repo-local verification `PASS`: feature docs now describe v2 offer/claim assignment, `PICKED_UP` lifecycle, operator/admin completion, disabled normal legacy assignment, repaired historical failures, and residual advisory Android Telegram smoke risk.
- Updated requirements RTM references for `REQ-009`/`REQ-018` to include the FT-016 repo-local evidence path, refreshed the task plan index, added Telegram verification runbook notes for the v2 operator delivery flow, and moved `TASK-FT016-19` to `ready_for_verify`.
- No production code, tests, schemas, fixtures, evidence artifacts, implementation behavior, commits or pushes were changed by this docs-only task.

## [2026-05-09] TASK-FT016-19 backlog/status sync
- Synced only `TASK-FT016-19` from the `FT-016` implementation plan into the active backlog as the next documentation and Memory Bank sync task after `TASK-FT016-18` verified `PASS`.
- The task is constrained to feature docs, requirements RTM lifecycle, tasks/plans index, changelog and runbook notes if needed; code fixes, implementation behavior changes and additional FT-016 task expansion remain out of scope.
- Updated the `/autopilot` status protocol so the next sequential iteration may select `TASK-FT016-19` as the single ready FT-016 task.

## [2026-05-09] TASK-FT016-18 verified full operator delivery flow
- Verified `TASK-FT016-18` with `PASS` under strict verification/docs-only constraints: no production code, frontend/backend logic, schema, test, fixture or evidence patches were made.
- Repo-local evidence covers paid checkout order creation, operator unassigned visibility, manual offer, courier claim into `ASSIGNED`, courier progression through `PICKED_UP -> IN_PROGRESS -> DELIVERED`, operator/admin `DELIVERED -> COMPLETED`, customer/admin polling visibility, disabled normal legacy assignment and old v1 active order readability.
- Passed checks: checkout-payment Jest, `npm run test:delivery-assignment -- --runInBand`, `npm run test:delivery-tracking -- --runInBand`, focused admin assignment Jest, `npm run test:order-tracking:frontend -- --runInBand`, `npm run lint`, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation.

## [2026-05-09] TASK-FT016-18 strict verification scope repaired
- Updated `TASK-FT016-18` back to `ready` with strict verification/docs-only scope after the REQUEST_CHANGES review gate.
- The task now explicitly forbids production code changes, frontend/backend logic changes, schema changes, test repair, evidence repair, fixture repair, and implementation/test/fixture/evidence patches during verification. Any wiring gap must produce `FAIL` plus a separate narrow repair task.
- Updated the `/autopilot` status protocol so `TASK-FT016-18` is the active ready task and the currently synced FT-016 queue has no blocker.

## [2026-05-09] TASK-FT016-18 review gate requested scope changes
- Review gate returned `REQUEST_CHANGES` for `TASK-FT016-18` before execution because the card still allowed test/evidence repair during verification, which conflicts with the required verification/docs-only gate.
- Marked `TASK-FT016-18` blocked pending follow-up approval of strict verification reports/docs-only scope. If the end-to-end flow exposes a wiring gap, the verifier must fail the task and create or suggest a narrow repair task instead of patching during verification.

## [2026-05-09] TASK-FT016-18 backlog sync
- Synced only `TASK-FT016-18` from the `FT-016` implementation plan into the active backlog as the next end-to-end operator delivery flow verification task after `TASK-FT016-17-FIX` verified `PASS`.
- Dependencies use repaired-by evidence for the plan's historical failed prerequisites: `TASK-FT016-13-FIX` repairs `TASK-FT016-13`, and `TASK-FT016-17-FIX` repairs `TASK-FT016-17`; `TASK-FT016-16` is the completed polling-consumer prerequisite.
- Scope is verification/docs only: prove the paid `CREATED` order through offer, claim, courier progression, operator `COMPLETED`, polling visibility and old v1 readability. `TASK-FT016-19` remains unsynced in the implementation plan; no implementation files were changed.

## [2026-05-09] TASK-FT016-17-FIX verified
- Verified `TASK-FT016-17-FIX` with `PASS`: delivery-tracking runtime setup no longer uses disabled normal legacy `/assignment` expecting `200`; newly assigned runtime orders use v2 manual `assignment-offers` plus courier `claimOffer`.
- Confirmed `/assignment-override` was not added to delivery-tracking setup, normal legacy `/assignment` remains disabled with `LEGACY_ASSIGNMENT_DISABLED`, and no production behavior, flow semantic change or shared extraction was introduced by the fix.
- Required checks passed: `npm run test:delivery-tracking -- --runInBand`, `npm run test:delivery-assignment -- --runInBand`, `git diff --check`, and changed markdown local link validation. Marked `TASK-FT016-17-FIX` done and recorded `TASK-FT016-17` as repaired-by while retaining original `FAIL` evidence.

## [2026-05-09] TASK-FT016-17-FIX implementation
- Repaired `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts` so newly assigned runtime orders use v2 manual `assignment-offers` plus courier `claimOffer` setup instead of the disabled normal legacy `/assignment` endpoint.
- Customer event filtering coverage now expects the v2 `order.offer_created` and `order.assigned` events for the visible order, excludes unrelated order events, and keeps the global opaque cursor advance.
- No production behavior, legacy endpoint re-enable, flow semantic change or shared extraction was added. Focused checks passed: `npm run test:delivery-tracking -- --runInBand`, `npm run test:delivery-assignment -- --runInBand`, and `git diff --check`. `TASK-FT016-17-FIX` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-17-FIX backlog sync
- Added the single active repair card `TASK-FT016-17-FIX` with status `ready` after `TASK-FT016-17` verification failed on stale delivery-tracking runtime setup.
- Scope is limited to `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`: normal setup must stop using disabled legacy `POST /api/v1/admin/orders/:id/assignment` expecting `200`, and should use v2 offer+claim setup or already-assigned seed/readability setup.
- `/assignment-override` remains allowed only in explicit override tests with `confirmDirectAssignmentOverride: true`; no production behavior changes, flow semantics changes, or legacy endpoint re-enable are part of this fix.

## [2026-05-09] TASK-FT016-17 implementation
- Isolated the legacy direct assignment path: normal admin/operator assignment remains on pending `assignment-offers`, while the old mounted `/assignment` endpoint now returns `LEGACY_ASSIGNMENT_DISABLED` and does not assign.
- Retained direct assignment only through explicit `/assignment-override` with `confirmDirectAssignmentOverride: true`, route-boundary operator role normalization, and a distinct `override_assigned` delivery-assignment audit action.
- Added focused coverage for normal-offer behavior, disabled legacy direct endpoint, required override confirmation, confirmed override, and audit action distinction. Focused checks passed: `npm run test:delivery-assignment -- --runInBand` and focused admin assignment API/view-model/route Jest. `TASK-FT016-17` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-17 backlog sync
- Synced only `TASK-FT016-17` from the `FT-016` implementation plan into the active backlog as the next task after `TASK-FT016-16` verified `PASS`.
- The task is constrained to isolating or removing the legacy direct assignment normal path: normal manual operator/admin flow should create an offer, while any retained direct assignment must be explicit override-only with confirmation/audit and v1 assigned orders remaining readable.
- Dependencies include `TASK-FT016-10`, repaired-by `TASK-FT016-15-FIX` for the plan's historical `TASK-FT016-15` prerequisite, and `TASK-FT016-16`. `TASK-FT016-18+` remain unsynced in the implementation plan. No implementation files were changed.

## [2026-05-09] TASK-FT016-16 verified
- Verified `TASK-FT016-16` with `PASS`: customer order tracking consumes ordered `PICKED_UP`, `IN_PROGRESS`, `DELIVERED` and operator/admin `COMPLETED` polling updates read-only, accepts `DELAYED` plus `oldStatus/newStatus` payloads, and keeps `revision`/`next_cursor` string-only.
- Confirmed `COMPLETED` and `CANCELLED_*` terminal states stay closed, customer UI exposes no operator/admin controls, and admin operator read-model coverage handles `PICKED_UP`, `DELAYED`, `COMPLETED` and terminal closed rows.
- Required checks passed: `npm run test:order-tracking:frontend -- --runInBand`, focused admin assignment API/view-model/route Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation. Marked `TASK-FT016-16` done.

## [2026-05-09] TASK-FT016-16 implementation
- Aligned frontend polling consumers with the FT-016 v2 delivery lifecycle: customer order tracking now exposes only courier-owned actions through `PICKED_UP -> IN_PROGRESS -> DELIVERED`, while operator/admin `COMPLETED` is consumed as a read-only polling event.
- Extended the customer event parser to accept both `status/previousStatus` and `newStatus/oldStatus` status-event payloads without parsing opaque cursor/revision values.
- Added focused customer polling tests for ordered `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED` updates with no mutation controls, plus admin tests proving terminal rows stay closed after `COMPLETED`/`CANCELLED_*`.
- Focused checks passed: `npm run test:order-tracking:frontend -- --runInBand`, focused admin assignment API/view-model/route Jest, `npm run build:frontend`, and `git diff --check`. `TASK-FT016-16` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-16 backlog sync
- Synced only `TASK-FT016-16` from the `FT-016` implementation plan into the active backlog as the next polling-consumer alignment task after `TASK-FT016-15-FIX` verified `PASS`.
- The task is constrained to mini-app/admin-web polling consumers for `PICKED_UP`, `DELAYED` and operator/admin `COMPLETED`; backend transition logic, offer claim, timeout evaluator, assignment rules, cancellation/refund and legacy cleanup remain out of scope.
- Dependencies include `TASK-FT016-14` and repaired-by evidence `TASK-FT016-15-FIX` for the historical `TASK-FT016-15` failure. `TASK-FT016-17+` remain unsynced in the implementation plan. No implementation files were changed.

## [2026-05-09] TASK-FT016-15-FIX verified
- Verified `TASK-FT016-15-FIX` with `PASS`: the mounted operator/admin status command now normalizes admin-access `manager` to delivery-tracking `operator` only at this command boundary.
- Confirmed `admin` remains admin-capable, `boss` remains rejected with no status side effects, and invalid manager `PICKED_UP -> COMPLETED` still returns `409 CONFLICT`.
- Required checks passed: `npm run test:delivery-tracking -- --runInBand` and `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added. Marked `TASK-FT016-15-FIX` done and recorded `TASK-FT016-15` as repaired-by while retaining original FAIL evidence.

## [2026-05-09] TASK-FT016-15-FIX implementation
- Repaired the mounted operator/admin status command role boundary by normalizing admin-access `manager` to delivery-tracking `operator` only for this command. `admin` still passes through as `admin`, and non-operator roles are not broadly authorized.
- Added focused runtime coverage proving authenticated `MANAGER` can close `DELIVERED -> COMPLETED`, invalid manager `PICKED_UP -> COMPLETED` still returns `409`, and `BOSS` remains rejected without status side effects.
- Focused checks passed: `npm run test:delivery-tracking -- --runInBand` and `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added. `TASK-FT016-15-FIX` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-15-FIX backlog sync
- Added the single active repair card `TASK-FT016-15-FIX` with status `ready` after `TASK-FT016-15` verification failed on real admin-access role mapping.
- Scope is limited to the operator/admin status command boundary: normalize admin-access `manager` to delivery-tracking `operator` capability for this command, keep `admin` admin-capable, and add runtime coverage for `manager` `DELIVERED -> COMPLETED`.
- No implementation files were changed; lifecycle transitions, UI behavior, cancellation/refund, assignment/claim/timeout/auto-offer and legacy cleanup remain out of scope.

## [2026-05-09] TASK-FT016-15 implementation
- Added a separate `delivery-tracking` operator/admin status command and admin runtime endpoint for allowed next transitions only, including `DELIVERED -> COMPLETED`; courier tracking/bot completion remains rejected.
- Admin-web now enables status control only where the server has an allowed next transition and asks for confirmation before writing the command; targeted/broadcast offer and bot-chat behavior remain in their existing scopes.
- Status-change event payloads can carry actor role/name, and the operator read model surfaces actor role/name in history rows after runtime status writes.
- Focused checks passed: `npm run test:delivery-tracking -- --runInBand`, focused admin assignment API/route/view-model Jest, `npm run build:frontend`, and `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added. `TASK-FT016-15` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-15 backlog sync
- Synced only `TASK-FT016-15` from the `FT-016` implementation plan into the active backlog as the next operator/admin completion task after `TASK-FT016-14` verified `PASS`.
- The task is constrained to operator/admin status control and `DELIVERED -> COMPLETED` closure with confirmation and actor-visible history/read-model evidence; courier completion remains rejected.
- Dependencies are the plan prerequisites `TASK-FT016-14` and `TASK-FT016-06`; `TASK-FT016-16+` remain unsynced in the implementation plan. No implementation files were changed.

## [2026-05-09] TASK-FT016-14 verified
- Verified `TASK-FT016-14` with `PASS`: the `delivery-tracking` v2 courier lifecycle is now `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, and courier `DELIVERED -> COMPLETED` is rejected until the future operator/admin completion task.
- Confirmed transition/action statuses and Telegram tracking callbacks expose only pickup/progress/delivered actions; legacy active orders already in `IN_PROGRESS` can still move to `DELIVERED`.
- Required checks passed: `npm run test:delivery-tracking -- --runInBand`, `git diff --check`, and changed markdown local link validation. Marked `TASK-FT016-14` done.

## [2026-05-09] TASK-FT016-14 implementation
- Enabled the `delivery-tracking` v2 courier lifecycle `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED` in the slice-owned transition map and removed courier `DELIVERED -> COMPLETED` from available tracking actions.
- Updated the Telegram delivery-tracking harness to expose `PICKED_UP`, `IN_PROGRESS`, and `DELIVERED` callback actions only; `COMPLETED` callbacks now parse as invalid transport intents.
- Preserved compatibility for legacy active orders already in `IN_PROGRESS`: `IN_PROGRESS -> DELIVERED` remains valid, while skip/replay/regression and courier completion attempts return `409 CONFLICT` without persistence side effects.
- Focused checks passed: `npm run test:delivery-tracking:unit -- --runInBand`, `npm run test:delivery-tracking:integration -- --runInBand`, `npm run test:delivery-tracking -- --runInBand`, and `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added. `TASK-FT016-14` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-14 backlog sync
- Synced only `TASK-FT016-14` from the `FT-016` implementation plan into the active backlog as the next v2 delivery-tracking state-machine task after `TASK-FT016-13-FIX` verified `PASS`.
- The task is constrained to backend/telegram-bot delivery-tracking transitions: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, preserving old already-in-progress orders and keeping courier completion disabled.
- Dependencies include the plan prerequisites `TASK-FT016-01` and `TASK-FT016-10`, plus repaired-by evidence `TASK-FT016-13-FIX` for the historical `TASK-FT016-13` failure. `TASK-FT016-15+` remain unsynced in the implementation plan. No implementation files were changed.

## [2026-05-09] TASK-FT016-13-FIX verified
- Verified `TASK-FT016-13-FIX` with `PASS`: customer order-tracking now accepts the real timeout-produced `order.delayed` event shape and normalizes `payload.newStatus -> status` plus `payload.oldStatus -> previousStatus`.
- Focused parser and open read-only tracking route tests prove an already-open customer screen renders `DELAYED` waiting/problem copy without courier progress wording or mutation controls.
- Required checks passed: `npm run test:order-tracking:frontend -- --runInBand`, focused admin assignment/view-model Jest, and `git diff --check`. Marked `TASK-FT016-13-FIX` done; `TASK-FT016-13` remains historically failed with repaired-by evidence rather than being silently rewritten.

## [2026-05-09] TASK-FT016-13-FIX implementation
- Repaired the customer order-tracking parser so polling now accepts the real timeout-produced `order.delayed` event and normalizes `payload.newStatus -> status` plus `payload.oldStatus -> previousStatus`.
- Added focused parser coverage and an open read-only customer tracking route polling test proving `CREATED -> DELAYED` renders customer-safe waiting/problem copy without courier/admin mutation controls or courier progress wording.
- Required checks passed: `npm run test:order-tracking:frontend -- --runInBand` and `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added. `TASK-FT016-13-FIX` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-13-FIX backlog sync
- Added the single active repair card `TASK-FT016-13-FIX` with status `ready` after the `TASK-FT016-13` verification failure.
- Scope is limited to the `mini-app` customer order-tracking parser/read-copy path: accept `order.delayed`, normalize `payload.newStatus -> status` and `payload.oldStatus -> previousStatus`, and add focused parser/polling coverage.
- No implementation files were changed; backend producer, timeout evaluator, assignment/offer/claim, admin-web and mutation-command scopes remain explicitly out of the fix.

## [2026-05-09] TASK-FT016-13 verification failed
- Verified `TASK-FT016-13` with `FAIL`: admin/operator `DELAYED` alert/read-model copy and direct customer `DELAYED` copy tests pass, but customer order tracking parser does not consume the real timeout-produced `order.delayed` event shape.
- Blocking gap: `TASK-FT016-12` emits `order.delayed` with `oldStatus`/`newStatus`, while `frontend/src/slices/order-tracking/api/order-tracking-api.ts` accepts only `order.assigned`/`order.status_changed` and requires `payload.status`.
- Required checks still pass (`focused admin assignment Jest`, `npm run test:order-tracking:frontend -- --runInBand`, `git diff --check`, changed-doc link validation), but acceptance remains failed until `order.delayed` is normalized in the customer parser with focused coverage.

## [2026-05-09] TASK-FT016-13 implementation
- Surfaced `DELAYED` defensively in the admin/operator read model: `status=DELAYED` now drives danger tone, delayed row marker and top-alert copy even if a stale/non-delayed severity value is returned by the read model.
- Customer order tracking remains read-only and now has focused route coverage for `DELAYED` waiting/problem copy without courier progress wording or mutation controls; existing parser coverage accepts `DELAYED` and `PICKED_UP` as FT-016 lifecycle statuses.
- Required scoped checks passed: focused admin assignment Jest, `npm run test:order-tracking:frontend -- --runInBand`, `git diff --check`, and changed markdown local link validation. The broader admin script still has the unrelated catalog provisioning copy expectation drift in `admin-router.spec.tsx`. `TASK-FT016-13` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-13 backlog sync
- Synced only `TASK-FT016-13` from the `FT-016` implementation plan into the active backlog as the next `DELAYED` escalation presentation/read-copy task. Status is `ready` because `TASK-FT016-12` is verified `PASS` and marked `done`.
- The task is constrained to admin panel/customer order-tracking visibility for `DELAYED`: no timeout evaluator changes, assignment rule changes, customer mutation commands, claim logic, auto-offer changes, pickup/completion/status progression, or legacy direct assignment cleanup.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-13`; `TASK-FT016-14+` remain unsynced in the implementation plan. No implementation files were changed.

## [2026-05-09] TASK-FT016-12 verified
- Verified `TASK-FT016-12` with `PASS`: the offer timeout evaluator is an explicit callable `delivery-assignment` command/manual tick route, with no worker, cron, Redis, queue, microservice, GPS/maps/routing, auto-accept or broadcast behavior change.
- Confirmed repeat notification is persisted/sent once after 3 minutes, pending offers expire after 6 minutes, unassigned orders are set/kept `DELAYED`, `order.assignment_timeout`/`order.delayed` artifacts are recorded before Telegram operator alerts, and only personal/manual target couriers are penalized once.
- Required checks passed: `npm run test:delivery-assignment -- --runInBand`, `git diff --check`, and changed markdown local link validation. Marked `TASK-FT016-12` done and closed the active synced `FT-016` queue for this `/autopilot` run.

## [2026-05-09] TASK-FT016-12 implementation
- Added an explicit KISS offer timeout evaluator for `delivery-assignment`: callable service/controller command plus protected dev-runtime manual tick route, with no worker, cron, Redis, queue or auto-offer behavior change.
- The evaluator records `order.offer_repeated` once after 3 minutes, expires still-pending offers after 6 minutes, sets/keeps unassigned orders `DELAYED`, records `order.assignment_timeout` and `order.delayed` only after persistence, and notifies operators through the existing Telegram dispatcher boundary when operator Telegram targets exist.
- Personal/manual target courier `ratingScore` is decremented once on second timeout; broadcast offers are expired without courier penalty. Claimed/accepted offers, `ASSIGNED` orders, orders with `courierId`, completed/terminal/post-assignment lifecycle and claim semantics stay untouched.
- Focused coverage added for repeat-once, 6-minute expiry/`DELAYED`, idempotency, skip claimed/assigned, no claim/broadcast side effects, personal-only penalty and runtime manual tick. `npm run test:delivery-assignment -- --runInBand` passes; `TASK-FT016-12` is `ready_for_verify`.

## [2026-05-09] TASK-FT016-12 backlog sync
- Synced only `TASK-FT016-12` from the `FT-016` implementation plan into the active backlog as the next timeout/`DELAYED` evaluator task. Status is `ready` because `TASK-FT016-11` is verified `PASS` and marked `done`; the plan's explicit `TASK-FT016-10` dependency remains listed.
- The task is constrained to an explicit KISS timeout evaluator/manual tick path: repeat notification after 3 minutes once, expire pending offers after 6 minutes, set or keep `DELAYED`, publish timeout/delayed events, notify operators, and penalize only personal target couriers once.
- `TASK-FT016-13+` remain unsynced in the implementation plan. No implementation files were changed.

## [2026-05-09] TASK-FT016-11 verified
- Verified `TASK-FT016-11` with `PASS`: the optional auto-offer broadcast path is an explicit operator/admin trigger and remains default OFF because no automatic new-order evaluator, timer, queue or background dispatch path was added.
- Confirmed broadcast filters active/free/auto-offer-enabled couriers, persists pending `broadcast` offers plus `order.offer_created` before Telegram notifications, and does not set `courierId`, change status to `ASSIGNED`, write assignment history/audit or publish `order.assigned`.
- Required checks passed: `npm run test:delivery-assignment -- --runInBand`, focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation. Marked `TASK-FT016-11` done and closed the active synced `FT-016` queue for this `/autopilot` run.

## [2026-05-09] TASK-FT016-11 implementation
- Added an explicit operator/admin auto-offer broadcast trigger for `delivery-assignment`. Auto-offer remains default OFF because no automatic new-order evaluator or global background setting was added; broadcast happens only through the explicit admin/operator command.
- Broadcast filters active/free/auto-offer-enabled couriers, persists pending `broadcast` offers plus `order.offer_created` events, then sends courier offer notifications after persistence. Broadcast itself does not set `courierId`, does not change order status to `ASSIGNED`, does not write assignment history/audit and does not publish `order.assigned`.
- Added the narrow admin-web action/API for explicit broadcast, runtime smoke with two eligible couriers, and focused tests for default OFF/no automatic broadcast, eligible filtering, persistence-before-notification and no assignment side effects. Required checks passed: `npm run test:delivery-assignment -- --runInBand`, focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation. `TASK-FT016-11` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-11 backlog sync
- Synced only `TASK-FT016-11` from the `FT-016` implementation plan into the active backlog as the next optional auto-offer broadcast trigger task. Status is `ready` because `TASK-FT016-10` is verified `PASS` and marked `done`.
- The plan orders `TASK-FT016-11` before timeout/`DELAYED` escalation; `TASK-FT016-12+` remain unsynced in the implementation plan. `TASK-FT016-11` is constrained to explicit opt-in broadcast fan-out with default OFF and still requires courier claim for assignment.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-11` for `FT-016`.

## [2026-05-09] TASK-FT016-10 verified
- Verified `TASK-FT016-10` with `PASS`: Telegram claim callback parsing delegates to the existing delivery-assignment service boundary, pending targeted/broadcast offers remain non-assignment until claim, and the successful claim transaction sets `courierId`, status `ASSIGNED`, accepted offer `CLAIMED`, sibling pending offers `CANCELLED`, status history/audit and `order.assigned` only after successful persistence.
- Confirmed duplicate/concurrent/wrong/invalid claims do not create second assignment/history/audit/event side effects; manual offer creation still does not set `ASSIGNED`; legacy direct assignment remains as the explicit existing `/assignment` path.
- Required checks passed: `npm run test:delivery-assignment -- --runInBand`, `git diff --check`, and changed markdown local link validation. Marked `TASK-FT016-10` done and closed the active synced `FT-016` queue for this `/autopilot` run.

## [2026-05-09] TASK-FT016-10 implementation
- Added atomic pending-offer courier claim for `delivery-assignment`: a Telegram bot claim callback parses into a slice-local application command, validates pending claimable offer, `CREATED|DELAYED` unassigned order, and active/free courier, then commits the first successful claim.
- The successful v2 claim path sets `courierId`, status `ASSIGNED`, marks the accepted offer `CLAIMED`, cancels sibling pending offers when supported by the model, writes status history/audit and publishes `order.assigned` only after commit. Duplicate/concurrent/wrong/invalid claims return controlled failures without second history/audit/event side effects. Legacy direct assignment remains unchanged as an explicit legacy path.
- Required checks passed: `npm run test:delivery-assignment -- --runInBand` and `git diff --check`. `TASK-FT016-10` is `ready_for_verify`; verifier role remains separate.

## [2026-05-09] TASK-FT016-10 backlog sync
- Synced only `TASK-FT016-10` from the `FT-016` implementation plan into the active backlog as the next atomic courier claim task. Status is `ready` because `TASK-FT016-09` is verified `PASS` and marked `done`.
- The task is constrained to pending-offer claim only: exactly one claimant may win, order status becomes `ASSIGNED` only after successful claim, and `order.assigned` may be published only after that claim.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-10`; `TASK-FT016-11+` remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-09 verified
- Verified `TASK-FT016-09` with `PASS`: manual targeted offer creation persists a pending manual `AssignmentOffer`, validates order `CREATED|DELAYED`, validates the target courier through the current active/free availability boundary, records `order.offer_created`, and notifies the courier through the Telegram notifier boundary.
- Confirmed the order remains unassigned: no status change to `ASSIGNED`, no `courierId` assignment, no status history/audit write, and no `order.assigned` publication from the manual offer path. Legacy direct assignment remains available only as the explicit legacy `/assignment` path.
- Required checks passed: `npm run test:delivery-assignment -- --runInBand`, focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation. Marked `TASK-FT016-09` done and closed the active synced `FT-016` queue for this `/autopilot` run.

## [2026-05-09] TASK-FT016-09 implementation
- Added manual targeted offer creation for `delivery-assignment`: operator/admin can create a pending manual `AssignmentOffer` only for `CREATED` or `DELAYED` orders and only when the target courier is active/free through the existing availability boundary.
- The new path persists `order.offer_created` after offer persistence, notifies the target courier through the existing Telegram notifier boundary, and leaves order status/courier assignment unchanged. It does not publish `order.assigned`, write status history, claim an offer, run timeout escalation, broadcast auto-offers, or clean up legacy direct assignment.
- Admin assignment UI now enables the existing targeted-offer action for eligible unassigned rows and renders controlled submit success/error states. Focused backend/admin tests, frontend build and `git diff --check` pass; the broader admin suite still has the unrelated catalog provisioning copy expectation drift.

## [2026-05-09] TASK-FT016-09 backlog sync
- Synced only `TASK-FT016-09` from the `FT-016` implementation plan into the active backlog as the next manual targeted offer creation task. Status is `ready` because `TASK-FT016-07-FIX` and `TASK-FT016-08` are verified `PASS` and marked `done`.
- The task is constrained to pending targeted offer creation: order status remains unchanged, no claim, timeout, auto-offer broadcast, legacy direct assignment cleanup, or normal direct assignment path is enabled.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-09`; later `FT-016` migration tasks remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-08 verified
- Verified `TASK-FT016-08` with `PASS`: the Telegram courier availability harness is transport-only, emits the `Курьер` menu/actions, parses callbacks into delivery-assignment service intents only, and has no direct Prisma imports/writes.
- Required checks passed: `npm run test:delivery-assignment`, `git diff --check`, and changed markdown local link validation.
- Marked `TASK-FT016-08` done. `TASK-FT016-09` can be prepared next from the FT-016 implementation plan, but remains unsynced in the active backlog until deliberately selected.

## [2026-05-09] TASK-FT016-08 implementation
- Added a transport-only Telegram courier availability harness for the `Курьер` menu with `Выйти на работу`, `Завершить прием заказов через 5 минут`, and `Автоматически принимать заказы: ON/OFF` buttons.
- Callback payloads parse into delivery-assignment service intents and can be delegated only through the existing courier availability service boundary; no webhook runtime, Prisma write path, offer creation, claim, status progression, timeout, admin UI, history/audit or event side effects were added.
- Required checks passed: `npm run test:delivery-assignment`, `git diff --check`, and changed markdown local link validation. `TASK-FT016-08` remains `in_progress` for verifier closure.

## [2026-05-09] TASK-FT016-08 backlog sync
- Synced only `TASK-FT016-08` from the `FT-016` implementation plan into the active backlog as the next `telegram-bot` transport/harness task for the courier menu and callback intent parsing.
- Status is `ready` because `TASK-FT016-07-FIX` is verified `PASS` and marked `done`, repairing the historical `TASK-FT016-07` prerequisite. `TASK-FT016-09+` remain unsynced in the implementation plan.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-08`.

## [2026-05-09] TASK-FT016-07-FIX verified
- Verified `TASK-FT016-07-FIX` with `PASS`: the out-of-scope courier availability presentation/controller exposure is removed, while the `TASK-FT016-07` application/domain/infra availability behavior and focused tests remain intact.
- Required checks passed: `npm run test:delivery-assignment`, `git diff --check`, and changed/new markdown local link validation.
- Marked `TASK-FT016-07-FIX` done and resolved `BUG-2026-05-09-task-ft016-07-presentation-scope-leak`. `TASK-FT016-07` remains historically failed with repaired-by evidence rather than being silently rewritten.

## [2026-05-09] TASK-FT016-07-FIX implementation
- Removed the out-of-scope courier availability presentation exposure from `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`. The allowed `TASK-FT016-07` application/domain/infra availability behavior remains intact.
- Required checks passed: `npm run test:delivery-assignment`, `git diff --check`, and changed markdown local link validation.
- Updated the `TASK-FT016-07` verification evidence and bug record to show the scope leak is repaired pending verifier closure. `TASK-FT016-07-FIX` remains `in_progress` in backlog for the verifier to close.

## [2026-05-09] TASK-FT016-07 verification failed
- Verified `TASK-FT016-07` with `FAIL`: the courier availability service/repository behavior and focused tests pass, but the change also exposed availability methods through `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`, violating the approved `application/domain/infra/tests` only scope.
- Required checks passed: `npm run test:delivery-assignment`, `git diff --check`, changed markdown local link validation and `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`. The schema validation was run because the shared worktree includes FT-016 schema changes from earlier tasks.
- Marked `TASK-FT016-07` failed, opened `BUG-2026-05-09-task-ft016-07-presentation-scope-leak`, and added ready repair task `TASK-FT016-07-FIX`. Later FT-016 tasks remain blocked until the repair passes.

## [2026-05-09] TASK-FT016-07 implementation
- Added the `delivery-assignment` backend application boundary for server-owned courier availability: start work, stop accepting after 5 minutes, auto-offer participation toggle and active/free query. Active is calculated from courier work state plus `accepting_orders_until`; free is calculated from current orders in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, or `DELIVERED`.
- Kept the task intentionally inert beyond availability state: no offer creation, courier claim, bot menu/callback wiring, admin UI toggle, auto-offer fan-out, timeout evaluator or order status/history/audit/event side effects were added. Focused delivery-assignment tests and `git diff --check` passed; Prisma schema was not changed.

## [2026-05-09] TASK-FT016-07 backlog sync
- Synced only `TASK-FT016-07` from the `FT-016` implementation plan into the active backlog as the next delivery-assignment application-boundary task for courier availability. Status is `ready` because `TASK-FT016-02` and `TASK-FT016-06` are marked `done`.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-07`; `TASK-FT016-08+` remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-06 verified
- Verified `TASK-FT016-06` with `PASS`: the admin-web operator delivery table now shows disabled/guarded action cells for targeted offer, status control confirmation and bot chat redirect, with explicit `Backend not yet enabled` / `Runtime not yet enabled` labels and details that no offer, status history write, lifecycle command, bot redirect or message persistence is active.
- Required checks passed: focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation. The broader `admin-router.spec.tsx` still has the unrelated catalog provisioning copy expectation drift and remains non-blocking for this task.
- Marked `TASK-FT016-06` done. Later `FT-016` migration tasks remain unsynced in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md` until deliberately selected for a later wave.

## [2026-05-09] TASK-FT016-06 implementation
- Added inert admin-web operator action cells for targeted offer, status control confirmation and bot chat redirect on the existing operator delivery orders surface. All three actions are visibly unavailable with `Backend not yet enabled` / `Runtime not yet enabled` labels, so the UI prepares the FT-016 affordances without calling offer/status/bot/message behavior.
- Preserved the `TASK-FT016-04/05` read surface and admin shell: no backend mutation, direct assignment flow, bot deep-link execution, message persistence, cancellation/refund behavior, auto-offer toggle or courier claim was added. Focused admin assignment route/model tests, `npm run build:frontend`, and `git diff --check` passed; the broader `admin-router.spec.tsx` still has the pre-existing catalog provisioning copy expectation drift.

## [2026-05-09] TASK-FT016-06 backlog sync
- Synced only `TASK-FT016-06` from the `FT-016` implementation plan into the active backlog as the next admin-web placeholder action task. Status is `ready` because `TASK-FT016-05` is verified `PASS` and marked `done`.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-06`; `TASK-FT016-07+` remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-05 verified
- Verified `TASK-FT016-05` with `PASS`: the admin-web operator surface remains read-side only, renders the top courier attention alert for `DELAYED` and no-accepted-courier rows, applies deterministic severity tones with blinking `DELAYED` rows, and supports stable local sorting for urgency/severity, created time, status, courier absent/name, assigned time and last-message availability.
- Required checks passed: focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation.
- Marked `TASK-FT016-05` done. Later `FT-016` migration tasks remain unsynced in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md` until deliberately selected for the next wave.

## [2026-05-09] TASK-FT016-05 implementation
- Added the admin-web read-side operator attention alert for `DELAYED` and no-accepted-courier orders on the existing assignment/operator page, with deterministic local severity tones: `DELAYED`/60m+/`DELIVERED` attention as red, no courier as light blue, active under 30m yellow, 30-60m orange, cancelled purple, and completed neutral.
- Added local read-model sorting controls for urgency/severity, created time, status, courier absent/name, assigned time and last message availability with stable tie-breakers. The current backend read model has no separate `latestMessageAt`, so the last-message control explicitly treats placeholder rows as null/last without widening the backend contract.
- No backend state creation, timeout, bot notification, offer/status/cancellation/refund mutation, courier claim, auto-offer toggle, chat redirect or cancellation UI behavior was added.

## [2026-05-09] TASK-FT016-05 backlog sync
- Synced only `TASK-FT016-05` from the `FT-016` implementation plan into the active backlog as the next admin-web read-side presentation task. Status is `ready` because `TASK-FT016-04` is verified `PASS` and marked `done`.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next sequential `/autopilot` iteration may select only `TASK-FT016-05`; `TASK-FT016-06+` remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-04 verified
- Verified `TASK-FT016-04` with `PASS`: the protected admin assignment route now consumes `GET /api/v1/admin/operator/delivery/orders` as a read-only operator delivery orders surface and renders the backend 4-day window, severity chips, courier current/absent markers, row summaries, null latest-message placeholders and expandable history while preserving the existing admin shell/theme.
- Required checks passed: focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation. The broader `npm run test:delivery-assignment:frontend -- --runInBand` still has a non-blocking catalog provisioning copy expectation drift unrelated to this task.
- Marked `TASK-FT016-04` done. Later `FT-016` migration tasks remain unsynced in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md` until deliberately selected for the next wave.

## [2026-05-09] TASK-FT016-04 implementation
- Converted the existing protected admin assignment route into a read-only operator delivery orders surface that consumes `GET /api/v1/admin/operator/delivery/orders`. The page keeps the admin shell/theme, renders the backend 4-day window, severity chips, current/absent courier marker, assigned/claimed timestamps, latest-message placeholders and expandable status history.
- Removed the old direct assignment form/CTA from the default route experience. No backend mutation, offer submit, auto-offer toggle, chat redirect, cancellation UI, refund UI, status command or bot behavior was added. Focused admin API/route tests and `npm run build:frontend` passed; the broader admin suite still has an unrelated catalog provisioning copy expectation drift.

## [2026-05-09] TASK-FT016-04 backlog sync
- Synced only `TASK-FT016-04` from the `FT-016` implementation plan into the active backlog as the next admin-web read-surface task. Status is `ready` because `TASK-FT016-03` is verified `PASS` and marked `done`.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next `/autopilot` iteration may select only `TASK-FT016-04`; `TASK-FT016-05+` remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-03 verified
- Verified `TASK-FT016-03` with `PASS`: the read-only protected admin operator delivery endpoint returns the 4-day local-calendar read model with status, courier marker/display, assigned/claimed timestamp, severity, history rows, revision metadata and explicit `null` latest-message placeholders.
- Required checks passed: `npm run test:delivery-tracking -- --runInBand`, `npm run test:delivery-assignment -- --runInBand`, `npm run test:order-cancellation -- --runInBand`, `git diff --check`, and changed markdown local link validation.
- Marked `TASK-FT016-03` done. Later `FT-016` migration tasks remain unsynced in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md` until deliberately selected for the next wave.

## [2026-05-09] TASK-FT016-03 implementation
- Added the read-only admin-protected operator delivery endpoint `GET /api/v1/admin/operator/delivery/orders` in the dev runtime. It returns the local-calendar 4-day order window with row summaries, current status, courier absent/current marker, assigned/claimed timestamp when known, computed severity, status history rows, status revision metadata, and explicit `null` latest-message placeholders while no order communication model exists.
- Kept existing assignment, cancellation and refund routes operational; no UI, offer creation, claim, status mutation, cancellation/refund mutation, bot behavior, auto-offer or timeout evaluator was enabled. Focused runtime coverage includes legacy v1 active orders plus representable `DELAYED` and `PICKED_UP` rows.

## [2026-05-09] TASK-FT016-03 backlog sync
- Synced only `TASK-FT016-03` from the `FT-016` implementation plan into the active backlog as the next read-only backend operator delivery contract task. Status is `ready` because `TASK-FT016-02` is verified `PASS` and marked `done`.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next `/autopilot` iteration may select only `TASK-FT016-03`; `TASK-FT016-04+` remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-02 verified
- Verified `TASK-FT016-02` with `PASS`: additive courier availability fields and `AssignmentOffer` persistence are present with order/courier/status indexes, existing direct assignment v1 remains operational, and no offer creation, claim, timeout, auto-offer, bot menu, operator panel, status transition behavior, backfill, row rewrite, or mass update was enabled.
- Required checks passed: `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`, `npm run test:delivery-assignment`, `npx prisma migrate diff --from-empty --to-schema-datamodel backend/prisma/schema.prisma --script`, `git diff --check`, and changed markdown local link validation. The migrations-directory diff still requires a `--shadow-database-url`; this is recorded as an acceptable residual for this verification because the required schema dry-run passed and migration SQL is additive on inspection.
- Marked `TASK-FT016-02` done. Later `FT-016` migration tasks remain unsynced in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md` until deliberately selected for the next wave.

## [2026-05-09] TASK-FT016-02 implementation
- Added additive `FT-016` persistence compatibility for courier availability and assignment offers: user rows now have `acceptingOrdersUntil`, `autoOfferEnabled`, and `ratingScore`, and the new `AssignmentOffer` persistence shape represents manual/broadcast pending/claimed/expired/cancelled offers with order and courier lookup indexes.
- Updated `delivery-assignment` domain/repository compatibility and focused tests so these fields/offers are representable while the existing v1 direct assignment path remains operational. No offer creation, claim, timeout, auto-offer, bot menu, operator panel, lifecycle transition behavior, backfill, or row rewrite was enabled.

## [2026-05-09] TASK-FT016-02 backlog sync
- Synced only `TASK-FT016-02` from the `FT-016` implementation plan into the active backlog as a persistence/domain compatibility task for courier availability and assignment offers. Status is `ready` because `TASK-FT016-01` is verified `PASS` and marked `done`.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next `/autopilot` iteration may select only `TASK-FT016-02`; later `FT-016` migration tasks remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-01 verified
- Verified `TASK-FT016-01` with `PASS`: Prisma enum compatibility for `DELAYED`, `PICKED_UP`, and `OPERATOR` is present; the migration is enum-only; backend domain unions and mini-app order-tracking parser/view-model accept the new values without enabling offers, claims, bot menu, auto-offer, operator panel behavior, timeout behavior, or new status transitions.
- Required checks passed: `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`, `npm run test:delivery-tracking:unit`, `npm run test:delivery-assignment:unit`, `npm run test:order-tracking:frontend`, `git diff --check`, and changed markdown local link validation.
- Marked `TASK-FT016-01` done. Later `FT-016` migration tasks remain unsynced in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md` until deliberately selected for the next wave.

## [2026-05-09] TASK-FT016-01 backlog sync
- Synced only `TASK-FT016-01` from the `FT-016` implementation plan into the active backlog as a compatibility-only schema/domain task. Status is `ready` because `TASK-FT016-00` is verified `PASS` and marked `done`.
- Updated `.protocols/AUTONOMOUS-RUN/status.md` so the next `/autopilot` iteration may select only `TASK-FT016-01`; later `TASK-FT016-02+` remain unsynced in the implementation plan.

## [2026-05-09] TASK-FT016-00 verified
- Verified `TASK-FT016-00` with `PASS`: the Phase 0 report records current v1 direct assignment and old courier-driven tracking chain as baseline drift, not historical bugs, confirms admin panel repair/extend-first strategy, and captures owning slices, contours, touched layers and shared-code justification.
- Marked `TASK-FT016-00` done in the active backlog. No runtime or schema implementation changes were made; later `FT-016` migration tasks remain in the implementation plan until deliberately synced after this preflight.

## [2026-05-09] FT-016 autopilot preflight sync
- Refreshed `.protocols/AUTONOMOUS-RUN/status.md` for the current `FT-016` `/autopilot` run with review gate `pending/unknown`, queue state, failure budget and terminal hold.
- Synced only Phase 0 into the active backlog as ready `TASK-FT016-00`; later migration tasks remain in `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md` until the baseline drift handoff confirms sequencing.

## [2026-05-09] FT-016 operator delivery migration task cards
- Added [.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md](tasks/plans/IMPL-FT-016-operator-delivery-migration.md): execution-ready staged TASK cards for migrating implemented `FT-004`/`FT-005` v1 delivery operations to the `FT-016` operator delivery target.
- The decomposition records current code baseline drift explicitly: direct admin assignment, old courier-driven tracking chain, partial admin assignment panel, missing offers/claim/availability/`DELAYED`/`PICKED_UP`/operator completion. It keeps the strategy additive-first and repair/extend-first for the existing admin panel.
- No runtime implementation changes were made; the task plan is ready for phase-by-phase backlog sync when execution starts.

## [2026-05-09] FT-016 operator delivery ops spec refresh
- Updated EP-002/requirements/state/contracts/features for the discussed KISS operator delivery operations target: `operator` role, admin-as-operator, desktop-first panel, 4-day order list, top delayed/unassigned alert, bot chat redirect, courier availability menu, optional auto-offer, atomic first-claim-wins assignment and simple courier `rating_score`.
- Changed target lifecycle semantics: pending offers no longer equal `ASSIGNED`; `ASSIGNED` means courier claim succeeded, `PICKED_UP` is inserted before `IN_PROGRESS`, `DELAYED` is the urgent no-courier/problem state, and `DELIVERED -> COMPLETED` is operator/admin manual closure. Existing FT-004/FT-005 implementation notes are marked as superseded target behavior rather than current code closure.
- Added staged migration guidance for implemented FT-004/FT-005 v1 and the existing admin panel: additive-first rollout, no mass rewrite of active orders, repair/extend existing panel by default, and `.memory-bank/tasks/plans/MIGRATE-FT-004-FT-005-to-FT-016.md` as the migration plan.

## [2026-05-09] Created shops design-flow and provisioning UI pass
- Ran a design-flow pass for created/provisioned shops inside the `catalog` slice: saved brief, IA, scoped token notes, and build tasks under `.design/created-shops/`, with explicit boundaries for `admin-web` provisioning, shared `/shops/:publicPath` storefront, and narrow `seller-web` status control.
- Refined `/admin/catalog/shops/provision` as a presentation-only provisioning workspace: the summary now emphasizes durable skeleton storefront creation, seller Telegram binding, initial visibility and starter content, while the created-shop list uses scan-friendly cards with visible `WORKING/NOT_WORKING`, seller/Telegram facts, and public path links without exposing technical `shop.id` as a customer route.
- Verification passed with focused admin provisioning Jest, `npm run lint`, and `npm run build:frontend`; no backend contracts, RTM lifecycle, or catalog domain semantics changed.

## [2026-04-29] MB garden synced refactor hardening wave
- Ran `/mb-garden`: quick check found no active `TODO/TBD/Known gaps` entries outside command examples, and no `scripts/mb-lint.mjs` is configured.
- Synced the recent refactor/security hardening wave into Memory Bank: `dev-runtime` and `reviews-feedback` repository splits are recorded in the root index, while remaining review findings are tracked as ready follow-ups for Mini App/seller Origin enforcement, refund CAS hardening, and refreshing `REFACTORING_IDEAS.md` after the changed line counts.
- RTM lifecycle was left unchanged because the wave was behavior-preserving/hardening work with targeted tests, not a new feature closure.

## [2026-04-27] Android Telegram evidence gate downgraded to advisory
- Updated Memory Bank/task policy so fresh real `Android Telegram` evidence is no longer a blocking gate for repo-local closure. `REQ-032` and `REQ-033` are verified from repo-local checkout/status gates plus an advisory manual smoke note; missing formal Android notes remain explicit pre-release risk.
- Reclassified `TASK-FT009-10` and `TASK-FT013-08` as non-blocking advisory smoke tasks, closed `TASK-FT014-06` for repo-local docs/evidence scope, and updated bug records/index to stop treating missing Android checkout/keyboard notes as blockers.

## [2026-04-27] TASK-FT014-07 events runtime repair
- Mounted the checked-in customer `GET /api/v1/events?since=<cursor>` route in `dev-api-server`, backed it with the operational runtime event stream, and filtered returned events to orders owned by the current Mini App session so unrelated order events stay hidden.
- Checkout success now returns the current event-stream cursor as string `revision` instead of `order.id`, and focused coverage proves opaque cursor tolerance, empty-window stability, customer/order scoping, checkout runtime compatibility, `npm run lint`, and `npm run build:frontend`. After the evidence policy update, this supports `REQ-033` repo-local verification; no Android Telegram evidence closure was attempted.

## [2026-04-27] TASK-MB-REVIEW blockers recorded
- Synced review findings into Memory Bank without product code changes: at that time `FT-013` was blocked on external real `Android Telegram` checkout evidence, and `FT-014` tracked the repo-local missing mounted `/api/v1/events` plus checkout/status cursor compatibility blocker. These blockers were later resolved or downgraded by the 2026-04-27 evidence policy update.
- Added active bug `BUG-2026-04-27-ft014-events-runtime-and-cursor-drift` and ready task `TASK-FT014-07`; later `TASK-FT014-07` repaired the repo-local blocker and Android evidence was downgraded to advisory risk.

## [2026-04-26] TASK-FT014-05 resume and terminal hardening
- Hardened the existing `order-tracking` customer polling consumer for Telegram lifecycle resume: it continues to rely on shell-owned lifecycle state, clears stale in-flight polling on deactivation, and restarts polling without raw Telegram subscriptions or lifecycle write side effects.
- Duplicate/out-of-order event windows now preserve opaque cursor progress without double-rendering lifecycle regressions, and terminal `COMPLETED`/`CANCELLED_*` customer states stay closed against stale progress events. Focused order-tracking Jest, `npm run lint`, and `npm run build:frontend` pass; final paid-order-to-status e2e closure remains with `TASK-FT014-06`.

## [2026-04-26] TASK-FT014-04 customer-safe lifecycle rendering
- Added customer-facing lifecycle rendering to the existing `order-tracking` mini-app surface: `CREATED` now shows explicit paid/waiting-for-assignment copy, assignment and courier progress states stay read-only, and terminal cancellation copy avoids audit/refund internals.
- Focused route coverage now proves `CREATED`, `ASSIGNED`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED`, and `CANCELLED_BY_ADMIN` customer copy plus absence of courier buttons/internal details; `npm run test:order-tracking:frontend -- frontend/src/tests/slices/order-tracking/order-tracking-route.spec.tsx frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts`, `npm run lint`, and `npm run build:frontend` pass. `TASK-FT014-05` is ready.

## [2026-04-26] TASK-FT014-03 opaque-cursor customer polling
- Wired the customer status polling consumer to `GET /api/v1/events?since=<cursor>` from the existing `order-tracking` frontend surface, normalizing `next_cursor`/`nextCursor`, `entity_id`/`entityId`, and `created_at`/`createdAt` while preserving opaque string cursor/revision values without numeric parsing.
- Added focused frontend coverage for empty polling windows, ordered response application, duplicate revision suppression, snake-case event payload parsing, non-string cursor rejection, and encoded `since` requests; `npm run test:order-tracking:frontend -- frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts`, `npm run lint`, and `npm run build:frontend` pass. `TASK-FT014-04` is ready.

## [2026-04-26] TASK-FT014-02 paid-order status entry
- Added the first customer-facing `FT-014` status entry: checkout success now exposes a real paid-order tracking link from `orderId` plus string `revision`, and `/tracking?orderId=...&cursor=...` opens a read-only customer status surface at `CREATED` without courier/admin controls.
- Missing/lost tracking identity now recovers to catalog instead of rendering route-local fake data; focused checkout/order-tracking frontend Jest, `npm run lint`, and `npm run build:frontend` pass. `TASK-FT014-03` is ready for opaque-cursor customer polling wiring.

## [2026-04-26] TASK-FT013-07 repo-local pass, Android evidence blocker
- Ran the final repo-local checkout-payment gates for `FT-013`: focused backend/runtime/frontend Jest passed (`8` suites / `73` tests) and `npm run lint` passed, covering composition-backed checkout, mounted Mini App auth/payment runtime, paid `CREATED` order metadata, retry-safe no-order failures, stale repair and duplicate trusted payment idempotency.
- Under the earlier policy formal closure remained `FAIL` because no fresh real `Android Telegram` evidence was recorded for the post-`FT-013` customer checkout flow; the 2026-04-27 evidence policy update reclassified this as advisory pre-release risk and allowed `REQ-032` repo-local verification.

## [2026-04-26] TASK-FT013-06 checkout retry and idempotency hardening
- Hardened mounted customer checkout failure paths: failed, canceled, timeout and ambiguous provider outcomes now return controlled retry metadata with `orderCreated: false`, while malformed/stale composition responses return repair metadata instead of runtime 500s.
- Duplicate trusted payment confirmation now reuses the existing paid order before stale revalidation, and frontend checkout maps `repair_composition` into catalog recovery; focused backend/runtime checkout tests, frontend checkout tests, and `npm run lint` pass.

## [2026-04-26] TASK-FT013-05 paid CREATED order persistence
- Mounted paid order creation on repo-local `/api/v1/orders/checkout`: authenticated Mini App checkout now consumes the `FT-012` composition payload, revalidates against current catalog state through the `checkout-payment` boundary, performs server-side local provider `PAID` confirmation, and persists one `CREATED` order with `paymentStatus = PAID`.
- The checkout response now returns `orderId`, `updated_at` and string `revision` metadata for downstream `FT-014`; focused runtime coverage, full checkout-payment Jest, and `npm run lint` pass.

## [2026-04-26] TASK-FT013-04 mounted Mini App checkout runtime
- Rewired the checked-in checkout frontend API away from local stub success responses to mounted `/api/v1/auth/telegram`, `/api/v1/auth/telegram/language` and `/api/v1/orders/checkout` runtime calls with cookie credentials.
- Added dev-runtime checkout auth enforcement so checkout submit requires the real Mini App HttpOnly session and returns controlled `PAYMENT_CONFIRMATION_REQUIRED` with `orderCreated: false` until `TASK-FT013-05` owns paid `CREATED` persistence; focused checkout-payment Jest, `npm run lint`, and `npm run build:frontend` pass.

## [2026-04-25] TASK-FT013-03 server-side composition revalidation
- Added a backend `checkout-payment` revalidation seam for the `FT-012` composition draft: the service can call an explicit catalog read boundary, then validates current shop visibility, product availability, positive quantities, price facts, currency facts and authoritative totals before order persistence.
- Stale or invalid drafts now fail with controlled `COMPOSITION_REPAIR_REQUIRED` repair metadata and no order creation; focused checkout-payment Jest and `npm run lint` pass.

## [2026-04-25] TASK-FT013-02 composition-backed checkout entry
- Changed the `checkout-payment` mini-app route so checkout starts from the `FT-012` handoff draft stored as non-sensitive composition data, validates the contract-shaped payload, and renders selected shop, line items, quantities, display snapshots and preview total before payment.
- Added controlled recovery for direct or invalid `/checkout` access instead of fake route-local order data, while keeping payment/order creation out of frontend preview data; focused checkout Jest, catalog handoff Jest, `npm run lint`, and `npm run build:frontend` pass.

## [2026-04-25] TASK-FT013-01 checkout handoff boundary freeze
- Completed the docs-first execution boundary for `FT-013`: `catalog` remains the `FT-012` composition producer, `checkout-payment` consumes and revalidates the draft, and payment/auth/order trust stays on the existing `FT-002` boundary.
- Tightened the composition, payment and implementation-plan wording so future checkout route work starts only from a valid handoff draft or controlled recovery, avoids a shared cart/payment business module, and returns customer-safe order identity/revision metadata for downstream `FT-014` only after commit.

## [2026-04-25] TASK-FT012-06 final FT-012 verification
- Closed the remaining `catalog` mini-app unavailable-state repair: if a selected product disappears from the current public storefront, checkout handoff is disabled, the stale line is marked for customer repair, and removal returns the draft to a valid/empty state.
- Advanced `REQ-031` to `verified` with focused frontend/contract evidence covering visible single-shop composition, replace/clear behavior, checkout payload readiness, blocked invalid/unavailable handoff and no order/payment/stock/event side effects.

## [2026-04-25] TASK-FT012-05 checkout handoff payload
- Added a `catalog`-owned checkout CTA/handoff path that emits the normalized `customer-order-composition-contract.md` payload with `shop_public_path`, internal product identities, quantities, display snapshots, preview total and draft timestamp.
- Kept the handoff side-effect free: empty/invalid drafts are blocked, default route handoff persists only non-sensitive composition data in session storage, and no order/payment/stock/event behavior was added; focused Jest, `npm run test:catalog`, `npm run lint`, and `npm run build:frontend` pass.

## [2026-04-25] TASK-FT012-04 single-shop replace or clear behavior
- Changed the `catalog` mini-app storefront cart UI so cross-shop add attempts no longer silently clear or mix cart contents: the existing draft stays intact until the customer explicitly chooses `Replace cart` or `Clear cart`.
- Added focused frontend coverage for replace and clear flows, while keeping the work local to `catalog` presentation/composition state with no checkout/payment/order/stock/event side effects; `npm run test:catalog`, `npm run lint`, and `npm run build:frontend` pass.

## [2026-04-25] TASK-FT012-03 storefront cart UI wiring
- Wired public storefront product cards to the existing `catalog` composition model for customer add, quantity update and remove flows, and added a customer-visible order draft summary with selected shop, line items, display snapshots, preview totals and checkout readiness.
- Preserved the shared storefront seller/customer tree by hiding cart controls in seller edit mode, kept the work side-effect free, and verified with focused catalog page coverage plus `npm run test:catalog`, `npm run lint`, and `npm run build:frontend`.

## [2026-04-25] TASK-FT012-02 slice-local customer composition state
- Added `catalog`-local customer composition state and mapper in `frontend/src/slices/catalog/model/composition.ts`, covering empty state, add, deterministic duplicate merge, quantity update, remove, same-shop guard and `customer-order-composition-contract.md` payload output.
- Kept the change side-effect free and local to `catalog`: no shared cart business module, no backend order/payment writes, and technical `shop.id` is carried only as internal payload data while `shop_public_path` remains the customer-facing routing identity.

## [2026-04-25] TASK-FT012-01 customer composition boundary freeze
- Completed the docs-first execution boundary for `FT-012`: `catalog` is the composition producer, `checkout-payment` remains the revalidation/payment/order creation consumer, and `customer-order-composition-contract.md` is the only cross-slice artifact.
- Tightened storage/resume and verification wording so future `TASK-FT012-02` implementation stays slice-local, single-shop, side-effect free and avoids a shared cart business module.

## [2026-04-25] FT-014 customer status visibility backlog decomposition
- Added `.protocols/FT-014/{plan,decision-log}.md`, `.memory-bank/tasks/plans/IMPL-FT-014.md`, and active backlog cards `TASK-FT014-01` through `TASK-FT014-06` for boundary freeze, paid-order status entry, opaque-cursor polling, customer-safe lifecycle UI, resume/duplicate hardening and final verification.
- Kept `FT-014` scoped to read-only `delivery-tracking` visibility in the `mini-app` contour; `FT-005` remains owner of event/state semantics, `FT-013` remains owner of paid-order creation metadata, and operational commands stay outside customer UI.

## [2026-04-25] FT-013 checkout handoff backlog decomposition
- Added `.protocols/FT-013/{plan,decision-log}.md`, `.memory-bank/tasks/plans/IMPL-FT-013.md`, and active backlog cards `TASK-FT013-01` through `TASK-FT013-07` for boundary freeze, composition-backed checkout entry, server-side catalog revalidation, mounted Mini App auth/payment runtime, paid `CREATED` order persistence, retry/idempotency hardening and final verification.
- Kept `FT-013` scoped to the `checkout-payment` slice and `mini-app` contour; `catalog` remains the producer of the composition payload, while payment trust and order creation semantics stay on the existing `FT-002` boundary.

## [2026-04-25] FT-012 customer composition backlog decomposition
- Added `.protocols/FT-012/{plan,decision-log}.md`, `.memory-bank/tasks/plans/IMPL-FT-012.md`, and active backlog cards `TASK-FT012-01` through `TASK-FT012-06` for docs freeze, slice-local composition state, storefront cart UI, single-shop replace/clear behavior, checkout handoff payload production, and final verification.
- Kept `FT-012` scoped to the `catalog` slice and `mini-app` contour; downstream checkout revalidation, payment, and order creation remain with `FT-013`/`FT-002`.

## [2026-04-25] EP-001 customer workflow split into cart, checkout handoff and status visibility features
- Added `FT-012`, `FT-013`, and `FT-014` to cover the real customer Mini App flow from product selection and single-shop cart/order composition through checkout handoff, trusted payment/order creation, and customer-facing status visibility.
- Added `REQ-031/032/033` plus `.memory-bank/contracts/customer-order-composition-contract.md`, keeping `FT-002` as the owner of auth/payment/order-creation semantics and `FT-005` as the owner of delivery tracking state/event semantics.

## [2026-04-22] Shared storefront DEBUG mode now exposes diagnostics and a backend bypass on the same catalog path
- Added an explicit `REQ-030` / `FT-010` debug-runtime policy: when `DEBUG=TRUE`, the shared storefront may show copyable diagnostics and the mounted `/api/v1/seller/*` runtime may temporarily bypass owner-only shop access through the same canonical `catalog` boundary instead of a second debug API family.
- `scripts/dev-api.ts` now passes the debug flag into the runtime, seller storefront reads/writes emit structured debug logs for media/save/reload traces, and the storefront UI records copyable `load -> edit -> save -> reload` diagnostics to help debug embedded Telegram flows without browser devtools.

## [2026-04-21] Admin protected routes now refresh once before retrying expired access-cookie requests
- Fixed the checked-in `admin-web` drift where `/admin/catalog/shops/provision` and the other protected admin command surfaces could still show `AUTH_REQUIRED` after the page had already rendered an authenticated shell, because route-entry refresh happened only on initial protected navigation and not on later expired access-cookie requests.
- Added a shared frontend admin protected-request helper that performs one `POST /api/v1/admin/auth/refresh` retry before repeating the original protected request, and added focused Jest regression coverage for the provisioning flow so valid refresh-cookie sessions recover instead of failing closed until a manual reload.

## [2026-04-20] Fixed api container Prisma CLI schema discovery for checked-in migrate commands
- Added checked-in Prisma metadata and a pinned repo-local `prisma` dependency in `package.json`, so `docker compose run --rm api npx --yes prisma migrate status|deploy` now resolves `backend/prisma/schema.prisma` from `/app` and uses the repo-compatible CLI instead of a latest-network download.
- Synced the container deploy runbook and archived the active bug after repo-local verification showed Prisma CLI now gets past schema discovery and reaches normal runtime checks instead of failing with `Could not find Prisma Schema`.

## [2026-04-20] Opened deploy bug for missing Prisma schema inside the api container image
- Recorded an active deploy/runtime bug after VPS rollout evidence showed that `docker compose run --rm api npx --yes prisma migrate status|deploy` fails with `Could not find Prisma Schema`, because the checked-in `api` image starts the runtime but does not expose a canonical Prisma schema path for CLI operations.
- This keeps the issue visible in the Memory Bank as a container-image/runbook drift instead of losing it inside shell history while the admin provisioning payload investigation continues.

## [2026-04-20] Admin provisioning shop-list tests now enforce the canonical flat payload
- Tightened the `/admin/catalog/shops/provision` contract coverage so frontend API/route tests, catalog unit coverage, and mounted runtime regressions all require the flat admin-owned list payload with `shopId`, `shopName`, `status`, `sellerId`, `telegramId`, `primaryPublicPath`, and `secondaryPublicPath`.
- Added an explicit no-fallback frontend API test that rejects the older nested list shape, keeping the project on the new catalog payload end-to-end instead of silently tolerating legacy response forms.

## [2026-04-20] Admin contour styling now loads through the shared frontend bootstrap
- Fixed the current `/admin/*` visual regression by importing `frontend/src/admin/styles/admin-theme.css` through the real shared entrypoint `frontend/src/app/main.tsx`, because the old `frontend/src/admin/main.tsx` import path was no longer mounted by `index.html`.
- Kept one shared root-router/bootstrap architecture: `RootRouter` now marks `body[data-root-contour]` for the active contour, and the admin theme scopes its only global selectors to `admin-web` so customer/seller surfaces keep the existing runtime path unchanged.

## [2026-04-20] Catalog storefront routing now uses immutable public paths instead of technical shop ids
- Fixed the checked-in browse/runtime drift so public catalog fetches and storefront links now use persisted `publicPath` rather than raw `shop.id`, while seller-protected storefront resolution remains compatible with both immutable public aliases of the same shop.
- Synced the catalog spec layer around `/shops/:publicPath`, dual immutable public paths (`sellerId + N` plus vanity translit), and the explicit separation between technical `shop.id`, provisioning identity `sellerId + shop name`, and public routing identity; `npm run test:catalog` and `npm run lint` both pass after the update.

## [2026-04-20] Frontend debug mode now gates diagnostics and storefront title uses shop name
- Added a build-time `DEBUG` switch for the web container and a shared frontend debug panel so temporary diagnostics, keyboard test input, and shell/runtime hints appear only when debug mode is enabled.
- Shared storefront pages now use the shop name as the page title, hide the catalog browse count label inside storefront mode, and keep temporary Telegram auth diagnostics behind debug mode instead of showing them in normal production UI.

## [2026-04-20] Mounted storefront seller auth now uses runtime Telegram bot token
- Fixed mounted `dev-runtime` Telegram auth wiring so `POST /api/v1/auth/telegram` reads `TELEGRAM_BOT_TOKEN` from runtime environment instead of validating production Mini App `initData` against a hardcoded test token.
- `scripts/dev-api.ts` and `docker-compose.yml` now pass the bot token through to the runtime, unblocking seller session bootstrap for shared storefront owner access on deployed Mini App flows.

## [2026-04-20] Admin provisioning page now reloads provisioned shops from canonical catalog state
- Added a narrow `catalog`-owned admin read path for `/admin/catalog/shops/provision`, so the page now loads persisted provisioned shop summaries from backend runtime state on first render and after successful provisioning instead of relying only on route-local UI memory.
- Kept public/seller semantics unchanged: public browse still exposes only `WORKING`, while the admin-owned provisioning list intentionally includes both `WORKING` and `NOT_WORKING`; focused frontend, catalog integration, mounted runtime, `npm run test:catalog`, and `npm run lint` all pass.

## [2026-04-20] TASK-FT009-09 verify halted on missing Android Telegram closure evidence
- Repo-local hardening changes for the shell-owned bottom-action and degradation-policy subset now pass lint plus focused Jest coverage, but formal `/verify TASK-FT009-09` still fails because fresh real `Android Telegram` notes for keyboard-open CTA reachability and degraded fallback behavior are not yet recorded.
- Opened active bug `BUG-2026-04-20-task-ft009-09-missing-android-keyboard-evidence` and blocked follow-up `TASK-FT009-10` under the earlier policy; the 2026-04-27 evidence policy update reclassified this as advisory pre-release risk.

## [2026-04-20] Catalog Prisma repository split into spec-aligned infrastructure modules
- Refactored `backend/src/slices/catalog/infrastructure/prisma-catalog.repository.ts` into a thin facade over focused Prisma modules for public browse reads, seller reads, seller writes, provisioning, and shared Prisma mapping/event glue.
- Preserved the single `CatalogRepository` boundary and kept provisioning/event semantics inside the owning `catalog` slice, so future catalog work can change one spec-aligned capability module without reopening the whole repository file.

## [2026-04-20] TASK-FT009-09 reconciled degraded Telegram CTA fallback semantics
- Narrowed the shared Telegram bridge capability semantics so degraded Telegram runtime still keeps the shell-owned bottom CTA path on `keyboard-safe` layout while optional shell enhancements remain on the centralized `minimal` policy.
- Re-ran focused `FT-009` frontend gates (`npm run lint` plus targeted Jest coverage for app/shared/checkout shell paths) and synced backlog/feature/testing/bug docs; fresh Android Telegram operator notes still remain the only missing artifact for full closure.

## [2026-04-20] MB sync recorded red-verify concern for TASK-FT009-08
- Synced `FT-009`, backlog, and the root Memory Bank index after `/verify` `PASS` plus post-change `/red-verify` `semantic-concern` for `TASK-FT009-08`: centralized shell capability ownership is correct, but the current reduced-runtime fallback also drops the keyboard-safe bottom-action layout to `inline`.
- Kept the concern attached to the already-planned closure wave `TASK-FT009-09` instead of opening a new bug/task, because the remaining risk is the final reconciliation between repo-local degradation semantics and real Android Telegram evidence.

## [2026-04-20] TASK-FT009-08 centralized minimal shell capability and degradation policy
- Extended the shared Telegram bridge and shell state with one minimal capability snapshot plus one centralized enhanced-vs-minimal shell policy, so optional shell chrome and bottom-action affordances now degrade through one shared path instead of page-level assumptions.
- Added focused app/shared/checkout Jest coverage and re-ran `npm run lint`, while leaving final Android Telegram evidence and full closure of the hardening wave to `TASK-FT009-09`.

## [2026-04-20] MB sync recorded red-verify concern for TASK-FT009-07
- Synced `FT-009` and the root Memory Bank index so they no longer overstate `TASK-FT009-07` as fully risk-closed: the shell-owned bottom action primitive landed, but post-change `red-verify` still flags missing explicit Telegram keyboard-open evidence and the narrow validation scope of the new page-level scroll model.

## [2026-04-20] TASK-FT009-07 added a shell-owned bottom action path for checkout
- Extended `frontend/src/shared/ui/page-shell.tsx` with a shared shell-owned bottom action slot plus keyboard-safe footer styling in `webview-shell.css`, keeping the customer-facing CTA layout path inside the shell boundary instead of page-local placement.
- Moved the checkout primary CTA onto that shell-owned footer primitive and added focused shared/check-out frontend tests proving the CTA now renders through the centralized shell layout path.

## [2026-04-20] FT-011 identical provisioning now keys conflicts only by sellerId plus shop name
- Removed the stale service-level duplicate guard that still reasoned through Telegram bindings instead of the canonical `sellerId + shop name` shop identity, so controlled provisioning conflicts now consistently come from the repository/persistence boundary.
- Added focused unit, integration, and mounted-runtime coverage proving that the same seller cannot be provisioned the same shop name twice even when `telegramId` differs, while multi-shop admin provisioning still works when shop names differ.

## [2026-04-20] TASK-FT011-09 removed mounted single-shop-per-seller drift
- Narrowed the repo-local mounted `catalog` runtime parity fix to `backend/src/dev-runtime/catalog-runtime-prisma.ts`, so `SellerShopBinding` creation no longer rejects a second admin-provisioned shop only because the same seller or Telegram identity already owns another shop.
- Added focused integration and mounted runtime regressions proving one seller identity can own multiple admin-provisioned shops when shop names differ, while identical `sellerId + shop name` provisioning still returns the controlled `SHOP_PROVISIONING_CONFLICT` behavior.

## [2026-04-20] Spec layer clarified multi-shop admin provisioning policy for catalog
- Clarified `REQ-028`, the catalog provisioning contract, `FT-011`, and testing guidance so one seller/Telegram identity may own multiple shops when those shops are created through admin provisioning, while the canonical conflict key remains `sellerId + shop name`.
- Added active backlog card `TASK-FT011-09` to fix the mounted runtime/test drift where the repo-local provisioning path can still behave like single-shop-per-seller despite the spec baseline.

## [2026-04-19] Dev runtime server refactored into focused runtime modules without contract drift
- Split `backend/src/dev-runtime/dev-api-server.ts` into focused `catalog-runtime`, `admin-access-runtime`, `checkout-payment-runtime`, and `http-runtime` modules while keeping `dev-api-server.ts` as the composition root and preserving the existing exported test/runtime helpers.
- Re-ran the mounted `catalog` runtime regression suite and the full `admin-access` suite to confirm the repo-local auth/catalog routes, durable runtime behavior, and helper exports remained behaviorally unchanged.

## [2026-04-19] Container deploy now persists DB-backed catalog runtime across api container recreate
- Updated `docker-compose.yml` so the checked-in `api` container now mounts a named Docker volume and passes explicit `CATALOG_DB_PATH=/var/lib/khujandi/catalog-runtime.sqlite`, preventing admin provisioning and seller catalog writes from living only inside one container filesystem.
- Synced `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` with the same durable catalog runtime requirement plus post-rollout verification commands for the mounted SQLite path/volume.

## [2026-04-19] Admin auth runtime sessions now survive api restart on the same persisted DB path
- Replaced the checked-in `dev-runtime` in-memory `admin-access` state with a persisted SQLite-backed runtime store behind explicit `ADMIN_DB_PATH`, so deploy/restart no longer invalidates otherwise valid admin cookie sessions only because the container forgot its `adminSession` records.
- Updated the container deploy runbook and compose env surface to mount `ADMIN_DB_PATH=/var/lib/khujandi/admin-access-runtime.sqlite`, and added a restart regression for admin login/refresh continuity on the same DB path.

## [2026-04-19] Restored full historical archive sources after compaction mistake
- Added canonical full-archive copies for pre-compaction `tasks/backlog.md` and `changelog.md`, so no historical lines remain stranded only in summary archives.
- Reclassified the feature-group/date-range archive files as summary/navigation layer and updated active routers to point to the new full historical source files.

## [2026-04-19] MB garden maintenance completed
- Ran `/mb-garden` quick check: no TBD/TODO gaps found, no lint script available.
- MB-SYNC: duo docs (architecture ↔ guides) links verified, RTM aligned, backlog status synced.
- Lint passes. No drift or cleanup needed.

## [2026-04-19] MB sync aligned container deploy runbook routing
- Renamed the checked-in container deploy runbook file to `.memory-bank/runbooks/telegram-mini-app-container-deploy.md` so the runbooks router, architecture docs, guides, and root Memory Bank index all resolve to the actual canonical file again.
- Preserved the current runbook content while closing the navigation drift introduced by the temporary `deploy_kzServ_docker.md` filename.

## [2026-04-17] TASK-FT011-06 FT-011 verified with manual restart-durability closure
- Re-ran the final repo-local quality gates with `npm run lint` and `npm run test:catalog`, then captured explicit manual restart-smoke evidence for `admin provisioning -> seller edit -> runtime restart -> public/seller storefront reads` on the same SQLite DB path.
- Promoted `REQ-027` and `REQ-028` from `implemented` to `verified`, marked `TASK-FT011-06` done, and updated the `FT-011` feature/index/testing docs so the DB-backed `catalog` runtime baseline is now the canonical verified closure.

## [2026-04-17] TASK-FT011-05 mounted durability regressions now cover restart-safe conflict behavior
- Added a focused mounted runtime regression proving that repeated identical admin provisioning still returns the controlled `SHOP_PROVISIONING_CONFLICT` contract after runtime restart on the same persisted catalog DB path and leaves exactly one durable starter bundle.
- Added `npm run test:catalog:runtime` as an explicit rerunnable gate for repo-local mounted `catalog` runtime regressions, then re-ran that suite plus the full `npm run test:catalog` command before marking the task done.

## [2026-04-17] TASK-FT011-04 mounted seller/storefront reads now use repository-backed persisted catalog state
- Replaced the remaining direct `catalogState` reads in the mounted catalog runtime shell for seller capability checks and seller storefront payload resolution, so `POST /api/v1/auth/telegram` and `GET /api/v1/seller/shops/:shopId` now go through the same repository-backed `catalog` read path as the owning slice.
- Added repository-backed seller menu-page/product reads plus a mounted runtime restart regression proving provisioned seller storefront data and later seller edits remain available after restarting against the same catalog DB path.
- Re-ran focused ESLint for the touched files and the full `npm run test:catalog` suite before marking the task done.

## [2026-04-13] TASK-FT011-08 seller rename conflict semantics on the durable shop identity key
- Reconciled seller rename writes with the durable `Shop(sellerId, name)` invariant: `CatalogService.updateSellerShop(...)` now maps uniqueness violations to controlled `SHOP_RENAME_CONFLICT` `409` semantics instead of leaking raw persistence failures.
- Aligned the repo-local in-memory/runtime helpers with the same rename-time uniqueness rule and added focused unit/integration/mounted-runtime regressions before re-running `npm run test:catalog` and `npm run lint`.

## [2026-04-13] TASK-FT011-07 red-verify follow-up for seller rename conflict semantics
- `red-verify` for `TASK-FT011-07` confirmed the original provisioning race is closed, but found a semantic concern: the new durable `Shop(sellerId, name)` uniqueness key also governs seller rename writes and is not yet reconciled with a controlled conflict contract on that path.
- Added `TASK-FT011-08` as a ready follow-up to keep the persistence-boundary hardening while aligning seller rename collisions with the project error contract and test surface.

## [2026-04-13] TASK-FT011-07 race-safe provisioning conflicts at the persistence boundary
- Added a canonical durable `sellerId + shop name` uniqueness key for `catalog` provisioning, so identical concurrent admin retries now fail closed at the repository/DB boundary instead of relying only on the application-layer precheck.
- Aligned the in-memory/runtime helper with the same uniqueness rule and added hostile integration/runtime coverage proving repeated or concurrent identical provisioning leaves exactly one starter `shop + binding + menu pages + products` bundle.
- Re-ran focused catalog integration/runtime checks, focused ESLint for the touched files, and the full `npm run test:catalog` suite before marking the task done.

## [2026-04-13] TASK-FT011-03 red-verify follow-up for race-safe duplicate provisioning
- `red-verify` for `TASK-FT011-03` found a semantic concern: the new duplicate guard blocks serialized identical replays, but it still lives above the persistence boundary and is not race-safe under concurrent retries.
- Added `TASK-FT011-07` as a ready follow-up to move duplicate/conflict enforcement onto a canonical repository/DB boundary so `REQ-028` stays fail-closed beyond narrow sequential tests.

## [2026-04-13] TASK-FT011-03 transactional provisioning duplicate guard
- Hardened `CatalogService.provisionSellerShop(...)` so repeated identical `sellerId + telegramId + shop name` requests now fail closed before repository writes instead of relying only on downstream uniqueness errors.
- Added focused unit/integration coverage proving identical repeated provisioning leaves the starter `shop + binding + menu pages + products` bundle unchanged, while the existing rollback regression still protects atomic failure behavior.
- Re-ran `npm run test:catalog` and focused ESLint on the touched catalog files before marking the task done.

## [2026-04-13] TASK-FT011-02 persistent catalog seed baseline replaces hidden demo bootstrap
- Replaced the mounted runtime's hidden `seededShops/seededProducts` bootstrap with the explicit checked-in seed file `backend/prisma/seeds/catalog-runtime-baseline.json`.
- Added a SQLite-backed catalog runtime state store and wired `scripts/dev-api.ts` to a stable repo-local DB path, so repo-local startup/restart now reuses persisted catalog state instead of fabricating storefront availability from process-local demo memory.
- Added a focused restart regression and re-ran the full catalog suite; broader canonical persisted read-path closure still remains with later `FT-011` tasks.

## [2026-04-13] TASK-FT011-01 mounted catalog runtime now uses the Prisma-backed module
- Replaced the default repo-local `dev:api` catalog mount from `InMemoryCatalogRepository` to the checked-in Prisma-backed `catalog` module surface, while keeping the in-memory adapter explicit for isolated tests only.
- Added runtime regression coverage proving the mounted server now boots with `PrismaCatalogRepository`; durable DB-backed seed/bootstrap and restart-safe closure still remain with later `FT-011` tasks.
- Synced `requirements.md` and `tasks/backlog.md` so `REQ-027/028` now reflect `implemented` lifecycle rather than `planned`, while final `verified` closure still remains with later `FT-011` durability work.

## [2026-04-13] FT-011 implementation plan and backlog decomposition
- Added `.protocols/FT-011/{plan,decision-log}.md`, `.memory-bank/tasks/plans/IMPL-FT-011.md`, and a dedicated `FT-011` backlog section with execution-ready task cards for DB-backed runtime switch, transactional provisioning, durability regressions, and final restart-smoke closure.
- Updated `tasks/plans/index.md`, `tasks/backlog.md`, and the root Memory Bank index so `FT-011` is now ready for `/execute` task-by-task delivery.

## [2026-04-13] FT-011 DB-backed catalog runtime re-baseline
- Added `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md` plus `REQ-027/028` to move `catalog` onto a normative DB-backed runtime baseline with durable provisioning, canonical persisted storefront resolution, and restart-safe behavior.
- Updated `EP-001`, `FT-001`, `FT-010`, `requirements`, catalog contracts, architecture, and testing docs so seller contour behavior remains with `FT-010`, while durable runtime closure is now tracked separately by `FT-011`.
