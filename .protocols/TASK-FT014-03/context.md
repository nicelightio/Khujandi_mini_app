---
description: Execution context for TASK-FT014-03 opaque-cursor customer polling consumer.
status: active
---
# TASK-FT014-03 Context

## Loaded Sources
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/tasks/plans/IMPL-FT-014.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`

## Richer Inputs
- Found task card fields: `Normative Inputs`, `Invariants`, `Tests`, `Verify`, `Docs`, `Touched files`, `Depends on`.
- Fallback: feature + requirements + architecture + contract/state docs for behavior boundaries.

## Boundary Check
- Owning capability slice: `delivery-tracking`.
- Owning contour: `mini-app` customer read surface.
- Touched layers: `presentation` and `application` read/polling consumer.
- Shared extraction: not justified. The consumer uses the existing `FT-005`/`api-events-baseline` contract locally; no new shared business logic should be introduced.

## Invariants
- `since`, `revision`, and `next_cursor`/`nextCursor` remain opaque strings on the API boundary.
- Customer status visibility is read-only and must not introduce courier/admin lifecycle commands.
- Empty polling windows are stable and are not errors.
- Duplicate polling/events must not double-render status changes.
