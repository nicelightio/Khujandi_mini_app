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
- `FT-016` migration is complete for repo-local scope through `TASK-FT016-19`: documentation and Memory Bank sync verified `PASS` after `TASK-FT016-18` strict verification/docs-only end-to-end operator delivery flow verification passed.
- `FT-017` guarded e2e mock payment mode is terminal for scoped repo-local success baseline through `TASK-FT017-04`; mock failed/timeout/pending and real production provider design remain out of scope.

### FT-017 guarded e2e mock payment mode

#### TASK-FT017-01 - Guarded mock provider config/boundary
- TASK-ID: `TASK-FT017-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-017`
- REQs: `REQ-021`, `REQ-023`
- Depends on: `none`
- Touched files: `backend/src/slices/checkout-payment/**/*`, `backend/src/dev-runtime/**/*`, `tests/slices/checkout-payment/**/*`, `.memory-bank/runbooks/e2e-mock-payment.md`, `.memory-bank/testing/index.md`
- Tests: focused backend/config coverage proving `PAYMENT_PROVIDER=mock` is accepted only when `NODE_ENV !== "production"` and production-like runtime rejects/refuses mock usage.
- Verify: old implicit local mock behavior is replaced or gated by explicit server-side provider selection; `DEBUG=true` alone is not trusted; no frontend affordance or order creation change is added in this task.
- Docs: `.memory-bank/tasks/backlog.md`, `.memory-bank/tasks/plans/IMPL-FT-017.md`, `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`, `.memory-bank/runbooks/e2e-mock-payment.md`
- Source Artifacts: `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`, `.memory-bank/contracts/payment-confirmation-contract.md`, `.memory-bank/runbooks/e2e-mock-payment.md`
- Constraints: backend runtime/config and payment provider boundary only; no failed/timeout/pending mock outcomes, no checkout UI affordance, no catalog/cart changes, no shared abstraction.

#### TASK-FT017-02 - Mounted checkout mock success integration
- TASK-ID: `TASK-FT017-02`
- Status: `done`
- Wave: `W2`
- Feature: `FT-017`
- REQs: `REQ-005`, `REQ-021`, `REQ-032`
- Depends on: `TASK-FT017-01`
- Touched files: `backend/src/slices/checkout-payment/**/*`, `backend/src/dev-runtime/**/*`, `tests/slices/checkout-payment/**/*`
- Tests: mounted runtime/e2e coverage for valid composition + Mini App session + mock `success/paid` creating exactly one paid `CREATED` order with customer-safe cursor/revision; idempotency coverage for duplicate submit/confirmation.
- Verify: mock success passes through existing composition revalidation and payment finalization seam; direct checkout, stale composition and missing auth/session remain no-order; production mock remains refused.
- Docs: `.memory-bank/tasks/backlog.md`, `.memory-bank/tasks/plans/IMPL-FT-017.md`, `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`, `.memory-bank/testing/index.md`
- Source Artifacts: `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`, `.memory-bank/contracts/payment-confirmation-contract.md`
- Constraints: success/paid only; no failed/timeout/pending mock outcomes, no frontend UI affordance, no delivery lifecycle changes, no shared payment abstraction.

#### TASK-FT017-03 - Checkout-only debug/e2e affordance
- TASK-ID: `TASK-FT017-03`
- Status: `done`
- Wave: `W3`
- Feature: `FT-017`
- REQs: `REQ-023`, `REQ-032`
- Depends on: `TASK-FT017-02`
- Touched files: `frontend/src/slices/checkout-payment/**/*`, `frontend/src/tests/slices/checkout-payment/**/*`, optional `backend/src/dev-runtime/**/*` only for exposing non-sensitive mock-availability metadata if needed.
- Tests: focused checkout frontend tests proving the affordance appears only in checkout context when backend mock mode is available and cannot create trusted payment from frontend-only `DEBUG=true`.
- Verify: affordance is visible only after valid checkout handoff context; catalog/cart surfaces do not expose payment controls; backend remains the only trust source.
- Docs: `.memory-bank/tasks/backlog.md`, `.memory-bank/tasks/plans/IMPL-FT-017.md`, `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- Source Artifacts: `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`, `.memory-bank/runbooks/e2e-mock-payment.md`
- Constraints: frontend checkout presentation only; no backend trust change beyond consuming existing availability metadata, no catalog/cart UI, no shared UI abstraction.

#### TASK-FT017-04 - E2E verification and docs sync
- TASK-ID: `TASK-FT017-04`
- Status: `done`
- Wave: `W4`
- Feature: `FT-017`
- REQs: `REQ-005`, `REQ-021`, `REQ-023`, `REQ-032`
- Depends on: `TASK-FT017-02`, `TASK-FT017-03`
- Touched files: `.tasks/TASK-FT017-04/**/*`, `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`, `.memory-bank/runbooks/e2e-mock-payment.md`, `.memory-bank/testing/index.md`, `.memory-bank/tasks/backlog.md`, `.memory-bank/index.md`
- Tests: final repo-local e2e/mock runtime gates for happy path, production refusal, `DEBUG=true` negative, direct/stale/no-auth no-order cases and idempotency.
- Verify: `PASS`; final repo-local gates prove guarded mock `success/paid`, production refusal, `DEBUG=true` negative, direct/stale/no-auth no-order cases, idempotency, checkout-only affordance and docs sync without weakening payment trust. Failed/timeout/pending remain documented follow-up.
- Docs: `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`, `.memory-bank/runbooks/e2e-mock-payment.md`, `.memory-bank/testing/index.md`, `.memory-bank/tasks/backlog.md`, `.memory-bank/index.md`
- Source Artifacts: `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`, `.memory-bank/tasks/plans/IMPL-FT-017.md`, `.memory-bank/runbooks/e2e-mock-payment.md`
- Constraints: verification/docs sync only after implementation tasks; do not broaden into real provider integration or mock failure/timeout/pending behavior.

### FT-016 operator delivery migration preflight

#### TASK-FT016-00 - Baseline drift report and execution handoff
- TASK-ID: `TASK-FT016-00`
- Status: `done`
- Wave: `W0`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-007`, `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `none`
- Touched files: `.protocols/TASK-FT016-00/**/*`, `.tasks/TASK-FT016-00/**/*`
- Tests: no runtime tests required; docs-only baseline inspection and task report.
- Verify: report names current v1 direct assignment and old tracking chain as baseline drift, confirms admin panel repair-first strategy, and records owning slices, contours, touched layers and shared justification before implementation tasks are synced.
- Docs: `.protocols/TASK-FT016-00/context.md`, `.tasks/TASK-FT016-00/TASK-FT016-00-S-00-final-report-docs-01.md`, `tasks/backlog.md`, `changelog.md`

#### TASK-FT016-01 - Add lifecycle and role compatibility to Prisma/domain types
- TASK-ID: `TASK-FT016-01`
- Status: `done`
- Wave: `W1`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-007`, `REQ-008`
- Depends on: `TASK-FT016-00`
- Touched files: `backend/prisma/schema.prisma`, `backend/prisma/migrations/**/*`, `backend/src/slices/*/domain/*.types.ts`, `frontend/src/slices/order-tracking/api/order-tracking-api.ts`, focused status parser tests
- Tests: `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`; focused backend type/test suite for affected slices; `npm run test:order-tracking:frontend`.
- Verify: old statuses still parse; new `DELAYED` and `PICKED_UP` statuses parse; `OPERATOR` is representable while existing `ADMIN` behavior remains operator-capable; existing orders are not rewritten and no new runtime transitions/offers/UI behavior are enabled.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: compatibility-only schema/domain task; no offers, claims, bot menu, auto-offer, operator panel behavior, or status transition changes.

