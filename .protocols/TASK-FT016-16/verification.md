---
description: Verification report for TASK-FT016-16 polling consumer alignment.
status: active
---
# TASK-FT016-16 Verification

## Verdict

PASS

## Scope Verified

- Owning slice: `delivery-tracking`.
- Contours: `mini-app`, `admin-web`.
- Touched layers: frontend `ui/app` polling/read consumers, view models and focused frontend tests.
- Shared extraction: not added and not justified.

## Evidence

- Customer order tracking accepts `PICKED_UP`, `DELAYED`, `COMPLETED`, `order.delayed`, and `order.status_changed` payloads using either `status/previousStatus` or `newStatus/oldStatus`.
- Customer polling applies the v2 chain `PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED` in order and keeps read-only sessions without courier/operator/admin mutation controls.
- Customer terminal states stay closed for `COMPLETED` and `CANCELLED_*`; later progress/regression events are ignored by the consumer state guard.
- Cursor handling remains string-only: `revision` and `next_cursor` are accepted only as strings, and no status/lifecycle data is parsed from cursor values.
- Admin operator read model handles `PICKED_UP`, `DELAYED`, `COMPLETED`, and `CANCELLED_*` statuses; terminal rows expose no follow-up status control, and local `DELIVERED -> COMPLETED` command results close the next action.
- No TASK-FT016-16 implementation change added backend transition logic, offer/claim behavior, timeout evaluator behavior, assignment rules, cancellation/refund behavior, legacy cleanup, shared state-machine extraction, or a broad UI rewrite.

## Commands

- `npm run test:order-tracking:frontend -- --runInBand` - PASS; 4 suites / 23 tests passed.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx --runInBand` - PASS; 3 suites / 23 tests passed.
- `npm run build:frontend` - PASS.
- `git diff --check` - PASS.
- Changed/untracked markdown local link validation - PASS.

## Risks / Notes

- The admin panel still uses the current operator read model and local command-result refresh path rather than a separate admin `/events` stream. This matches the current checked-in admin architecture and passed the required focused admin API/view-model/route verification for this task.
