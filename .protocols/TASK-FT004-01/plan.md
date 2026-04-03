---
description: Execution plan for TASK-FT004-01.
status: active
---
# TASK-FT004-01 Plan

## Goal
- Freeze courier-assignment boundary and event/notification semantics so `FT-004` implementation tasks build against an explicit normative layer.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-004`
- `IMPL-FT-004`
- `requirements.md`
- `EP-002`
- `telegram-bot-contract`
- `api-events-baseline`
- `order-lifecycle`
- `invariants.md`
- `system-contours-and-slices`
- `events-polling-and-bot-runtime`
- `data-boundaries-and-persistence`
- `testing/index.md`

## Planned changes
1. Tighten `FT-004` acceptance so assignment explicitly covers `order_status_history`, `order.assigned`, targeted notification, and command-response sync fields.
2. Tighten shared contracts so bot delivery and event baseline preserve owning-slice semantics without broad broadcast drift.
3. Sync `IMPL-FT-004`, backlog status, changelog, and Memory Bank navigation for the next implementation wave.
4. Record protocol and docs-only implementation artifacts for formal verification.

## Verification targets
- Confirm `CREATED -> ASSIGNED` ownership remains explicit and isolated from `FT-005`.
- Confirm `order.assigned` publication semantics, string `revision`, `updated_at`, and unified error contract are explicit across feature/plan/contracts.
- Confirm assignment notification is actor-targeted to the assigned courier and not broad broadcast by default.
- Confirm backlog/changelog/index reflect docs-first completion and unlock `TASK-FT004-02` and `TASK-FT004-03`.

## Quality gates
- Doc-level traceability review against `REQ-007` and `REQ-018`
- Link/navigation consistency across touched Memory Bank docs

## Non-goals
- No backend slice scaffold
- No frontend admin route scaffold
- No runtime tests or bot transport implementation
