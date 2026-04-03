---
description: Handoff notes for TASK-FT004-01.
status: active
---
# TASK-FT004-01 Handoff

## Completed
- Docs-first boundary for `FT-004` is frozen across feature, event baseline, bot contract, implementation plan, backlog, and navigation.

## Ready follow-ups
- `TASK-FT004-02`: scaffold backend `delivery-assignment` slice and persistence/test baseline.
- `TASK-FT004-03`: scaffold admin assignment route shell and frontend test harness.

## Guardrails for next task
- Keep business ownership of `CREATED -> ASSIGNED` inside `delivery-assignment`; do not leak assignment rules into shared transport layers.
- Preserve assignment success side effects together: order state transition, `order_status_history`, audit trail, and `order.assigned` publication.
- Preserve actor-targeted courier notification semantics; bot/runtime retries must not widen notify targets or duplicate domain writes.
