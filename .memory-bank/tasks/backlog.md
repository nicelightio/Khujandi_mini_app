---
description: Backlog и execution plan (waves) для реализации.
status: active
---
# Backlog

> `/prd` rule: этот backlog не должен автоматически порождать TASK-IDs. Декомпозиция делается точечно через `/prd-to-tasks FT-<NNN>`.

## Current state

- Historical task cards вынесены из active backlog в archive layer, чтобы `backlog.md` оставался коротким canonical entrypoint для `/prd-to-tasks`, `/execute`, `/autopilot` и `/mb-sync`.
- Active backlog содержит terminal state для `FT-012`, repo-local closure для `FT-013`/`FT-014`, и advisory pre-release Android smoke path; historical completed cards остаются в archive layer.
- Existing implementation plans остаются в [.memory-bank/tasks/plans/index.md](plans/index.md): роутер по `IMPL-*` планам.

## Recommended feature order

1. `FT-001`, `FT-002`, `FT-003`, `FT-009`, `FT-010` для первой customer-facing и seller storefront волны.
2. `FT-004`, `FT-005`, `FT-006` для delivery operations.
3. `FT-007` для отдельного admin auth/security контура.
4. `FT-008` для post-delivery feedback loop и go-live hardening.

## Archive

- [.memory-bank/tasks/archive/backlog-full-pre-compaction-2026-04-19.md](archive/backlog-full-pre-compaction-2026-04-19.md): Полная historical копия исходного `backlog.md` до compaction; canonical archive source.
- [.memory-bank/tasks/archive/index.md](archive/index.md): Роутер по архивам historical task cards.
- [.memory-bank/tasks/archive/FT-001-to-FT-003.md](archive/FT-001-to-FT-003.md): Summary/navigation archive для `FT-001` ... `FT-003`.
- [.memory-bank/tasks/archive/FT-004-to-FT-006.md](archive/FT-004-to-FT-006.md): Summary/navigation archive для `FT-004` ... `FT-006`.
- [.memory-bank/tasks/archive/FT-007-to-FT-009.md](archive/FT-007-to-FT-009.md): Summary/navigation archive для `FT-007` ... `FT-009`.
- [.memory-bank/tasks/archive/FT-010-to-FT-011.md](archive/FT-010-to-FT-011.md): Summary/navigation archive для `FT-010` ... `FT-011`.

## Active task queue

- `FT-012` is terminal for repo-local scope: `TASK-FT012-06` is `done`, and `REQ-031` remains `verified`.
- `FT-013` repo-local checkout gates passed through `TASK-FT013-07`; Android Telegram checkout evidence was downgraded to advisory pre-release smoke, so `TASK-FT013-08` is replaced by a non-blocking advisory check and `REQ-032` is `verified`.
- `FT-014` frontend status/resume hardening and repo-local mounted events repair passed through `TASK-FT014-07`; `TASK-FT014-06` is closed as a docs/evidence sync without fresh Android evidence, and `REQ-033` is `verified` for repo-local closure.
- `FT-009` Android keyboard/shell notes remain recommended advisory pre-release risk evidence in `TASK-ANDROID-ADVISORY-PRE-RELEASE`, but they no longer block `FT-013` or `FT-014` repo-local closure.
- Current scoped follow-up intentionally excludes the broader `high-churn runtime propagation` refactor; that concern remains in the open bug record but is not part of the execution-ready wave below.

### Maintenance follow-ups from 2026-04-29 refactor review

#### TASK-FT013-09 — Enforce Origin/Referer checks on Mini App protected runtime routes
- TASK-ID: `TASK-FT013-09`
- Status: `ready`
- Wave: `hardening`
- Feature: `FT-013`, `FT-010`
- REQs: `REQ-022`, `REQ-032`, `REQ-025`
- Depends on: current refactor hardening wave
- Touched files: `backend/src/dev-runtime/http-runtime.ts`, `backend/src/dev-runtime/checkout-payment-runtime.ts`, `backend/src/dev-runtime/routes/mini-app.routes.ts`, `backend/src/dev-runtime/routes/catalog.routes.ts`, `tests/slices/catalog/**/*`, `tests/slices/checkout-payment/**/*`
- Tests: mounted runtime coverage proving protected Mini App checkout/language/events and seller routes reject disallowed `Origin` when present, use `Referer` only as fallback, and keep public browse auth-free.
- Verify: cookie-protected Mini App and seller runtime routes enforce the documented `SameSite + Origin/Referer` boundary without changing successful Telegram session behavior.
- Docs: `tasks/backlog.md`, `changelog.md`; update contracts only if the runtime boundary behavior changes beyond the existing `REQ-022` baseline.

#### TASK-FT006-09 — Bind manual refund update CAS to cancelled non-deleted orders
- TASK-ID: `TASK-FT006-09`
- Status: `ready`
- Wave: `hardening`
- Feature: `FT-006`
- REQs: `REQ-012`, `REQ-018`
- Depends on: current order-cancellation atomic cancellation fix
- Touched files: `backend/src/slices/order-cancellation/**/*`, `backend/src/dev-runtime/order-ops-runtime.ts`, `tests/slices/order-cancellation/**/*`
- Tests: stale refund regression where the order changes status or is deleted between precheck and `updateMany`, proving no refund audit/event side effects are written.
- Verify: manual refund progression remains atomic for cancelled paid orders and cannot publish refund side effects from stale order assumptions.
- Docs: `tasks/backlog.md`, `changelog.md` if implementation lands.

