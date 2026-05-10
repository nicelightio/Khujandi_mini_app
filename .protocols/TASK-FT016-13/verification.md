---
description: Verification result for TASK-FT016-13 DELAYED presentation/read-copy surfacing.
status: active
---
# TASK-FT016-13 Verification

## Verdict

FAIL

## Scope checked

- Owning capability slice: `delivery-tracking`.
- Contours: `admin-web`, `mini-app`.
- Checked layers: frontend admin read model/presentation tests, customer order-tracking parser/view copy/tests, operational docs.
- Shared extraction: none observed or required for this task.

## Evidence

Passing evidence:

- Admin/operator read model treats `status=DELAYED` as danger/delayed even when `severity` is stale:
  - [frontend/src/admin/model/admin-assignment-view-model.ts](/home/serg/Projects/Khujandi_mini_app/frontend/src/admin/model/admin-assignment-view-model.ts:251)
  - [frontend/src/admin/model/admin-assignment-view-model.ts](/home/serg/Projects/Khujandi_mini_app/frontend/src/admin/model/admin-assignment-view-model.ts:547)
- Admin focused tests cover top alert and stale-severity `DELAYED` row/read-model copy:
  - [frontend/src/tests/admin/admin-assignment-view-model.spec.ts](/home/serg/Projects/Khujandi_mini_app/frontend/src/tests/admin/admin-assignment-view-model.spec.ts:71)
  - [frontend/src/tests/admin/admin-assignment-view-model.spec.ts](/home/serg/Projects/Khujandi_mini_app/frontend/src/tests/admin/admin-assignment-view-model.spec.ts:93)
- Customer copy supports `DELAYED` and renders waiting/problem copy without mutation buttons in the focused route test:
  - [frontend/src/shared/i18n/copy.ts](/home/serg/Projects/Khujandi_mini_app/frontend/src/shared/i18n/copy.ts:188)
  - [frontend/src/tests/slices/order-tracking/order-tracking-route.customer-status.spec.tsx](/home/serg/Projects/Khujandi_mini_app/frontend/src/tests/slices/order-tracking/order-tracking-route.customer-status.spec.tsx:84)

Blocking issue:

- Customer order tracking parser does not consume the actual `DELAYED` event emitted by the timeout evaluator. `TASK-FT016-12` persists `order.delayed` with payload fields `oldStatus`/`newStatus`, while the customer parser accepts only `order.assigned` or `order.status_changed` and requires `payload.status`.
  - Producer: [backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts](/home/serg/Projects/Khujandi_mini_app/backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:1086)
  - Producer payload: [backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts](/home/serg/Projects/Khujandi_mini_app/backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:1090)
  - Producer test evidence: [tests/slices/delivery-assignment/delivery-assignment-timeout.spec.ts](/home/serg/Projects/Khujandi_mini_app/tests/slices/delivery-assignment/delivery-assignment-timeout.spec.ts:362)
  - Consumer accepted event types: [frontend/src/slices/order-tracking/api/order-tracking-api.ts](/home/serg/Projects/Khujandi_mini_app/frontend/src/slices/order-tracking/api/order-tracking-api.ts:22)
  - Consumer filter: [frontend/src/slices/order-tracking/api/order-tracking-api.ts](/home/serg/Projects/Khujandi_mini_app/frontend/src/slices/order-tracking/api/order-tracking-api.ts:104)

Impact:

- A customer who is already on the tracking screen can miss the timeout-driven `CREATED -> DELAYED` update because `order.delayed` is filtered out before the view model sees it.
- This violates the acceptance item "Customer order tracking parser/view copy supports `DELAYED`" for the real event stream, even though direct initial-session `DELAYED` copy renders correctly.

Minimal fix recommendation:

- In `frontend/src/slices/order-tracking/api/order-tracking-api.ts`, extend `OrderTrackingEvent["type"]` and `parseEvent` to accept `order.delayed`.
- Normalize delayed payload shape by mapping `payload.newStatus` to `status` and `payload.oldStatus` to `previousStatus` for `order.delayed`, while preserving the existing `order.status_changed` and `order.assigned` behavior.
- Add a focused parser test with an `order.delayed` event from the timeout payload shape and a route/polling assertion that it renders the `DELAYED` waiting/problem copy without customer mutation controls.

## Commands

- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx --runInBand` - PASS
- `npm run test:order-tracking:frontend -- --runInBand` - PASS
- `git diff --check` - PASS
- Targeted changed-doc markdown local link validation - PASS

## Scope guard

No implementation changes were made by this verifier. No commits or pushes were performed.
