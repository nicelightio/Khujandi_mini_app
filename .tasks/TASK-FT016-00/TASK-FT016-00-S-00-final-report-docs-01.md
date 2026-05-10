---
description: Phase 0 baseline drift report and execution handoff for FT-016 operator delivery migration.
status: active
---
# TASK-FT016-00 Phase 0 Baseline Drift Report

## Scope

- TASK-ID: `TASK-FT016-00`
- Feature: `FT-016`
- Purpose: confirm current `FT-004`/`FT-005` v1 implementation baseline before any runtime/schema migration work.
- Runtime code changed: no.
- Schema changed: no.
- Backlog expanded with `TASK-FT016-01+`: no.

## Ownership And Boundaries

- Owning capability slices:
  - `delivery-assignment`: offers/claims and `CREATED|DELAYED -> ASSIGNED`.
  - `delivery-tracking`: lifecycle/history/events and `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Contours inspected:
  - `backend`: slice services/repositories/controllers and dev runtime.
  - `admin-web`: existing assignment route/page/API/view model.
  - `telegram-bot`: delivery assignment/tracking notification harnesses.
  - `mini-app`: customer status consumer only, because `FT-014` consumes tracking events.
- Layers touched by this task: docs/protocol/test inventory only.
- Shared justification: no shared extraction is justified. Business rules for assignment, dispatch, courier availability, claim, timeout and lifecycle must remain slice-owned; existing `shared` auth/error/event/db primitives are sufficient.

## Normative Baseline

Loaded SSOT inputs:

- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/tasks/plans/MIGRATE-FT-004-FT-005-to-FT-016.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`

Target v2 facts from specs:

- `ASSIGNED` means successful courier claim, not pending offer.
- Manual operator assignment creates a pending targeted offer; courier confirmation/claim sets `ASSIGNED`.
- Auto-offer is default OFF and fans out only to active/free participating couriers.
- Canonical lifecycle is `CREATED -> ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Courier drives only up to `DELIVERED`; operator/admin closes `DELIVERED -> COMPLETED`.
- `DELAYED` marks no accepted courier / timed out assignment attention.
- API cursors/revisions stay opaque strings at the boundary.

## Current Implementation Map

### Delivery Assignment

Observed files:

- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`
- `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`
- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`

Current v1 behavior:

- `DeliveryAssignmentService.assignCourier` allows only actor role `admin`.
- Assignable order status is exactly `CREATED`.
- Courier eligibility checks `role === "courier"` and `isActive`.
- Persistence directly writes `order.courierId` and `order.status = "ASSIGNED"`.
- The same transaction writes `OrderStatusHistory`, `DeliveryAssignmentAudit`, and `Event(type = "order.assigned")`.
- Runtime route `POST /api/v1/admin/orders/:id/assignment` calls this direct assignment command.

Drift against v2:

- Manual assignment currently sets `ASSIGNED` immediately; target requires pending offer first.
- There is no `AssignmentOffer` model, offer status, targeted/broadcast kind or claim command.
- There is no first-claim-wins race/atomic claim path.
- There is no timeout evaluator for 3+3 minute repeat/delayed escalation.
- `operator` role is absent; `admin` is the only allowed assignment role in service code.

### Delivery Tracking And State Machine

Observed files:

- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
- `backend/src/slices/delivery-tracking/domain/delivery-tracking.types.ts`
- `backend/src/slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository.ts`
- `backend/src/slices/delivery-tracking/presentation/delivery-tracking.controller.ts`

Current v1 behavior:

- Only actor role `courier` can change delivery status.
- Adjacent transition map is `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- `PICKED_UP` is not representable in domain action/status types.
- `DELIVERED -> COMPLETED` is courier-driven today.
- Valid status changes write `OrderStatusHistory`, `order.status_changed` event and string `revision`.
- Invalid skip/replay/wrong actor paths return controlled errors before persistence or inside the transaction.

Drift against v2:

- `PICKED_UP` is missing.
- `DELAYED` is missing.
- Operator/admin status command and confirmation/audit actor semantics are missing.
- Courier can still complete orders, while target requires operator/admin completion.
- Existing v1 active orders in `IN_PROGRESS`/`DELIVERED` must remain readable during migration.

