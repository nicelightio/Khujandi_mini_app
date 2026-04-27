---
description: Execution plan for TASK-FT014-03 opaque-cursor customer polling consumer.
status: active
---
# TASK-FT014-03 Plan

## Scope
- Wire customer order status polling to the existing `GET /events?since=<cursor>` contract.
- Preserve opaque string cursor/revision handling.
- Add focused frontend coverage for empty windows, ordered events, duplicate events, stable cursor handling and no numeric cursor parsing.

## Steps
1. Inspect current `frontend/src/slices/delivery-tracking` implementation and tests.
2. Reuse existing frontend/shared request or polling primitives where already present; avoid new shared abstractions.
3. Implement the narrow polling consumer in the customer tracking read surface.
4. Add or update focused tests under `frontend/src/tests/slices/delivery-tracking`.
5. Run focused tests plus relevant frontend gates.
6. Sync Memory Bank docs, protocol verification and handoff artifacts.

## Acceptance Basis
- Task card `TASK-FT014-03`.
- `FT-014` acceptance criteria for consuming `FT-005` polling contract.
- `api-events-baseline` string-only opaque cursor contract.
- `FT-005` duplicate-safe empty-window polling behavior.