#### TASK-MAINT-01 — Refresh refactoring report after hardening wave
- TASK-ID: `TASK-MAINT-01`
- Status: `ready`
- Wave: `maintenance`
- Feature: maintenance
- REQs: none
- Depends on: current refactor hardening wave
- Touched files: `REFACTORING_IDEAS.md` only
- Tests: line-count/top-10 recomputation plus UTF-8/no trailing whitespace/`git diff --check`.
- Verify: report reflects the current worktree after repository splits and hardening fixes, and no production code/tests/Memory Bank files are changed by the report refresh.

### TASK-FT014-01 — Freeze customer status visibility boundary
- TASK-ID: `TASK-FT014-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-014`
- REQs: `REQ-033`, `REQ-008`, `REQ-009`, `REQ-010`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`, `.memory-bank/tasks/plans/IMPL-FT-014.md`, `.memory-bank/tasks/backlog.md`, optional `.memory-bank/testing/index.md`
- Tests: no product code tests; docs consistency check against `FT-014`, `FT-013`, `FT-005`, `EP-001`, `requirements.md`, `api-events-baseline.md`, and `order-lifecycle.md`
- Verify: execution boundary explicitly states customer status visibility is read-only, consumes `FT-005` polling/state semantics, depends on real paid-order identity from `FT-013`, and does not introduce customer mutation commands or a second state machine
- Docs: `tasks/backlog.md`, `tasks/plans/IMPL-FT-014.md`, `features/FT-014`, `testing/index.md` if verification wording needs tightening
- Source Artifacts: `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`, `.memory-bank/contracts/api-events-baseline.md`, `.memory-bank/states/order-lifecycle.md`
- Constraints: docs-first task only; do not implement runtime behavior here

### TASK-FT014-02 — Add customer status entry surface from paid order metadata
- TASK-ID: `TASK-FT014-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-014`
- REQs: `REQ-033`
- Depends on: `TASK-FT014-01`, `TASK-FT013-05`
- Touched files: `frontend/src/slices/order-tracking/**/*` (physical frontend name for the `delivery-tracking` customer read surface), `frontend/src/slices/checkout-payment/**/*` only for consuming existing paid-order output, `frontend/src/tests/slices/order-tracking/**/*`, optional `frontend/src/tests/slices/checkout-payment/**/*`
- Tests: frontend route/page smoke proving successful paid order metadata opens or links to status for the same order identity; missing/lost order identity shows controlled recovery to catalog/orders context instead of fake tracking data
- Verify: status entry is reachable from successful `FT-013` paid order creation, tied to the created order identity, and never displays another user's order or route-local fake status
- Docs: `tasks/backlog.md`, `features/FT-014`, `features/FT-013`, `changelog.md` if implementation lands
- Normative Inputs: `api-events-baseline.md`, `order-lifecycle.md`
- Constraints: no payment/order creation ownership changes; no lifecycle mutation controls in customer UI

### TASK-FT014-03 — Wire opaque-cursor customer polling consumer
- TASK-ID: `TASK-FT014-03`
- Status: `done`
- Wave: `W2`
- Feature: `FT-014`
- REQs: `REQ-033`, `REQ-009`, `REQ-010`
- Depends on: `TASK-FT014-02`
- Touched files: `frontend/src/slices/order-tracking/**/*` (physical frontend name for the `delivery-tracking` customer read surface), `frontend/src/shared/**/*` only for existing polling/shell primitives, `frontend/src/tests/slices/order-tracking/**/*`
- Tests: polling consumer coverage for `GET /events?since=<cursor>` empty windows, ordered events, duplicate events, stable `next_cursor`, and string-only opaque `since`/`revision` handling
- Verify: customer status consumes the existing `FT-005` polling contract, keeps empty windows stable, and does not parse cursors as numbers or create read-side effects
- Docs: `tasks/backlog.md`, `features/FT-014`, `changelog.md` if implementation lands
- Normative Inputs: `api-events-baseline.md`, `FT-005-order-tracking-and-events-polling.md`
- Invariants: `since`, `revision`, and `next_cursor` are opaque strings on the API boundary

### TASK-FT014-04 — Render customer-safe lifecycle and delayed-assignment states
- TASK-ID: `TASK-FT014-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-014`
- REQs: `REQ-033`, `REQ-008`
- Depends on: `TASK-FT014-03`
- Touched files: `frontend/src/slices/order-tracking/**/*` (physical frontend name for the `delivery-tracking` customer read surface), `frontend/src/tests/slices/order-tracking/**/*`, optional `frontend/src/shared/ui/**/*` only for existing primitives
- Tests: UI/component coverage for `CREATED`, waiting for assignment, `ASSIGNED`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED`, and customer-safe `CANCELLED_*` terminal copy; negative assertions that courier/admin mutation controls and audit/refund internals are absent
- Verify: delayed assignment is explicit after paid order creation, courier progress appears only after assignment/progress events, and cancellation display stays customer-safe while commands/refund tracking remain outside the customer contour
- Docs: `tasks/backlog.md`, `features/FT-014`, `states/order-lifecycle.md` if display wording exposes state drift, `changelog.md` if implementation lands
- Normative Inputs: `order-lifecycle.md`
- Constraints: read-only customer visibility; no courier/admin controls
- Verify outcome: customer status renders explicit paid/waiting, assigned, in-progress, delivered, completed and customer-safe cancellation copy from the existing `order-tracking` surface; read-only customer sessions expose no courier buttons, audit details, `refund_status` or manual refund state. Focused order-tracking frontend Jest, `npm run lint`, and `npm run build:frontend` pass.

