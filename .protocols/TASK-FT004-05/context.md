---
description: Execution context for TASK-FT004-05 targeted courier notification integration.
status: active
---
# TASK-FT004-05 Context

## Scope
- Implement only targeted courier notification integration for `order.assigned` within `FT-004`.
- Preserve `delivery-assignment` ownership of assignment business rules and `CREATED -> ASSIGNED` semantics.
- Ensure retry or duplicate transport delivery does not create duplicate assignment side effects.

## Loaded docs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT004-05` card)
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/tasks/plans/IMPL-FT-004.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.tasks/TASK-FT004-01/TASK-FT004-01-S-IMPL-final-report-docs-01.md`
- `.tasks/TASK-FT004-02/TASK-FT004-02-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT004-04/TASK-FT004-04-S-IMPL-final-report-code-01.md`

## Richer inputs found
- Backlog card defines touched files, verify target, and constraints for notification integration.
- `telegram-bot-contract.md` defines actor-targeted delivery and duplicate-safe transport semantics.
- `events-polling-and-bot-runtime.md` states transport/runtime must not own slice business rules.

## Code inspection scope
- `backend/src/slices/delivery-assignment/**/*`
- `tests/slices/delivery-assignment/**/*`
- No existing `backend/src/integrations/telegram-bot/**/*` implementation was present at task start.

## Notes
- Worktree already contains unrelated prior FT-004 changes; they are left intact.
- Current implementation already persists canonical `order.assigned` inside `delivery-assignment`; this task should attach transport dispatch after successful assignment without altering domain validation.