#### TASK-FT016-02 - Add courier availability and assignment offer persistence compatibility
- TASK-ID: `TASK-FT016-02`
- Status: `done`
- Wave: `W1`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-01`
- Touched files: `backend/prisma/schema.prisma`, `backend/prisma/migrations/**/*`, `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`, `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`, focused delivery-assignment tests
- Tests: `DATABASE_URL=postgresql://user:pass@localhost:5432/khujandi npx prisma validate`; `npm run test:delivery-assignment`; migration dry-run against empty DB if available.
- Verify: courier availability fields and `AssignmentOffer` persistence are representable with indexes for active pending offers and order lookup; existing direct assignment remains readable; no code path requires offers yet.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: persistence/domain compatibility only; no bot menu, offer creation behavior, claim behavior, timeout behavior, auto-offer broadcast, or operator panel behavior.

#### TASK-FT016-03 - Add backend operator delivery read contract endpoint
- TASK-ID: `TASK-FT016-03`
- Status: `done`
- Wave: `W2`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-007`, `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT016-01`, `TASK-FT016-02`
- Touched files: `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`, `backend/src/dev-runtime/order-ops-runtime.ts`, optional `backend/src/slices/delivery-tracking/**/*`, focused delivery-tracking runtime tests
- Tests: new runtime tests in `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts` or a new FT-016 runtime spec; `git diff --check`.
- Verify: admin-protected read endpoint returns today + previous 3 days operator order summaries with status, courier marker, claimed/assigned time, computed severity, history rows, and controlled null/empty latest-message placeholders; existing assignment/cancellation routes still work; old v1 orders and new enum statuses are included without enabling offers, claims, status mutations, or UI changes.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: read-only backend/admin contract task; no new UI, offer creation, courier claim, timeout evaluator, auto-offer broadcast, bot menu, or lifecycle mutation behavior.

#### TASK-FT016-04 - Convert admin assignment route into operator orders read surface
- TASK-ID: `TASK-FT016-04`
- Status: `done`
- Wave: `W2`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-007`, `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT016-03`
- Touched files: `frontend/src/admin/components/admin-assignment-page.tsx`, `frontend/src/admin/routes/admin-assignment-route.tsx`, `frontend/src/admin/model/admin-assignment-view-model.ts`, `frontend/src/admin/api/admin-assignment-api.ts`, `frontend/src/tests/admin/admin-assignment-*`
- Tests: focused `frontend/src/tests/admin/admin-assignment-route.spec.tsx`, `frontend/src/tests/admin/admin-assignment-api.spec.ts`, `npm run build:frontend`.
- Verify: page renders the backend operator delivery read model; default list window is today plus previous 3 days; rows expose severity, courier absent/current marker and expandable history; old direct assignment CTA is not the primary/default action.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: admin-web read-surface task only; no manual offer submit, auto-offer toggle, chat redirect, cancellation UI changes, backend mutations, bot menu, timeout evaluator, courier claim, or lifecycle mutation behavior.