### TASK-FT014-05 — Harden resume, duplicate and terminal-state behavior
- TASK-ID: `TASK-FT014-05`
- Status: `done`
- Wave: `W3`
- Feature: `FT-014`
- REQs: `REQ-033`, `REQ-009`, `REQ-023`
- Depends on: `TASK-FT014-04`
- Touched files: `frontend/src/slices/order-tracking/**/*` (physical frontend name for the `delivery-tracking` customer read surface), `frontend/src/shared/**/*` only through existing shell lifecycle primitives, `frontend/src/tests/slices/order-tracking/**/*`, optional `.tasks/TASK-FT014-05/**/*`
- Tests: lifecycle/resume coverage proving Telegram `activated/deactivated` or app resume restarts polling duplicate-safely; duplicate/out-of-order events do not double-render status; terminal states stop misleading progress affordances
- Verify: polling resume after Telegram WebView lifecycle changes does not publish or mutate order lifecycle state and remains stable on weak/reduced shell runtime paths
- Docs: `tasks/backlog.md`, `features/FT-014`, `features/FT-009-mini-app-shell-and-webview-ux.md` if shell ownership wording needs tightening, `changelog.md` if implementation lands
- Normative Inputs: `FT-009-mini-app-shell-and-webview-ux.md`, `api-events-baseline.md`
- Constraints: do not add raw Telegram runtime subscriptions inside the feature if shell-owned lifecycle state already exposes a stable primitive
- Verify outcome: customer polling now resumes through existing shell lifecycle state without raw Telegram subscriptions, stale in-flight polling is cleared on deactivation, duplicate/out-of-order events preserve opaque cursor progress without double-rendering regressions, and `COMPLETED`/`CANCELLED_*` terminal states remain closed against stale progress events. Focused order-tracking frontend Jest, `npm run lint`, and `npm run build:frontend` pass; final paid-order-to-status e2e closure remains with `TASK-FT014-06`.

### TASK-FT014-06 — Close FT-014 e2e verification and docs sync
- TASK-ID: `TASK-FT014-06`
- Status: `done`
- Wave: `W3`
- Feature: `FT-014`
- REQs: `REQ-033`, `REQ-008`, `REQ-009`, `REQ-010`
- Depends on: `TASK-FT014-05`, `TASK-FT014-07`
- Touched files: `.tasks/TASK-FT014-06/**/*`, `.memory-bank/requirements.md`, `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`, `.memory-bank/testing/index.md`, `.memory-bank/changelog.md`, `.memory-bank/index.md`, optional `.memory-bank/runbooks/telegram-mini-app-verification.md`
- Tests: final focused gates for paid order success -> status screen, ordered polling through assignment/courier progress, empty-window duplicate safety, customer-safe terminal/cancellation display, and no customer mutation controls
- Verify: `REQ-033` can move to `verified` after repo-local evidence proves customer status visibility consumes the real mounted `FT-005` contract from the paid-order flow, checkout cursor/revision is compatible with polling, customer/order scoping prevents unrelated event visibility, and `FT-005` SLA evidence remains referenced rather than duplicated. Fresh Android Telegram evidence is advisory pre-release risk evidence, not a blocking repo-local gate.
- Docs: `requirements.md`, `features/FT-014`, `testing/index.md`, `tasks/backlog.md`, `changelog.md`, `index.md`
- Verification Targets: paid order success -> customer status screen; customer polling through assignment and courier progress; read-only customer behavior across delayed assignment, duplicate polling and terminal states
- Verify outcome: repo-local closure accepted from `TASK-FT014-02` through `TASK-FT014-07`: paid-order status entry, customer-safe lifecycle UI, duplicate/resume handling, mounted authenticated `/api/v1/events`, customer/order scoping, opaque cursor compatibility, and checkout success cursor handoff all have focused repo-local evidence. Fresh Android Telegram checkout/status notes remain advisory pre-release risk evidence only.

