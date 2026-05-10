---
description: Implementation plan for TASK-FT016-15 operator/admin status control.
status: active
---
# TASK-FT016-15 Plan

1. Inspect current delivery-tracking service/repository/runtime/admin operator panel implementation and focused tests.
2. Add backend operator/admin status command that accepts only the current state's allowed next transition for that actor.
3. Mount the command in the admin operator dev-runtime route and ensure invalid attempts return `409` without history/event side effects.
4. Extend operator read model/history formatting with actor role/name if missing.
5. Wire admin-web API/model/UI confirmation action for allowed status control, especially `DELIVERED -> COMPLETED`.
6. Add focused backend/runtime/admin tests, including courier cannot complete regression.
7. Update task docs/backlog/status/changelog and run focused checks plus `git diff --check`.

## Acceptance Criteria

- Operator/admin can close `DELIVERED -> COMPLETED`.
- Operator/admin status command rejects skips, regressions, replay and terminal attempts.
- Courier `DELIVERED -> COMPLETED` remains rejected.
- Valid status command writes history/event/revision after persistence.
- Operator panel requires confirmation before invoking status change.
- History/read model exposes actor role/name.
- Existing active orders remain readable/operational.