#### TASK-FT016-05 - Add top unassigned/DELAYED alert and severity sorting
- TASK-ID: `TASK-FT016-05`
- Status: `done`
- Wave: `W2`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-007`, `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT016-04`
- Touched files: `frontend/src/admin/components/admin-assignment-page.tsx`, `frontend/src/admin/routes/admin-assignment-route.tsx`, `frontend/src/admin/model/admin-assignment-view-model.ts`, `frontend/src/admin/api/admin-assignment-api.ts`, `frontend/src/admin/styles/admin-theme.css`, `frontend/src/tests/admin/admin-assignment-*`
- Tests: frontend route/model tests for severity and sorting; visual smoke through existing admin route test; `git diff --check`.
- Verify: top alert surfaces no accepted courier and `DELAYED` orders; `DELAYED` rows are blinking red; sort controls cover urgency, created time, status, courier absent/name, assigned time and last message time; severity color mapping is deterministic; `COMPLETED` is neutral and cancelled rows are purple.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: admin-web read-side presentation only; no delayed-state creation, timeout timers, bot notifications, manual offer submit, backend mutations, courier claim, auto-offer toggle, chat redirect, cancellation UI changes, or lifecycle mutation behavior.

#### TASK-FT016-06 - Add operator action placeholders for offer, status control and bot chat redirect
- TASK-ID: `TASK-FT016-06`
- Status: `done`
- Wave: `W2`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-007`, `REQ-008`, `REQ-018`
- Depends on: `TASK-FT016-05`
- Touched files: `frontend/src/admin/components/admin-assignment-page.tsx`, `frontend/src/admin/routes/admin-assignment-route.tsx`, `frontend/src/admin/model/admin-assignment-view-model.ts`, `frontend/src/admin/api/admin-assignment-api.ts`, `frontend/src/tests/admin/admin-assignment-*`
- Tests: admin router/route tests proving placeholder action states and no broken protected shell; `git diff --check`.
- Verify: UI no longer presents direct assignment as normal flow; targeted offer, status control confirmation and bot chat redirect actions are visibly unavailable or guarded until backend phases land; unrelated cancellation, provisioning and admin routes remain unchanged.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: admin-web placeholder task only; no backend mutations, actual bot deep-link execution, message persistence, timeout evaluator, courier claim, auto-offer toggle, cancellation UI changes, or lifecycle mutation behavior.

#### TASK-FT016-07 - Implement courier availability application boundary
- TASK-ID: `TASK-FT016-07`
- Status: `failed`
- Wave: `W3`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-02`, `TASK-FT016-06`
- Touched files: `backend/src/slices/delivery-assignment/**/*`, `tests/slices/delivery-assignment/**/*`
- Tests: unit tests for availability transitions and free/busy calculation; `git diff --check`.
- Verify: courier active/free/auto-offer participation state is server-owned; active/free calculation treats `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, and `DELIVERED` as busy; stop-after cutoff is time-testable; rating score is preserved.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: delivery-assignment application boundary only; no offer creation, courier claim, admin UI toggle, timeout evaluator, auto-offer broadcast, status progression changes, or direct bot menu wiring.

#### TASK-FT016-07-FIX - Remove presentation exposure from courier availability boundary
- TASK-ID: `TASK-FT016-07-FIX`
- Status: `done`
- Wave: `W3-repair`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-02`, `TASK-FT016-06`
- Touched files: `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`, optional `tests/slices/delivery-assignment/**/*`, `.protocols/TASK-FT016-07/verification.md`
- Tests: `npm run test:delivery-assignment`; `git diff --check`; changed markdown local link validation.
- Verify: `TASK-FT016-07` availability behavior remains implemented in `application/domain/infra/tests`, while no presentation/controller transport exposure is included in this task scope.
- Docs: `tasks/backlog.md`, `changelog.md`, bug record closure if repair passes.
- Source: `.protocols/TASK-FT016-07/verification.md`
- Constraints: repair only the layer-boundary scope leak; no offer creation, courier claim, bot menu UI/harness, admin UI toggle, auto-offer fan-out, timeout evaluator or order status/history/audit/event side effects.

#### TASK-FT016-08 - Add Telegram courier menu harness and callback parsing
- TASK-ID: `TASK-FT016-08`
- Status: `done`
- Wave: `W3`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-07-FIX` (repairs failed `TASK-FT016-07`; `TASK-FT016-07` availability behavior is the repaired prerequisite)
- Touched files: `backend/src/integrations/telegram-bot/**/*`, `tests/slices/delivery-assignment/**/*`
- Tests: bot harness unit tests and service tests; `git diff --check`; changed markdown local link validation.
- Verify: Telegram courier menu harness emits the `Курьер` menu buttons for starting work, stopping order intake after 5 minutes, and toggling automatic order acceptance; callbacks are parsed into service intents only; duplicate callbacks remain side-effect safe through service idempotency; bot code never writes directly to Prisma.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: transport/harness and callback parsing only; no full Telegram webhook server, offer creation, courier claim, status progression, admin UI toggle, auto-offer fan-out, timeout evaluator, or direct Prisma writes from bot code.
- Verify outcome: Telegram courier menu harness emits the `Курьер` menu/actions, callback parsing yields service intents only, bot harness has no direct Prisma imports/writes, and no webhook runtime, admin UI, offer creation, claim, status progression, timeout, history/audit/event or order side effects were added. `npm run test:delivery-assignment`, `git diff --check`, and changed markdown local link validation pass.