### TASK-FT014-07 — Mount customer events polling runtime and align cursor handoff
- TASK-ID: `TASK-FT014-07`
- Status: `done`
- Wave: `W4`
- Feature: `FT-014`
- REQs: `REQ-033`, `REQ-009`, `REQ-010`, `REQ-018`, `REQ-022`
- Depends on: `TASK-FT014-05`
- Touched files: `backend/src/dev-runtime/**/*`, `backend/src/slices/delivery-tracking/**/*`, `backend/src/slices/checkout-payment/**/*` only for returned cursor/revision metadata if needed, `tests/slices/delivery-tracking/**/*`, `tests/slices/checkout-payment/**/*`, `frontend/src/tests/slices/order-tracking/**/*`, `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`, `.memory-bank/tasks/backlog.md`, `.memory-bank/testing/index.md`, `.memory-bank/bugs/BUG-2026-04-27-ft014-events-runtime-and-cursor-drift.md`
- Tests: mounted/runtime coverage for `GET /api/v1/events?since=<cursor>` from the checked-in Mini App API path; customer/order scoping negative checks proving unrelated order events are not visible; cursor compatibility coverage proving checkout success metadata can seed the first polling request without numeric parsing failure; empty-window and ordered-event regressions remain stable
- Verify: the real repo-local customer status path can observe `FT-005` events through a mounted endpoint, `since`/`revision`/`next_cursor` stay opaque string boundary values, checkout no longer passes an incompatible `order.id` cursor into a `BigInt`-only polling path, and authorization/filtering behavior is explicit before `TASK-FT014-06`
- Docs: `tasks/backlog.md`, `features/FT-014`, `features/FT-013`, `tasks/plans/IMPL-FT-014.md`, `testing/index.md`, `bugs/BUG-2026-04-27-ft014-events-runtime-and-cursor-drift.md`, `changelog.md`, `index.md`
- Source: `.tasks/TASK-MB-REVIEW/*` findings on missing mounted `/api/v1/events`, checkout cursor mismatch, and unverified customer event visibility boundary
- Constraints: repo-local product-code repair task; do not close `REQ-033`; do not collect or substitute external Android Telegram evidence here; do not move delivery state-machine ownership out of `FT-005`
- Verify outcome: checked-in `dev-api-server` now mounts authenticated customer `GET /api/v1/events?since=<cursor>`, filters events to the current Mini App customer's orders, keeps empty windows stable, accepts opaque non-numeric cursor strings without runtime parse failure, and checkout success now returns the current event-stream cursor instead of `order.id`. Focused delivery-tracking runtime/unit/integration, order-tracking frontend, checkout runtime, `npm run lint`, and `npm run build:frontend` pass. This is sufficient for repo-local `REQ-033` closure; Android Telegram smoke remains advisory pre-release risk evidence.

