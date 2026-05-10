---
description: Implementation plan for TASK-FT016-15-FIX manager role normalization.
status: active
---
# TASK-FT016-15-FIX Plan

1. Inspect the admin operator status runtime route, admin-access role type, delivery-tracking service actor role type, and focused runtime tests.
2. Add the narrow role/capability normalization at the route boundary, mapping `manager -> operator` and preserving `admin`.
3. Add focused runtime coverage for an authenticated `manager` closing `DELIVERED -> COMPLETED`.
4. Run focused delivery-tracking/runtime checks and `git diff --check`.
5. Update task protocol docs, backlog/status/changelog, and write the implementation report for verifier handoff.

## Acceptance Criteria

- `manager` from admin-access can execute the allowed `DELIVERED -> COMPLETED` operator status command.
- `admin` remains admin-capable for the same command.
- Non-operator roles remain rejected.
- Invalid transitions still return `409 CONFLICT` without status/history/event side effects.
- No lifecycle, assignment, cancellation/refund, timeout, auto-offer or broad RBAC behavior is changed.