#### TASK-FT016-09 - Implement manual targeted offer creation
- TASK-ID: `TASK-FT016-09`
- Status: `done`
- Wave: `W4`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-07-FIX`, `TASK-FT016-08`
- Touched files: `backend/src/slices/delivery-assignment/**/*`, `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`, `frontend/src/admin/**/*`, `backend/src/integrations/telegram-bot/**/*`, `tests/slices/delivery-assignment/**/*`, focused admin tests
- Tests: backend unit/integration/runtime tests for manual offer creation; admin frontend submit test updated from direct assignment to offer-created result; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: operator/admin manual targeted offer validates order `CREATED|DELAYED`, target courier active/free, and creates only a pending targeted offer plus `order.offer_created` event/notification; order status remains unchanged; no `order.assigned` event is published; invalid courier/order returns a controlled error.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: pending targeted offer only; no courier claim, timeout, auto-offer broadcast, cleanup of legacy direct assignment, status progression, order assignment, or order status/history side effects beyond offer-created artifacts. Legacy direct assignment may remain only as hidden/explicit override if needed, not as the normal operator flow.
- Verify outcome: manual targeted offer creation creates a pending manual `AssignmentOffer`, validates order `CREATED|DELAYED` and target courier active/free through the current availability boundary, records `order.offer_created`, notifies the target courier through the Telegram boundary, and leaves order status/courier assignment unchanged. No claim, timeout, auto-offer broadcast, status progression or legacy direct-assignment cleanup was added. `npm run test:delivery-assignment -- --runInBand`, focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation pass.

#### TASK-FT016-10 - Implement atomic courier claim
- TASK-ID: `TASK-FT016-10`
- Status: `done`
- Wave: `W4`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-09`
- Touched files: `backend/src/slices/delivery-assignment/**/*`, `backend/src/integrations/telegram-bot/**/*`, `tests/slices/delivery-assignment/**/*`
- Tests: integration race test for first successful claimant wins; duplicate Telegram callback unit test; runtime claim smoke; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: bot claim command requires a claimable pending offer, order `CREATED|DELAYED`, empty `courierId`, and courier active/free; successful claim marks exactly one offer claimed, writes `courierId`, status `ASSIGNED`, history/audit/event, derives assignment time from status history/event metadata/read model, and publishes `order.assigned` only after the successful claim.
- Implementation outcome: claim command is implemented through the existing Telegram bot callback harness plus delivery-assignment application/repository boundary; pending targeted/broadcast offers remain non-assignment until claim, successful claim writes `ASSIGNED` artifacts/event, duplicate/concurrent/wrong/invalid claims return controlled failures without second assignment side effects. `assignedAt` is not added to Prisma because the current schema lacks the field and existing read models derive claimed/assigned time from status history/runtime metadata.
- Verify outcome: `PASS`; Telegram claim callback parsing delegates to the slice service boundary, the repository transaction enforces first-claim-wins assignment artifacts/events, manual offers remain pending-only, legacy direct assignment remains explicit, and no timeout/broadcast/status-progression/admin-claim/legacy-cleanup scope was added. `npm run test:delivery-assignment -- --runInBand`, `git diff --check`, and changed markdown local link validation pass.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract/state docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: atomic pending-offer claim only; one successful claimant; status becomes `ASSIGNED` only after successful claim; `order.assigned` is allowed only after successful claim; no timeout/`DELAYED` evaluator, auto-offer broadcast, pickup/completion flow, status progression after `ASSIGNED`, or cleanup of legacy direct assignment.

#### TASK-FT016-11 - Implement optional auto-offer broadcast trigger
- TASK-ID: `TASK-FT016-11`
- Status: `done`
- Wave: `W4`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-10`
- Touched files: `backend/src/slices/delivery-assignment/**/*`, `backend/src/dev-runtime/**/*`, `frontend/src/admin/**/*`, `backend/src/integrations/telegram-bot/**/*`, `tests/slices/delivery-assignment/**/*`, focused admin tests
- Tests: backend fan-out tests; admin setting frontend test; runtime smoke with two eligible couriers; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: admin/operator auto-offer setting is available and defaults OFF; when explicitly enabled for new unassigned orders, the system creates a broadcast offer and notifies only active/free/auto-offer-enabled couriers; the order remains `CREATED|DELAYED` until a courier claim succeeds.
- Implementation outcome: implemented an explicit operator/admin broadcast trigger that defaults OFF by absence of automatic execution; the trigger filters active/free/auto-offer-enabled couriers, persists one pending broadcast offer plus `order.offer_created` event per eligible courier, then notifies only after persistence. Broadcast leaves order status/courier assignment unchanged and does not publish `order.assigned`; existing manual offer, atomic claim and legacy direct assignment paths remain intact.
- Verify outcome: `PASS`; explicit broadcast trigger remains default OFF by having no automatic evaluator/background path, persists pending broadcast offers plus `order.offer_created` before notifications, targets only active/free/auto-offer-enabled couriers, and leaves order status/courier assignment/history/audit unchanged until a later successful claim. `npm run test:delivery-assignment -- --runInBand`, focused admin assignment Jest, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation pass.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: optional auto-offer broadcast trigger only; no timeout/`DELAYED` evaluator, no queue/Redis/route optimization, no auto-accept, no pickup/completion/status progression, no legacy direct assignment cleanup, and no assignment before successful claim.

#### TASK-FT016-12 - Implement offer timeout evaluator as explicit KISS application command
- TASK-ID: `TASK-FT016-12`
- Status: `done`
- Wave: `W5`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-018`
- Depends on: `TASK-FT016-10`, `TASK-FT016-11`
- Touched files: `backend/src/slices/delivery-assignment/**/*`, `backend/src/dev-runtime/**/*`, `backend/src/integrations/telegram-bot/**/*`, `tests/slices/delivery-assignment/**/*`
- Tests: timer/evaluator unit and integration tests using injected clock; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: explicit service command/evaluator is callable by runtime/manual tick/test harness; after 3 minutes it repeats notification once; after 6 minutes it expires pending offers, sets or keeps order `DELAYED`, publishes `order.assignment_timeout`/`order.delayed`, notifies operators, and penalizes only a personal target courier once.
- Implementation outcome: implemented an explicit `delivery-assignment` offer timeout evaluator command plus protected dev-runtime manual tick route. The evaluator records `order.offer_repeated` once after 3 minutes for pending offers, expires still-pending offers after 6 minutes, sets/keeps unassigned orders `DELAYED`, records `order.assignment_timeout` and `order.delayed` only after persistence, notifies operators through the existing Telegram notifier boundary when operator Telegram user targets exist, and decrements only manual/personal target courier `ratingScore` once. Claimed/accepted offers, `ASSIGNED` orders, orders with `courierId`, completed/terminal/post-assignment lifecycle and broadcast penalty remain untouched.
- Verify outcome: `PASS`; explicit callable evaluator/manual tick records repeat-once, expires pending offers after 6 minutes, persists timeout/`DELAYED` artifacts before notifications, uses existing Telegram notifier boundary, penalizes only personal/manual target couriers once, skips claimed/assigned/post-assignment orders, and adds no worker/cron/queue/Redis, claim, broadcast, auto-accept, pickup/completion or legacy cleanup behavior. `npm run test:delivery-assignment -- --runInBand`, `git diff --check`, and changed markdown local link validation pass.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract/state docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: timeout/evaluator only; no background worker architecture, cron deployment, admin UI, new claim logic, auto-offer broadcast changes, pickup/completion/status progression, legacy direct assignment cleanup, Redis, queues, route optimization, or auto-accept behavior.