### TASK-FT012-01 — Freeze customer composition execution boundary
- TASK-ID: `TASK-FT012-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-012`
- REQs: `REQ-031`, `REQ-001`, `REQ-027`, `REQ-029`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`, `.memory-bank/contracts/customer-order-composition-contract.md`, `.memory-bank/tasks/plans/IMPL-FT-012.md`, `.memory-bank/tasks/backlog.md`, optional `.memory-bank/testing/index.md`
- Tests: no product code tests; docs consistency check against `FT-012`, `EP-001`, `requirements.md`, `catalog-public-api`, and `customer-order-composition-contract`
- Verify: execution boundary explicitly states `catalog` owns composition producer, `checkout-payment` owns revalidation/payment/order creation, and no new shared cart business module is introduced
- Docs: `tasks/backlog.md`, `tasks/plans/IMPL-FT-012.md`, `features/FT-012`, `contracts/customer-order-composition-contract.md` if field names or storage policy need tightening
- Source Artifacts: `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`, `.memory-bank/contracts/customer-order-composition-contract.md`
- Constraints: keep scope docs-first; do not implement code or change checkout semantics in this task

### TASK-FT012-02 — Add slice-local cart composition state and payload mapper
- TASK-ID: `TASK-FT012-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-012`
- REQs: `REQ-031`, `REQ-029`
- Depends on: `TASK-FT012-01`
- Touched files: `frontend/src/slices/catalog/**/*`, `frontend/src/tests/slices/catalog/**/*`, optional `frontend/src/shared/ui/**/*` only for existing generic primitives
- Tests: focused frontend unit/component coverage for add item, duplicate merge, quantity update, remove item, empty cart state, and payload mapping to the contract shape
- Verify: composition state is local to `catalog`, uses public storefront product data, carries public shop path plus internal product IDs as payload data, and never uses technical `shop.id` as the customer-facing route identity
- Docs: `tasks/backlog.md`, `features/FT-012`, `changelog.md` if implementation lands
- Normative Inputs: `customer-order-composition-contract.md`, `catalog-public-api.md`
- Constraints: no backend order/payment writes; no shared cart domain module

### TASK-FT012-03 — Wire storefront add/update/remove cart UI
- TASK-ID: `TASK-FT012-03`
- Status: `done`
- Wave: `W2`
- Feature: `FT-012`
- REQs: `REQ-031`, `REQ-001`
- Depends on: `TASK-FT012-02`
- Touched files: `frontend/src/slices/catalog/**/*`, `frontend/src/tests/slices/catalog/**/*`, optional `frontend/src/shared/ui/**/*`
- Tests: storefront route/page smoke proving customer can add products, see selected shop/line items/quantities/display snapshots/preview totals, update quantities, remove line items, and see checkout readiness change
- Verify: customer-visible composition state is explicit before checkout and product selection starts only from canonical public storefront data
- Docs: `tasks/backlog.md`, `features/FT-012`, `changelog.md` if implementation lands
- Constraints: preserve existing shared storefront customer/seller structure; do not add seller edit or delete semantics

### TASK-FT012-04 — Enforce single-shop replace-or-clear behavior
- TASK-ID: `TASK-FT012-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-012`
- REQs: `REQ-031`
- Depends on: `TASK-FT012-03`
- Touched files: `frontend/src/slices/catalog/**/*`, `frontend/src/tests/slices/catalog/**/*`
- Tests: integration/frontend coverage proving selecting from another shop requires explicit replace/clear confirmation and never creates a mixed-shop composition payload
- Verify: mixed-shop item sets are impossible in the produced draft, and customer feedback is controlled when replacing an active cart
- Docs: `tasks/backlog.md`, `features/FT-012`, `changelog.md` if implementation lands
- Invariants: MVP cart is single-shop; mixed-shop payloads are invalid

### TASK-FT012-05 — Produce checkout handoff payload without side effects
- TASK-ID: `TASK-FT012-05`
- Status: `done`
- Wave: `W3`
- Feature: `FT-012`
- REQs: `REQ-031`
- Depends on: `TASK-FT012-04`
- Touched files: `frontend/src/slices/catalog/**/*`, `frontend/src/slices/checkout-payment/**/*` only for route-level handoff acceptance if unavoidable, `frontend/src/tests/slices/catalog/**/*`, optional `frontend/src/tests/slices/checkout-payment/**/*`
- Tests: contract/frontend test proving valid checkout CTA passes non-empty composition payload with shop public path, product identities, quantities, snapshots and preview total; negative tests for empty cart and invalid quantity
- Verify: handoff can navigate/start checkout intent only with a valid composition, while no order is created, no payment is started, no stock is reserved, and no lifecycle event is published by `FT-012`
- Docs: `tasks/backlog.md`, `features/FT-012`, `contracts/customer-order-composition-contract.md` if implementation reveals field drift, `changelog.md` if implementation lands
- Verification Targets: composition payload conforms to `customer-order-composition-contract.md`
- Constraints: downstream server-side revalidation and paid order creation remain in `FT-013`/`FT-002`

### TASK-FT012-06 — Close unavailable-state repair and final FT-012 verification
- TASK-ID: `TASK-FT012-06`
- Status: `done`
- Wave: `W3`
- Feature: `FT-012`
- REQs: `REQ-031`, `REQ-001`, `REQ-027`, `REQ-029`
- Depends on: `TASK-FT012-05`
- Touched files: `frontend/src/slices/catalog/**/*`, `frontend/src/tests/slices/catalog/**/*`, `.tasks/TASK-FT012-06/**/*`, `.memory-bank/requirements.md`, `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`, `.memory-bank/testing/index.md`, `.memory-bank/changelog.md`, `.memory-bank/index.md`
- Tests: focused final catalog frontend/e2e coverage for `WORKING` storefront composition, `NOT_WORKING`/hidden/unavailable product repair, single-shop behavior, payload contract and checkout CTA readiness
- Verify: `REQ-031` can move from `planned` to `verified` only after evidence shows composition is customer-visible, single-shop, side-effect free, and checkout-ready without trusting preview totals
- Docs: `requirements.md`, `features/FT-012`, `testing/index.md`, `tasks/backlog.md`, `changelog.md`, `index.md`
- Verification Targets: customer cart/order composition on public storefront; single-shop replace/clear path; checkout CTA availability only when composition is valid

### TASK-FT013-01 — Freeze checkout handoff execution boundary
- TASK-ID: `TASK-FT013-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`, `REQ-022`, `REQ-023`
- Depends on: `none`
- Touched files: `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`, `.memory-bank/contracts/customer-order-composition-contract.md`, `.memory-bank/contracts/payment-confirmation-contract.md`, `.memory-bank/tasks/plans/IMPL-FT-013.md`, `.memory-bank/tasks/backlog.md`, optional `.memory-bank/testing/index.md`
- Tests: no product code tests; docs consistency check against `FT-013`, `FT-002`, `FT-012`, `EP-001`, RTM, composition/payment/auth contracts and order lifecycle state
- Verify: boundary states that `catalog` produces composition, `checkout-payment` consumes/revalidates/pays/creates order, payment trust stays in `FT-002`, and no shared cart/payment business module is introduced
- Docs: `tasks/backlog.md`, `tasks/plans/IMPL-FT-013.md`, `features/FT-013`, contracts if field or boundary wording needs tightening
- Source Artifacts: `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`, `.memory-bank/contracts/customer-order-composition-contract.md`, `.memory-bank/contracts/payment-confirmation-contract.md`
- Constraints: docs-first task only; do not implement runtime behavior here

### TASK-FT013-02 — Require composition-backed checkout route entry
- TASK-ID: `TASK-FT013-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-022`
- Depends on: `TASK-FT013-01`, `TASK-FT012-05`
- Touched files: `frontend/src/slices/checkout-payment/**/*`, `frontend/src/slices/catalog/**/*` only for consuming the existing handoff output if unavoidable, `frontend/src/tests/slices/checkout-payment/**/*`, optional `frontend/src/tests/slices/catalog/**/*`
- Tests: frontend route/page smoke proving valid composition reaches checkout confirmation and direct `/checkout` or empty/missing composition shows controlled recovery to catalog/cart
- Verify: checkout UI no longer fabricates fake order data or starts from isolated route-local line items; selected shop, line items, quantities, snapshots and preview totals are visible for customer confirmation
- Docs: `tasks/backlog.md`, `features/FT-013`, `changelog.md` if implementation lands
- Normative Inputs: `customer-order-composition-contract.md`, `mini-app-runtime-contract.md`
- Constraints: do not start payment or create orders from frontend-only preview data
- Verify outcome: focused checkout route/page/model/API Jest, catalog handoff Jest, `npm run lint`, and `npm run build:frontend` pass; direct `/checkout` without a valid handoff now recovers to catalog/cart and valid handoff renders customer confirmation before payment.

### TASK-FT013-03 — Add server-side composition revalidation before payment
- TASK-ID: `TASK-FT013-03`
- Status: `done`
- Wave: `W2`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-005`, `REQ-006`
- Depends on: `TASK-FT013-02`
- Touched files: `backend/src/slices/checkout-payment/**/*`, `backend/src/slices/catalog/**/*` only through explicit read/revalidation boundary if needed, `tests/slices/checkout-payment/**/*`, optional `tests/slices/catalog/**/*`
- Tests: backend integration coverage for valid composition, hidden/`NOT_WORKING` shop, missing product, unavailable product, invalid quantity, price drift and currency drift
- Verify: checkout-payment revalidates current catalog state before payment/order creation and returns controlled repair/reconfirmation responses when customer-visible payment facts changed
- Docs: `tasks/backlog.md`, `features/FT-013`, `contracts/customer-order-composition-contract.md` if revalidation fields need clarification, `changelog.md` if implementation lands
- Invariants: preview totals and display snapshots are not trusted payment/order facts
- Verify outcome: `checkout-payment` now supports an explicit catalog composition reader boundary, validates current shop/product/quantity/price/currency facts before order persistence, returns controlled `COMPOSITION_REPAIR_REQUIRED` repair responses for stale drafts, and focused checkout-payment Jest plus `npm run lint` pass.

