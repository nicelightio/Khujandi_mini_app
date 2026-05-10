---
description: Execution plan for TASK-FT016-13-FIX.
status: active
---
# TASK-FT016-13-FIX Plan

## Steps

1. Mark active task/run state as `in_progress`.
2. Update the order-tracking parser to accept `order.delayed`.
3. Normalize delayed event payload fields from `newStatus`/`oldStatus` to canonical `status`/`previousStatus`.
4. Add focused parser and open-route polling coverage for the real delayed event shape.
5. Update task/run docs and final implementation report.
6. Run `npm run test:order-tracking:frontend -- --runInBand` and `git diff --check`.

## Acceptance Checks

- `order.delayed` events survive `parseOrderTrackingPollResult`.
- `payload.newStatus=DELAYED` becomes customer-visible status `DELAYED`.
- `payload.oldStatus=CREATED` becomes `previousStatus=CREATED`.
- An already-open read-only customer tracking screen renders `DELAYED` waiting/problem copy after polling.
- No mutation controls or admin/courier operations are introduced.