#### TASK-FT016-13 - Surface DELAYED escalation in operator panel and customer status copy
- TASK-ID: `TASK-FT016-13`
- Status: `failed`
- Wave: `W5`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-008`, `REQ-033`
- Depends on: `TASK-FT016-12`
- Touched files: `frontend/src/admin/*`, `frontend/src/slices/order-tracking/*`, corresponding tests
- Tests: admin frontend tests; `npm run test:order-tracking:frontend`; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: admin panel top alert consumes `DELAYED`; customer order tracking parser/view copy supports `DELAYED`; customer sees waiting/problem copy rather than courier progress; existing active orders still render.
- Implementation outcome: admin operator read-model now treats `status=DELAYED` as delayed danger/alert copy even if a stale read severity is returned, so the top alert and row chip remain explicitly `DELAYED`/red. Customer order tracking has focused route coverage for `DELAYED` waiting/problem copy, parser coverage for `DELAYED`/`PICKED_UP`, and read-only behavior without courier progress controls.
- Checks: scoped admin assignment Jest passed; `npm run test:order-tracking:frontend -- --runInBand` passed; `git diff --check` passed; changed markdown local link validation passed. Broader `npm run test:delivery-assignment:frontend -- --runInBand ...` also ran the full admin suite because of the package script and still shows the unrelated existing catalog provisioning copy expectation drift in `admin-router.spec.tsx`.
- Verify outcome: `FAIL`; admin presentation and direct initial-session customer copy pass, but the customer parser does not consume the real timeout-produced `order.delayed` event shape (`oldStatus`/`newStatus`). Minimal fix: accept `order.delayed` in `frontend/src/slices/order-tracking/api/order-tracking-api.ts` and normalize `newStatus -> status`, `oldStatus -> previousStatus`, with focused parser/polling coverage.
- Repair outcome: `PASS` via `TASK-FT016-13-FIX`; historical `FAIL` evidence is retained, and downstream work should treat the customer parser gap as repaired by the fix task.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: presentation/read-copy task only; no customer mutation commands, timeout evaluator changes, assignment rule changes, new claim logic, auto-offer changes, pickup/completion/status progression, legacy direct assignment cleanup, or backend lifecycle mutation behavior.

#### TASK-FT016-13-FIX - Accept timeout DELAYED event in customer tracking parser
- TASK-ID: `TASK-FT016-13-FIX`
- Status: `done`
- Wave: `W5-repair`
- Feature: `FT-016`, `FT-014`
- REQs: `REQ-036`, `REQ-033`, `REQ-009`
- Depends on: `TASK-FT016-12`
- Touched files: `frontend/src/slices/order-tracking/api/order-tracking-api.ts`, `frontend/src/tests/slices/order-tracking/**/*`
- Tests: focused parser/polling coverage for timeout-produced `order.delayed`; `npm run test:order-tracking:frontend -- --runInBand`; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: customer order tracking accepts the real timeout evaluator event `type=order.delayed`, normalizes `payload.newStatus -> status` and `payload.oldStatus -> previousStatus`, then renders customer-safe `DELAYED` waiting/problem copy without courier/admin mutation controls.
- Implementation outcome: customer order tracking now accepts `order.delayed`, maps timeout payload `newStatus`/`oldStatus` into canonical status fields, and has focused parser plus open customer tracking route polling coverage for customer-safe `DELAYED` copy.
- Checks: `npm run test:order-tracking:frontend -- --runInBand` passed; `git diff --check` passed. Changed markdown local link validation was not applicable because this repair added no markdown links.
- Verify outcome: `PASS`; parser accepts `order.delayed`, normalizes `newStatus -> status` and `oldStatus -> previousStatus`, and focused parser/open-route coverage proves an already-open read-only customer tracking screen renders `DELAYED` waiting/problem copy without mutation controls. `npm run test:order-tracking:frontend -- --runInBand`, focused admin assignment/view-model Jest, and `git diff --check` pass.
- Docs: `tasks/backlog.md`, `changelog.md`, `.protocols/AUTONOMOUS-RUN/status.md`; update feature/state/contract docs only if implementation reveals spec drift.
- Source: `.protocols/TASK-FT016-13/verification.md`
- Constraints: frontend order-tracking parser/read-copy repair only; no backend producer changes, timeout evaluator changes, assignment/offer/claim changes, customer mutation commands, admin-web changes, pickup/completion/status progression, legacy direct assignment cleanup, or backend lifecycle mutation behavior.

#### TASK-FT016-14 - Enable v2 delivery tracking state machine
- TASK-ID: `TASK-FT016-14`
- Status: `done`
- Wave: `W6`
- Feature: `FT-016`
- REQs: `REQ-036`, `REQ-007`, `REQ-008`, `REQ-018`
- Depends on: `TASK-FT016-01`, `TASK-FT016-10`, `TASK-FT016-13-FIX` (repaired-by evidence for historical `TASK-FT016-13` failure)
- Touched files: `backend/src/slices/delivery-tracking/*`, `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.*`, `tests/slices/delivery-tracking/*`
- Tests: backend unit/integration tests and bot harness tests; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: courier can do `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`; skip/replay/regression returns `409`; old `IN_PROGRESS -> DELIVERED` remains valid for already-in-progress orders; courier no longer completes orders.
- Implementation outcome: enabled the slice-owned v2 tracking map `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, removed courier `COMPLETED` from delivery-tracking action statuses and Telegram tracking callbacks, kept legacy `IN_PROGRESS -> DELIVERED` valid for already-in-progress active orders, and added focused tests for v2 progression, invalid skip/regression, legacy compatibility and courier completion rejection.
- Checks: `npm run test:delivery-tracking:unit -- --runInBand`; `npm run test:delivery-tracking:integration -- --runInBand`; `npm run test:delivery-tracking -- --runInBand`; `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added.
- Verify outcome: `PASS`; v2 courier tracking now runs `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, invalid skip/replay/regression and courier `DELIVERED -> COMPLETED` attempts return `409` without persistence side effects, legacy active `IN_PROGRESS -> DELIVERED` remains valid, and bot tracking callbacks expose only pickup/progress/delivered actions. `npm run test:delivery-tracking -- --runInBand`, `git diff --check`, and changed markdown local link validation pass.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract/state docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: v2 delivery-tracking state machine only; no operator completion UI, admin-web status command, cancellation/refund changes, assignment offer/claim changes, timeout evaluator changes, auto-offer changes, legacy direct assignment cleanup, customer mutation commands, or broad shared state-machine extraction.

#### TASK-FT016-15 - Add operator/admin status control and DELIVERED -> COMPLETED closure
- TASK-ID: `TASK-FT016-15`
- Status: `failed`
- Wave: `W6`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-008`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT016-14`, `TASK-FT016-06`
- Touched files: `backend/src/slices/delivery-tracking/**/*`, `backend/src/dev-runtime/**/*`, `frontend/src/admin/**/*`, `tests/slices/delivery-tracking/**/*`, focused admin tests
- Tests: backend integration tests; admin route tests; runtime smoke; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: operator/admin status command supports allowed next transitions, especially `DELIVERED -> COMPLETED`; admin operator panel uses a confirmation popup; history/read model includes actor role/name; courier `DELIVERED -> COMPLETED` remains rejected; invalid transition returns `409` without side effects.
- Implementation outcome: added a separate operator/admin delivery-tracking status command and protected admin runtime endpoint for allowed next transitions only (`ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`), with actor role/name captured in status-change event payload and runtime operator read-model history. Admin-web now enables confirmed status control actions for allowed next transitions, including `DELIVERED -> COMPLETED`, while targeted/broadcast offer and bot-chat scopes remain unchanged.
- Checks: `npm run test:delivery-tracking -- --runInBand`; focused admin assignment Jest for API/route/view-model; `npm run build:frontend`; `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added.
- Verify outcome: `FAIL`; the narrow transition command and admin confirmation path exist, but the mounted runtime API does not support the real operator role because admin-access exposes `manager` while delivery-tracking accepts only literal `operator|admin`. Minimal fix: normalize `manager` to operator capability at the route/service boundary and add focused runtime coverage for manager `DELIVERED -> COMPLETED`.
- Repair outcome: `PASS` via `TASK-FT016-15-FIX`; original FAIL evidence is retained, and downstream work should treat the admin-access `manager` role mapping gap as repaired by the fix task.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract/state docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: operator/admin closure only; no broad arbitrary status overrides, cancellation reason logic, cancellation/refund changes, assignment offer/claim changes, timeout evaluator changes, auto-offer changes, legacy direct assignment cleanup, customer mutation commands, or shared state-machine extraction.

