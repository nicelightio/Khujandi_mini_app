---
description: Execution plan for TASK-FT005-01.
status: active
---
# TASK-FT005-01 Plan

## Goal
- Freeze `FT-005` delivery-tracking semantics so backend/frontend implementation tasks build against an explicit state machine, polling cursor contract, and SLA verification boundary.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-005`
- `IMPL-FT-005`
- `requirements.md`
- `EP-002`
- `api-events-baseline`
- `order-lifecycle`
- `events-polling-and-bot-runtime`
- `testing/index.md`
- `invariants.md`
- `data-boundaries-and-persistence`

## Planned changes
1. Tighten `FT-005` acceptance and constraints around courier-owned adjacent transitions, `409 CONFLICT`, string `revision`, and opaque cursor semantics.
2. Tighten shared contracts/state docs so `/events` and lifecycle rules stay aligned on ordered polling, empty-window/duplicate-safe reads, and no-side-effect invalid transitions.
3. Tighten `testing/index.md` and `IMPL-FT-005` so functional verification and final `REQ-010` SLA closure ownership stay explicit.
4. Sync backlog, changelog, index, protocol artifacts, and docs-only implementation report for downstream scaffold tasks.

## Verification targets
- Confirm `FT-005` owns only `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED` and keeps assignment/cancellation outside scope.
- Confirm invalid post-assignment transitions are explicitly `409 CONFLICT` with no state/history/event side effects.
- Confirm `/events?since=<cursor>` keeps ordered events plus string-only opaque `since`/`revision`/`next_cursor` semantics and duplicate-safe reads.
- Confirm `REQ-010` ownership stays with explicit SLA evidence in the final `FT-005` verify wave, not with docs-only or scaffold tasks.
- Confirm backlog/changelog/index reflect docs-first completion and unlock `TASK-FT005-02` and `TASK-FT005-03`.

## Quality gates
- Doc-level traceability review against `REQ-008`, `REQ-009`, `REQ-010`, and `REQ-018`
- Link/navigation consistency across touched Memory Bank docs

## Non-goals
- No backend `delivery-tracking` slice scaffold
- No frontend polling consumer scaffold
- No runtime tests or latency measurements
