---
description: Implementation plan for TASK-FT016-07.
status: active
---
# TASK-FT016-07 Plan

## Plan

1. Inspect current delivery-assignment service, domain types, Prisma repository and focused tests.
2. Add minimal slice-owned availability contracts/types without changing offer or assignment semantics.
3. Implement repository persistence for start/stop/toggle/query and busy-order calculation.
4. Expose application service methods with explicit time injection for stop-after cutoff tests.
5. Add focused tests for idempotent transitions, active/free calculation, busy statuses, non-busy status and rating preservation.
6. Run `npm run test:delivery-assignment` and `git diff --check`.
7. Write final implementation report under `.tasks/TASK-FT016-07/`.

## Verification Targets

- Courier active/free/auto-offer participation state is server-owned.
- Busy statuses are exactly `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, and `DELIVERED`.
- Stop-after cutoff is deterministic and time-testable.
- Repeated operations are idempotent where appropriate.
- Availability operations preserve `ratingScore`.

## Out of Scope

- Assignment offer creation or claim.
- Bot menu UI/harness and transport callback parsing.
- Admin UI toggle or global auto-offer setting.
- Auto-offer broadcast/fan-out.
- Timeout/delayed evaluator.
- Order status/history/audit/event side effects.