#### TASK-FT016-15-FIX - Normalize admin manager role for operator status command
- TASK-ID: `TASK-FT016-15-FIX`
- Status: `done`
- Wave: `W6-repair`
- Feature: `FT-016`, `FT-007`
- REQs: `REQ-035`, `REQ-008`, `REQ-009`, `REQ-018`, `REQ-015`
- Depends on: `TASK-FT016-14`, `TASK-FT016-06`
- Touched files: `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`, optional `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`, `tests/slices/delivery-tracking/**/*`, focused runtime tests
- Tests: focused mounted admin runtime coverage for authenticated `manager` executing `DELIVERED -> COMPLETED`; existing delivery-tracking status tests; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: admin-access role `manager` is normalized to delivery-tracking `operator` capability only at the operator/admin status command boundary; `admin` remains admin-capable; non-operator roles remain rejected; `manager` can execute allowed `DELIVERED -> COMPLETED` and invalid transitions still return `409` without side effects.
- Implementation outcome: route-boundary normalization maps admin-access `manager` to delivery-tracking `operator` only for the mounted operator/admin status command actor. `admin` is passed through as `admin`; other roles are not broadened and still rely on the existing delivery-tracking service rejection. Runtime coverage proves authenticated `MANAGER` can close `DELIVERED -> COMPLETED`, invalid manager `PICKED_UP -> COMPLETED` returns `409`, and `BOSS` receives `403` without changing order status.
- Checks: `npm run test:delivery-tracking -- --runInBand`; `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added.
- Verify outcome: `PASS`; the route/service boundary now normalizes admin-access `manager` into delivery-tracking `operator` for the operator/admin status command only, `admin` remains admin-capable, `boss` remains rejected with no status side effects, invalid manager transitions still return `409`, and `TASK-FT016-15` is repaired by this fix while preserving its original FAIL evidence.
- Docs: `tasks/backlog.md`, `changelog.md`, `.protocols/AUTONOMOUS-RUN/status.md`; update feature/contract/state docs only if implementation reveals spec drift.
- Source: `.protocols/TASK-FT016-15/verification.md`
- Constraints: role/capability normalization repair only for the operator/admin status command boundary; no lifecycle transition changes, no broad arbitrary authorization changes, no UI changes unless focused tests require role expectation updates, no cancellation/refund changes, no assignment offer/claim/timeout/auto-offer changes, and no legacy cleanup.

#### TASK-FT016-16 - Update polling consumers for PICKED_UP/DELAYED/operator completion
- TASK-ID: `TASK-FT016-16`
- Status: `done`
- Wave: `W6`
- Feature: `FT-016`
- REQs: `REQ-035`, `REQ-036`, `REQ-008`, `REQ-009`, `REQ-033`
- Depends on: `TASK-FT016-14`, `TASK-FT016-15-FIX` (repairs historical `TASK-FT016-15` operator/admin completion prerequisite)
- Touched files: `frontend/src/slices/order-tracking/**/*`, `frontend/src/admin/**/*`, frontend tests for order tracking and admin operator polling/read updates
- Tests: `npm run test:order-tracking:frontend`; focused admin route/model/API tests; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: customer and admin polling consumers apply v2 events in order for `PICKED_UP`, `DELAYED`, and operator/admin `COMPLETED`; terminal states remain closed; read-only customer UI has no operator controls; opaque cursor handling remains string-only.
- Implementation outcome: customer order-tracking now keeps courier-side actions to `PICKED_UP -> IN_PROGRESS -> DELIVERED`, accepts `oldStatus/newStatus` status-event payloads for operator/admin `COMPLETED`, applies read-only customer polling through `PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`, and preserves string-only opaque cursor handling. Admin operator read-model coverage now asserts terminal `COMPLETED`/`CANCELLED_*` rows have no follow-up status controls and confirmed `DELIVERED -> COMPLETED` rows close the action after local update.
- Checks: `npm run test:order-tracking:frontend -- --runInBand`; focused admin assignment API/view-model/route Jest; `npm run build:frontend`; `git diff --check`. Changed markdown local link validation was not applicable because no markdown links were added.
- Verify outcome: `PASS`; customer polling consumes ordered `PICKED_UP`, `IN_PROGRESS`, `DELIVERED` and operator/admin `COMPLETED` updates read-only, accepts `DELAYED`/`oldStatus`/`newStatus` event payloads with string-only cursor handling, and keeps `COMPLETED`/`CANCELLED_*` terminal states closed. Admin operator read-model/status-control coverage handles `PICKED_UP`, `DELAYED`, `COMPLETED` and terminal closed rows without adding backend transition, offer/claim, timeout, assignment, cancellation/refund, legacy cleanup or shared state-machine behavior.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract/state docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: polling consumer alignment only; no backend transition logic, offer claim, timeout evaluator changes, assignment rule changes, broad lifecycle override, cancellation/refund changes, legacy direct assignment cleanup, or shared state-machine extraction.

#### TASK-FT016-17 - Isolate or remove legacy direct assignment path
- TASK-ID: `TASK-FT016-17`
- Status: `failed`
- Wave: `W7`
- Feature: `FT-016`
- REQs: `REQ-007`, `REQ-035`, `REQ-036`, `REQ-018`
- Depends on: `TASK-FT016-10`, `TASK-FT016-15-FIX` (repairs the plan's historical `TASK-FT016-15` prerequisite), `TASK-FT016-16`
- Touched files: `backend/src/slices/delivery-assignment/**/*`, `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`, `frontend/src/admin/**/*`, focused delivery-assignment/admin tests, docs references if direct-assignment wording changes
- Tests: regression tests proving no default direct `CREATED -> ASSIGNED` from the admin page; override tests if retained; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: normal manual operator/admin path creates an offer rather than direct assignment; direct assignment, if retained, is renamed/presented as an explicit override only with operator/admin confirmation and audit action; active v1 assigned orders remain readable.
- Implementation outcome: normal admin-web/manual assignment usage remains routed to `POST /assignment-offers`; the old mounted `POST /assignment` endpoint now returns `LEGACY_ASSIGNMENT_DISABLED` without assigning; a retained explicit `POST /assignment-override` path requires `confirmDirectAssignmentOverride: true`, normalizes `manager` to operator capability at the route boundary, and writes distinct `override_assigned` delivery-assignment audit action while preserving existing v1 order readability.
- Checks: `npm run test:delivery-assignment -- --runInBand` passed; focused admin assignment API/view-model/route Jest passed; `git diff --check` passed.
- Verify outcome: `FAIL`; additional repo-local `npm run test:delivery-tracking -- --runInBand` fails because `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts` still expects the disabled normal legacy `/assignment` endpoint to return `200`. Minimal repair: update those runtime setups to use v2 offer+claim or seeded/read existing assigned orders; use `/assignment-override` only for explicit override tests with confirmation.
- Repair outcome: `PASS` via `TASK-FT016-17-FIX`; historical `FAIL` evidence is retained, and downstream work should treat the stale delivery-tracking runtime setup as repaired by the fix task.
- Docs: `tasks/backlog.md`, `changelog.md`; update feature/contract docs only if implementation reveals spec drift.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: legacy direct assignment isolation/cleanup only; no deletion or rewrite of historical assignment audits/events/orders, no offer/claim semantics changes, no timeout/DELAYED evaluator changes, no auto-offer broadcast changes, no pickup/completion lifecycle changes, no cancellation/refund changes, no broad admin panel rewrite, and no shared business abstraction extraction.

#### TASK-FT016-17-FIX - Repair delivery-tracking runtime setup after legacy assignment isolation
- TASK-ID: `TASK-FT016-17-FIX`
- Status: `done`
- Wave: `W7-repair`
- Feature: `FT-016`
- REQs: `REQ-007`, `REQ-008`, `REQ-035`, `REQ-036`, `REQ-018`
- Depends on: `TASK-FT016-17`
- Touched files: `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`, `.protocols/TASK-FT016-17/verification.md`, `.memory-bank/tasks/backlog.md`, `.memory-bank/changelog.md`, `.protocols/AUTONOMOUS-RUN/status.md`
- Tests: `npm run test:delivery-tracking -- --runInBand`; `git diff --check`; changed markdown local link validation.
- Verify: delivery-tracking runtime tests no longer use normal legacy `POST /api/v1/admin/orders/:id/assignment` setup expecting `200`; newly assigned runtime orders use v2 offer+claim setup, or tests seed/read an already-assigned v1 order only when proving readability; `/assignment-override` appears only in explicit override tests and includes `confirmDirectAssignmentOverride: true`.
- Implementation outcome: delivery-tracking runtime setup now creates manual assignment offers and claims them through the delivery-assignment controller instead of calling disabled normal legacy `/assignment`. Customer events coverage now expects the v2 pair of `order.offer_created` plus `order.assigned`, keeps unrelated order events filtered out, and preserves the global opaque cursor advance. No production behavior, legacy endpoint, offer/claim/timeout/status/cancellation/refund semantics, or shared abstractions were changed.
- Checks: `npm run test:delivery-tracking -- --runInBand` passed; `npm run test:delivery-assignment -- --runInBand` passed; `git diff --check` passed. Changed markdown local link validation was not applicable because no markdown links were added.
- Verify outcome: `PASS`; delivery-tracking runtime setup no longer uses normal legacy `/assignment` expecting `200`, new assigned orders use v2 offer+claim setup, `/assignment-override` was not added to this setup, normal legacy `/assignment` remains disabled, and no production behavior or flow semantic changes were introduced by the fix. `TASK-FT016-17` is repaired-by this fix while retaining original `FAIL` evidence.
- Docs: `tasks/backlog.md`, `changelog.md`, `.protocols/AUTONOMOUS-RUN/status.md`; update feature/contract/state docs only if implementation reveals spec drift.
- Source: `.protocols/TASK-FT016-17/verification.md`
- Constraints: test/runtime setup repair only; no production behavior changes unless tests reveal a wiring bug directly tied to stale setup; no flow semantics changes, no legacy endpoint re-enable, no offer/claim/timeout/auto-offer/status/cancellation/refund changes, and no shared business abstraction extraction.

#### TASK-FT016-18 - End-to-end operator delivery flow verification
- TASK-ID: `TASK-FT016-18`
- Status: `done`
- Wave: `W8`
- Feature: `FT-016`
- REQs: `REQ-007`, `REQ-008`, `REQ-035`, `REQ-036`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT016-13-FIX` (repairs the plan's historical `TASK-FT016-13` prerequisite), `TASK-FT016-16`, `TASK-FT016-17-FIX` (repairs the plan's historical `TASK-FT016-17` prerequisite)
- Touched files: verification/protocol reports and docs only: `.protocols/TASK-FT016-18/**/*`, `.tasks/TASK-FT016-18/**/*`, `.protocols/AUTONOMOUS-RUN/status.md`, `.memory-bank/tasks/backlog.md`, `.memory-bank/requirements.md`, `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`, `.memory-bank/changelog.md`
- Tests: `npm run test:delivery-assignment`; `npm run test:delivery-tracking`; focused admin frontend tests; `npm run test:order-tracking:frontend`; `npm run lint`; `npm run build:frontend`; `git diff --check`; changed markdown local link validation if docs links change.
- Verify: run and record the full v2 scenario: paid order `CREATED`, operator panel sees unassigned, manual offer, courier claim, `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, operator closes `COMPLETED`, polling visibility works, and old v1 active order remains readable.
- Verify outcome: `PASS`; repo-local strict verification/docs-only checks proved paid checkout order creation, unassigned operator visibility, manual offer, courier claim into `ASSIGNED`, courier progress through `PICKED_UP -> IN_PROGRESS -> DELIVERED`, operator/admin `DELIVERED -> COMPLETED`, customer/admin polling visibility, disabled normal legacy assignment, and old v1 active order readability. Checks passed: checkout-payment Jest, `npm run test:delivery-assignment -- --runInBand`, `npm run test:delivery-tracking -- --runInBand`, focused admin assignment Jest, `npm run test:order-tracking:frontend -- --runInBand`, `npm run lint`, `npm run build:frontend`, `git diff --check`, and changed markdown local link validation.
- Docs: `tasks/backlog.md`, `requirements.md`, `features/FT-016`, `changelog.md`; record residual risks and update RTM evidence only after verification supports it.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: strict verification/docs-only scope. Allowed actions are only verification commands and docs/protocol report updates. Forbidden: production code changes, frontend/backend logic changes, schema changes, test repair, evidence repair, fixture repair, any implementation/test/fixture/evidence patch, production deploy, real Android Telegram evidence unless separately requested, Redis/queues/GPS, and assignment/tracking semantic expansion beyond the implemented FT-016 flow. If verification exposes a wiring gap, `TASK-FT016-18` must be marked `FAIL` and a separate narrow repair task must be proposed or created with exact evidence; do not patch during verification.

#### TASK-FT016-19 - Documentation and Memory Bank sync
- TASK-ID: `TASK-FT016-19`
- Status: `done`
- Wave: `W8`
- Feature: `FT-016`
- REQs: `REQ-007`, `REQ-008`, `REQ-035`, `REQ-036`, `REQ-009`, `REQ-018`
- Depends on: `TASK-FT016-18`
- Touched files: `.memory-bank/features/FT-004-courier-assignment.md`, `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`, `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`, `.memory-bank/requirements.md`, `.memory-bank/tasks/plans/index.md`, `.memory-bank/changelog.md`
- Tests: `git diff --check`; markdown link validation.
- Verify: Memory Bank describes implemented v2 behavior and remaining follow-ups; no drift between requirements RTM lifecycle and `TASK-FT016-18` verification evidence.
- Implementation outcome: feature docs, RTM, task plan index, changelog and Telegram verification runbook notes now describe the verified v2 flow, repaired historical failures, disabled normal legacy assignment, old v1 active order readability and residual advisory Android Telegram smoke risk. No code, tests, schema, fixture, evidence or behavior changes were made.
- Verify outcome: `PASS`; docs reflect the verified repo-local FT-016 v2 flow, requirements/feature docs cover offer/claim assignment, `PICKED_UP`, operator/admin `COMPLETED`, disabled normal legacy assignment and old v1 active readability, historical failed/repaired task evidence is preserved, and residual real Android Telegram / production deploy smoke risks remain explicit. Overall FT-016 migration is complete for repo-local scope.
- Checks: `git diff --check`; changed markdown local link validation.
- Docs: feature docs, requirements RTM lifecycle, tasks/plans index, changelog, runbook notes if needed; archive/record residual debt.
- Source: `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- Constraints: documentation and Memory Bank sync only; no code fixes after verification, no production/test/schema/fixture/evidence changes, no implementation behavior changes, and no additional FT-016 task expansion beyond this card.

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
