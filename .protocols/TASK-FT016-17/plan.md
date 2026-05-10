---
description: Implementation plan for TASK-FT016-17 legacy direct assignment isolation.
status: active
---
# TASK-FT016-17 Plan

## Steps

1. Mark `TASK-FT016-17` in progress in backlog/run status.
2. Inspect current `assignCourier`, admin runtime routes, admin API/UI and tests to find the normal direct assignment entrypoint.
3. Route normal admin assignment usage to the existing v2 manual offer command.
4. If direct assignment is retained, rename it as override, require confirmation in the request, and persist distinct audit/event metadata.
5. Add focused backend/admin tests:
   - normal path creates an offer and does not directly assign;
   - override path, if retained, requires confirmation and is audited distinctly;
   - existing active assigned orders remain readable through current read model.
6. Run focused checks and `git diff --check`.
7. Update task docs, backlog/run status to `ready_for_verify`, changelog and final report.

## Constraints

- No historical order/audit/event rewrite.
- No `AssignmentOffer` schema change.
- No offer/claim/timeout/auto-offer semantic changes except replacing legacy normal entrypoint usage.
- No pickup/completion, cancellation/refund or broad admin rebuild.
- No shared extraction.
