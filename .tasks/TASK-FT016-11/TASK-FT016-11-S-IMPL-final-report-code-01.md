---
description: Implementation final report for TASK-FT016-11 optional auto-offer broadcast trigger.
status: active
---
# TASK-FT016-11 Implementation Report

## Summary

Implemented the optional auto-offer broadcast trigger as an explicit operator/admin command. Auto-offer remains default OFF: no automatic new-order evaluator, timer, queue, Redis, auto-accept or background dispatch path was added.

## Ownership

- Owning slice: `delivery-assignment`.
- Contours: backend/dev-runtime, narrow `admin-web` trigger surface, Telegram bot notification boundary.
- Touched layers: application, domain contract types, infra/persistence, narrow presentation/runtime adapter, admin API/UI, focused tests, docs.
- Shared extraction: none. Broadcast eligibility and offer creation remain slice-local.

## Implementation

- Added `createBroadcastOffers` to the delivery-assignment service/controller/repository boundary.
- Broadcast validates operator/admin actor and order status `CREATED|DELAYED`.
- Candidate couriers are selected only when active, not past stop-after cutoff, `autoOfferEnabled`, and free from active orders in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, or `DELIVERED`.
- Persistence creates one pending `broadcast` offer and one `order.offer_created` event per eligible courier, then notifications are sent after persistence succeeds.
- Broadcast result leaves the order `CREATED|DELAYED` with no `courierId`, no `ASSIGNED`, no assignment history/audit and no `order.assigned`.
- Existing manual targeted offer, atomic claim and legacy direct assignment paths are preserved.
- Added explicit admin endpoint `POST /api/v1/admin/orders/:orderId/auto-offers` and admin-web action/API for triggering broadcast manually.

## Verification Run

- `npm run test:delivery-assignment -- --runInBand` - PASS, 4 suites / 43 tests.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx frontend/src/tests/admin/admin-assignment-view-model.spec.ts --runInBand` - PASS, 3 suites / 18 tests.
- `npm run build:frontend` - PASS.
- `git diff --check` - PASS.
- Changed markdown local link validation - PASS, 7 task-touched markdown files checked.
- `npx tsc --noEmit --pretty false` - not applicable; repo has no root `tsconfig.json`, so `tsc` printed help and did not run a project check.

## Residual Risks

- This task implements an explicit broadcast trigger, not a persisted global operator-panel auto-offer setting or automatic new-order evaluator. That is intentional for default OFF and task scope.
- Runtime notification dispatch is still represented through the existing notifier boundary; durable retry/transport failure handling remains outside this task.
- Timeout/repeat notification/`DELAYED` escalation remains out of scope for a later task.