### TASK-FT013-04 — Mount real Mini App auth/payment checkout runtime
- TASK-ID: `TASK-FT013-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-004`, `REQ-021`, `REQ-022`
- Depends on: `TASK-FT013-03`
- Touched files: `backend/src/slices/checkout-payment/**/*`, `backend/src/dev-runtime/**/*`, `frontend/src/slices/checkout-payment/**/*`, `tests/slices/checkout-payment/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`
- Tests: integration/runtime coverage proving `POST /auth/telegram` session transport and checkout/payment endpoints are mounted on the customer-facing runtime; auth failure/missing `initData` uses controlled recovery and never creates anonymous orders
- Verify: real Mini App checkout path uses `FT-002` auth/session/payment boundary instead of stub API, route-local session side channels or `initDataUnsafe`
- Docs: `tasks/backlog.md`, `features/FT-013`, `features/FT-002-checkout-payment-and-order-creation.md` if mounted-runtime status changes, `changelog.md` if implementation lands
- Normative Inputs: `telegram-mini-app-auth-contract.md`, `payment-confirmation-contract.md`
- Constraints: payment provider trust and replay rules stay in `checkout-payment`; shell/runtime does not make trusted auth decisions
- Verify outcome: checked-in frontend checkout API now calls mounted `/api/v1/auth/telegram`, `/api/v1/auth/telegram/language` and `/api/v1/orders/checkout` routes with cookie credentials; dev-runtime requires the real Mini App session for checkout submit and returns controlled no-order payment-confirmation-required semantics until `TASK-FT013-05` owns paid `CREATED` persistence. Focused checkout-payment Jest, `npm run lint`, and `npm run build:frontend` pass.

### TASK-FT013-05 — Persist paid CREATED order from revalidated composition
- TASK-ID: `TASK-FT013-05`
- Status: `done`
- Wave: `W2`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-005`, `REQ-021`
- Depends on: `TASK-FT013-04`
- Touched files: `backend/src/slices/checkout-payment/**/*`, `tests/slices/checkout-payment/**/*`, optional `backend/prisma/**/*` only if existing order snapshot fields are insufficient
- Tests: backend integration proving trusted payment success creates exactly one order in `CREATED` with shop/item/customer snapshots derived from the revalidated composition and `payment_status = PAID`
- Verify: order creation happens only after provider-trusted success and returns order identity plus `updated_at`/string `revision` or equivalent metadata needed by downstream polling
- Docs: `tasks/backlog.md`, `features/FT-013`, `states/order-lifecycle.md` if creation metadata wording needs tightening, `changelog.md` if implementation lands
- Verification Targets: paid-only order creation; downstream `FT-014` readiness
- Constraints: do not own delivery assignment/tracking transitions beyond initial `CREATED` state
- Verify outcome: mounted `/api/v1/orders/checkout` now resolves the real Mini App HttpOnly session, consumes a contract-shaped composition, revalidates against current catalog state through the `checkout-payment` composition reader, performs local provider-trusted `PAID` status confirmation server-side, persists exactly one `CREATED` order with `paymentStatus = PAID`, and returns `orderId`, `updated_at` and string `revision` metadata for `FT-014`. Focused runtime test, full checkout-payment Jest suite, and `npm run lint` pass.

### TASK-FT013-06 — Harden retry, stale composition and idempotency paths
- TASK-ID: `TASK-FT013-06`
- Status: `done`
- Wave: `W3`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-006`, `REQ-021`, `REQ-018`
- Depends on: `TASK-FT013-05`
- Touched files: `backend/src/slices/checkout-payment/**/*`, `frontend/src/slices/checkout-payment/**/*`, `tests/slices/checkout-payment/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`
- Tests: integration/frontend coverage for failed, canceled, timeout and ambiguous payment outcomes; duplicate submit and duplicate provider callback create at most one order; stale composition repair remains explicit
- Verify: invalid composition/payment failure paths create no order, publish no lifecycle side effects, and return the canonical error shape with retry/repair UX
- Docs: `tasks/backlog.md`, `features/FT-013`, `contracts/payment-confirmation-contract.md` if idempotency wording changes, `changelog.md` if implementation lands
- Invariants: client-only payment UX events are never trusted order creation signals
- Verify outcome: mounted `/api/v1/orders/checkout` now keeps failed/canceled/timeout/ambiguous provider outcomes retry-safe with no order creation, returns controlled composition repair metadata for malformed/stale drafts, and reuses an existing paid order for duplicate trusted payment confirmation before stale revalidation. Focused backend/runtime checkout tests, frontend checkout tests, and `npm run lint` pass.