### Events And Polling

Observed files:

- `backend/src/slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- `frontend/src/slices/order-tracking/api/order-tracking-api.ts`
- `frontend/src/slices/order-tracking/model/order-tracking-view-model.ts`

Current behavior:

- `order.assigned` and `order.status_changed` events are consumed by customer/order tracking code.
- Event response uses string `revision` and `nextCursor`.
- Prisma tracking repository normalizes non-numeric cursors to `0n` internally.
- Frontend `order-tracking` API treats cursors as strings and encodes `GET /api/v1/events?since=<cursor>`.
- Frontend parser only accepts statuses currently known to v1.

Drift/risk:

- Persistence implementation still assumes numeric event ids internally; API consumers must continue treating cursors as opaque strings.
- Customer tracking parser/view model will drop or fail to render `PICKED_UP`/`DELAYED` until updated.
- FT-014 explicitly predates `PICKED_UP`/`DELAYED`; this is expected follow-up scope, not Phase 0 work.

### Admin Panel

Observed files:

- `frontend/src/admin/routes/admin-assignment-route.tsx`
- `frontend/src/admin/components/admin-assignment-page.tsx`
- `frontend/src/admin/model/admin-assignment-view-model.ts`
- `frontend/src/admin/api/admin-assignment-api.ts`
- `frontend/src/admin/components/admin-dashboard-page.tsx`
- `frontend/src/admin/components/admin-protected-shell.tsx`

Current v1 behavior:

- Admin shell, protected shell and dashboard already exist.
- Assignment route is a narrow direct assignment form with default fixture order/couriers.
- API posts to `/api/v1/admin/orders/:id/assignment` and expects `status: "ASSIGNED"`.
- Success copy says the courier was assigned and revision is ready for downstream polling.
- Cancellation/refund and catalog provisioning routes are separate and should be preserved.

Drift against v2:

- No 4-day operator orders list.
- No top unassigned/`DELAYED` alert.
- No severity sorting/colors.
- No expandable status history rows.
- No courier claim state, last-message preview or bot chat redirect.
- Direct assignment is presented as the normal action.

Decision:

- Repair/extend existing admin panel first. Phase 0 found usable shell/routing/API/test structure, so rebuild-from-scratch is not justified.

### Telegram Bot Integration

Observed files:

- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.notifier.ts`

Current v1 behavior:

- Assignment notifier sends "assigned to you" message with dedupe key `order.assigned:<orderId>:<revision>`.
- Tracking harness builds courier status buttons for `IN_PROGRESS`, `DELIVERED`, `COMPLETED`.
- Tracking callback parser accepts only those v1 action statuses.

Drift against v2:

- No `Курьер` availability menu.
- No active/stop-after-5-min/auto-offer participation commands.
- No offer-created notification semantics.
- No claim callback or in-flight "пытаемся получить заказ..." path.
- Courier bot still exposes completion action, which conflicts with operator-owned completion target.

### Prisma/Data Model

Observed file:

- `backend/prisma/schema.prisma`

Current shape:

- `OrderStatus`: `CREATED`, `ASSIGNED`, `IN_PROGRESS`, `DELIVERED`, `COMPLETED`, cancellation states.
- `UserRole`: `BOSS`, `MANAGER`, `ADMIN`, `SELLER`, `COURIER`, `CLIENT`.
- `Order` has `courierId`, `status`, payment/refund fields and relations to status history/audits/events.
- `User` has `isActive`, but not the full courier availability model from `FT-016`.

Drift against v2:

- Missing `DELAYED`.
- Missing `PICKED_UP`.
- Missing `OPERATOR`.
- Missing courier fields `accepting_orders_until`, `auto_offer_enabled`, `rating_score`.
- Missing `AssignmentOffer` model/table.
- Missing simple order communication/read model for last message and chat previews.

Additional note:

- Phase 0 did not run Prisma validation because schema/runtime changes are out of scope. Future schema task should validate the full current schema before editing; current inspection saw an unrelated duplicate `id` line in `CatalogFavoriteShop`, which should be handled only if it affects the future schema gate.