### TASK-FT013-07 — Close FT-013 e2e verification and docs sync
- TASK-ID: `TASK-FT013-07`
- Status: `done`
- Wave: `W3`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT013-06`
- Touched files: `.tasks/TASK-FT013-07/**/*`, `.memory-bank/requirements.md`, `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`, `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`, `.memory-bank/testing/index.md`, `.memory-bank/changelog.md`, `.memory-bank/index.md`, optional `.memory-bank/runbooks/telegram-mini-app-verification.md`
- Tests: final focused gates for catalog/cart -> checkout -> successful payment -> order `CREATED`; direct checkout recovery; stale composition block; payment failure no-order; duplicate callback idempotency
- Verify: `REQ-032` can move to `verified` after repo-local evidence proves mounted customer checkout uses real auth/payment/order creation and Telegram-sensitive runtime evidence follows `REQ-023`; fresh Android Telegram smoke is advisory pre-release risk evidence, not a blocking repo-local gate
- Docs: `requirements.md`, `features/FT-013`, `features/FT-002`, `testing/index.md`, `tasks/backlog.md`, `changelog.md`, `index.md`
- Verification Targets: catalog/cart handoff; mounted Mini App auth/payment runtime; paid-only order creation; retry-safe failure path; status-entry metadata for `FT-014`
- Verify outcome: repo-local checkout-payment final gates passed (`8` suites / `73` tests) and `npm run lint` passed; after the confirmed policy decision to downgrade fresh real `Android Telegram` evidence to advisory, this closes repo-local `REQ-032` as `verified`. Residual Android checkout smoke risk is tracked as advisory pre-release evidence.
- Source: `BUG-2026-04-26-task-ft013-07-missing-android-checkout-evidence.md` now reclassified as advisory pre-release risk

### TASK-FT013-08 — Advisory Android Telegram checkout pre-release smoke
- TASK-ID: `TASK-FT013-08`
- Status: `planned`
- Wave: `W4`
- Feature: `FT-013`
- REQs: `REQ-032`, `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`, `REQ-022`, `REQ-023`
- Depends on: `none`
- Touched files: `.tasks/TASK-FT013-08/**/*`, optional `.tasks/TASK-FT013-07/android-notes.md`, `.memory-bank/requirements.md`, `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`, `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`, `.memory-bank/testing/index.md`, `.memory-bank/tasks/backlog.md`, `.memory-bank/changelog.md`, `.memory-bank/index.md`
- Tests: no repo-local gates required unless product code changes; focus is advisory operator-confirmed Android Telegram smoke.
- Verify: collect real `Android Telegram` notes for public storefront -> composition-backed checkout, successful paid order creation metadata, failed/canceled no-order retry and direct/stale checkout recovery. Missing formal notes must be documented as release risk, but must not block repo-local `REQ-032` closure.
- Docs: `requirements.md`, `features/FT-013`, `features/FT-002`, `testing/index.md`, `tasks/backlog.md`, `changelog.md`, `index.md`
- Source: `BUG-2026-04-26-task-ft013-07-missing-android-checkout-evidence.md` reclassified from blocker to advisory pre-release risk

### TASK-FT011-09 — Allow multiple admin-provisioned shops per seller identity
- TASK-ID: `TASK-FT011-09`
- Status: `done`
- Wave: `W1`
- Feature: `FT-011`
- REQs: `REQ-028`
- Depends on: `none`
- Touched files: `backend/src/dev-runtime/catalog-runtime-prisma.ts`, optional `backend/src/dev-runtime/catalog-runtime-repository.ts`, `tests/slices/catalog/**/*`, and relevant `.memory-bank/*` docs
- Tests: mounted/runtime and integration coverage proving admin can provision multiple shops for one seller/Telegram identity when canonical shop names differ, while identical provisioning for the same `sellerId + shop name` still fails closed
- Verify: repo-local mounted runtime accepts `shop A` and `shop B` for the same seller via admin provisioning, seller still has no self-create shop surface, and repeated/conflicting provisioning remains controlled and atomic
- Docs: `tasks/backlog.md`, `contracts/catalog-seller-provisioning-and-visibility.md`, `features/FT-011-db-backed-catalog-runtime-baseline.md`, `requirements.md`, `testing/index.md`, `changelog.md` if implementation lands
- Source: post-change review finding on mounted `sellerShopBinding` uniqueness drift after `catalog-runtime` split
- Constraints: preserve canonical conflict key `sellerId + shop name`; do not widen scope into seller self-provisioning or broader catalog redesign

### TASK-FT009-07 — Add shell-owned keyboard-safe bottom action primitive
- TASK-ID: `TASK-FT009-07`
- Status: `done`
- Wave: `W1`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`
- Depends on: `none`
- Touched files: `frontend/src/shared/ui/page-shell.tsx`, `frontend/src/shared/styles/webview-shell.css`, `frontend/src/slices/checkout-payment/components/**/*`, optional `frontend/src/slices/catalog/components/**/*`, `frontend/src/tests/shared/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, and relevant `.memory-bank/*` docs
- Tests: shell/component coverage for the new `bottomAction` primitive plus checkout route/page smoke proving customer-facing CTA rendering stays inside the shell-owned layout path
- Verify: keyboard-safe bottom CTA remains reachable through shell-owned safe-area-aware layout, and checkout no longer depends on page-local CTA placement for the critical action path
- Docs: `tasks/backlog.md`, `features/FT-009`, `testing/index.md`, `changelog.md` if implementation lands
- Source: `BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Constraints: keep scope on customer-facing Mini App surfaces; do not widen the task into a general contour-wide layout rewrite

### TASK-FT009-08 — Add minimal shell capability and degradation policy
- TASK-ID: `TASK-FT009-08`
- Status: `done`
- Wave: `W2`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT009-07`
- Touched files: `frontend/src/app/app-shell.tsx`, `frontend/src/shared/telegram/webapp.ts`, `frontend/src/shared/state/**/*`, optional `frontend/src/shared/ui/**/*`, `frontend/src/tests/app/**/*`, `frontend/src/tests/shared/**/*`, and relevant `.memory-bank/*` docs
- Tests: unit/contract coverage for capability derivation and shell fallback flags, plus smoke coverage proving the base customer-facing UI remains usable when optional enhancements are reduced or disabled
- Verify: shell owns one minimal degradation policy for weak-device/old-client runtime paths, and optional visual enhancements no longer rely on ad hoc feature-level decisions
- Verify outcome: `/verify` = `PASS`; post-change `/red-verify` = `semantic-concern` because the current reduced-runtime fallback also drops the keyboard-safe bottom-action layout to `inline`, so final semantic closure remains with `TASK-FT009-09`
- Docs: `tasks/backlog.md`, `features/FT-009`, `contracts/mini-app-runtime-contract.md`, `testing/index.md`, `changelog.md` if implementation lands
- Source: `BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Constraints: do not build a broad device-profiler subsystem; policy must stay minimal, shell-owned, and strictly outside domain logic

### TASK-FT009-09 — Verify shell bottom-action and degradation-policy closure
- TASK-ID: `TASK-FT009-09`
- Status: `done`
- Wave: `W3`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT009-08`
- Touched files: `frontend/src/tests/app/**/*`, `frontend/src/tests/shared/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, optional `.tasks/TASK-FT009-09/**/*`, `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`, `.memory-bank/testing/index.md`, `.memory-bank/changelog.md`, `.memory-bank/bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Tests: rerun focused shell, shared-runtime, and checkout/customer-facing smoke suites plus any new contract tests introduced by `TASK-FT009-07` and `TASK-FT009-08`
- Verify: repo-local tests explicitly confirm the corrected shell-owned bottom CTA fallback semantics; Android Telegram notes for keyboard-open reachability, predictable fallback/degradation behavior, and no obvious shell regression are advisory pre-release evidence
- Verify focus: explicitly reconcile whether degraded clients keep a conservative shell-owned bottom-action primitive or intentionally fall back to `inline`; real Android Telegram validation is recommended before release but not blocking for repo-local closure
- Execution note: repo-local policy/test closure now keeps degraded Telegram runtime on the conservative shell-owned `keyboard-safe` CTA path; fresh Android Telegram operator notes remain advisory pre-release risk evidence
- Verify outcome: repo-local closure passed; after the evidence policy decision, missing fresh real `Android Telegram` operator-confirmed notes are advisory pre-release risk evidence rather than a blocking task failure
- Docs: `tasks/backlog.md`, `features/FT-009`, `testing/index.md`, `changelog.md`, `bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Source: `BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- Scope note: this closure wave only covers the bottom-action and degradation-policy subset; the broader runtime-propagation refactor remains a separate follow-up concern until explicitly decomposed

### TASK-FT009-10 — Advisory Android Telegram shell CTA pre-release smoke
- TASK-ID: `TASK-FT009-10`
- Status: `planned`
- Wave: `W4`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`
- Depends on: `TASK-FT009-09`
- Touched files: `.tasks/TASK-FT009-10/**/*`, optional `.tasks/TASK-FT009-09/android-notes.md`, `.memory-bank/testing/index.md`, `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`, `.memory-bank/bugs/BUG-2026-04-20-task-ft009-09-missing-android-keyboard-evidence.md`, `.memory-bank/changelog.md`
- Tests: no new repo-local gates required beyond reusing the passing `TASK-FT009-09` shell/customer-facing suite; focus is advisory operator-confirmed Android Telegram smoke
- Verify: collect real `Android Telegram` notes confirming keyboard-open CTA reachability, conservative degraded fallback behavior, and no shell regression for the hardened checkout path. Missing formal notes must be documented as release risk, but must not block repo-local closure.
- Docs: `tasks/backlog.md`, `testing/index.md`, `features/FT-009`, `bugs/BUG-2026-04-20-task-ft009-09-missing-android-keyboard-evidence.md`, `changelog.md`
- Source: `BUG-2026-04-20-task-ft009-09-missing-android-keyboard-evidence.md`
- Advisory risk: requires real `Android Telegram` operator run outside the current repo-local environment before release confidence is high

## Conventions
Each task should include:
- goal
- expected touched files
- tests
- verification steps
- docs-first update

## Task state model
- `Status: planned|ready|in_progress|blocked|done|failed`
- `Wave: W1|W2|W3|...`
- `Depends on: TASK-... | none`

## Task card template
### TASK-001 — short title
- TASK-ID: TASK-001
- Status: ready
- Wave: W1
- Feature: FT-001
- REQs: REQ-001, REQ-002
- Depends on: none
- Touched files: `src/...`, `tests/...`
- Tests: `npm test -- foo`
- Verify: API/manual/UAT steps
- Docs: product/requirements/feature/changelog/index