## Existing Tests Inventory

### Delivery Assignment

- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts`
  - notification target;
  - repository boundary;
  - direct admin assignment success;
  - notifier outage does not roll back committed assignment;
  - unauthenticated/non-admin/invalid-state/invalid-courier rejections.
- `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts`
  - module wiring for successful assignment;
  - targeted notification retry isolation;
  - controlled errors without persistence side effects;
  - invalid role/courier guards.
- `tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts`
  - checked-in admin assignment route through dev-api-server.

### Delivery Tracking

- `tests/slices/delivery-tracking/delivery-tracking.unit.spec.ts`
  - Telegram status harness mapping;
  - callback parsing;
  - ordered polling events with string cursor;
  - transition metadata;
  - notifier outage behavior;
  - invalid adjacent transitions and actor ownership guards.
- `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts`
  - courier transition chain;
  - history/event writes and polling metadata;
  - notification behavior;
  - invalid transition `409` side-effect safety;
  - duplicate polling stability.
- `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`
  - mounted customer `GET /api/v1/events`;
  - customer event filtering;
  - empty windows and opaque non-numeric cursor handling.

### Admin Panel

- `frontend/src/tests/admin/admin-assignment-api.spec.ts`
  - posts direct courier assignment command;
  - maps project error contract.
- `frontend/src/tests/admin/admin-assignment-route.spec.tsx`
  - renders assignment shell/form;
  - selected courier changes;
  - success/error feedback;
  - backend API client path;
  - duplicate submit prevention.
- `frontend/src/tests/admin/admin-router.spec.tsx`
  - resolves protected admin assignment route and shell.
- Existing cancellation/provisioning/admin-auth tests cover adjacent admin routes that must remain stable.

### Customer Order Tracking

- `frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts`
  - opaque cursor handling;
  - duplicate/out-of-order event behavior;
  - terminal state closure;
  - event API parsing.
- `frontend/src/tests/slices/order-tracking/order-tracking-route.polling.spec.tsx`
  - ordered polling and resume behavior;
  - current courier flow to `COMPLETED`.
- `frontend/src/tests/slices/order-tracking/order-tracking-route.customer-status.spec.tsx`
  - customer-safe status entry and copy.
- `frontend/src/tests/slices/order-tracking/order-tracking-sla.spec.tsx`
  - repo-local polling SLA profile.

## First Files To Touch In Later Tasks

### Phase 1: status/role compatibility

- `backend/prisma/schema.prisma`
- new `backend/prisma/migrations/*/migration.sql`
- `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`
- `backend/src/slices/delivery-tracking/domain/delivery-tracking.types.ts`
- `frontend/src/slices/order-tracking/api/order-tracking-api.ts`
- `frontend/src/slices/order-tracking/model/order-tracking-view-model.ts`
- `tests/slices/delivery-assignment/*`
- `tests/slices/delivery-tracking/*`
- `frontend/src/tests/slices/order-tracking/*`

### Phase 2: operator read panel

- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
- `backend/src/dev-runtime/order-ops-runtime.ts`
- likely a delivery-tracking read model under `backend/src/slices/delivery-tracking/*`
- `frontend/src/admin/api/admin-assignment-api.ts`
- `frontend/src/admin/model/admin-assignment-view-model.ts`
- `frontend/src/admin/routes/admin-assignment-route.tsx`
- `frontend/src/admin/components/admin-assignment-page.tsx`
- `frontend/src/tests/admin/admin-assignment-*`

### Phase 3+: bot/offer/claim/status migration

- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier.ts`
- new or updated Telegram courier menu/offer harness files
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness.ts`

## Handoff Notes

- Keep additive-first sequencing from the migration plan.
- Preserve old active orders; do not rewrite in-flight orders just to insert `PICKED_UP` or offer rows.
- Do not expose v2 manual offer UI before backend offer creation and atomic claim are coherent.
- Keep legacy direct assignment only as explicit override if operational fallback is needed.
- Every later runtime phase should add/adjust focused tests before broader e2e verification.
- `TASK-FT016-00` is ready for verification after protocol/check completion; backlog should remain `in_progress` until verifier decides final status.
