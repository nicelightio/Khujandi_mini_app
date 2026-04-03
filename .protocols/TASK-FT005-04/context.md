---
description: Execution context for TASK-FT005-04.
status: active
---
# TASK-FT005-04 Context

## Task
- TASK-ID: `TASK-FT005-04`
- Title: `Implement courier status command flow with state validation and history/event writes`
- Feature: `FT-005`
- REQs: `REQ-008`, `REQ-018`

## Loaded sources
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/changelog.md`
- `.tasks/TASK-FT005-01/TASK-FT005-01-S-IMPL-final-report-docs-01.md`
- `.tasks/TASK-FT005-02/TASK-FT005-02-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT004-04/TASK-FT004-04-S-IMPL-final-report-code-01.md`

## Code patterns inspected
- `backend/src/slices/delivery-tracking/**/*`
- `tests/slices/delivery-tracking/**/*`
- `backend/src/slices/delivery-assignment/**/*`
- `tests/slices/delivery-assignment/**/*`
- `backend/src/shared/errors/app-error.ts`
- `backend/prisma/schema.prisma`

## Normative inputs found
- `FT-005` owns only courier-driven adjacent transitions `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Invalid transition attempts must return `409 CONFLICT` and must not create order/history/event side effects.
- Valid status writes must stay inside the owning `delivery-tracking` slice and must publish `updated_at` plus string `revision` for polling-friendly follow-up reads.
- Bot/runtime adapters must stay transport-only; actor/state validation belongs to this backend command flow.

## Scope interpretation
- Implement backend command validation for authenticated courier actors only.
- Enforce assigned-courier ownership and adjacent transition checks before persistence.
- Persist successful status writes transactionally with `order_status_history` and `order.status_changed`.
- Keep ordered polling read-path semantics unchanged except for compatibility with the new command metadata.
- Do not implement final `/events` runtime closure, notification fan-out, or SLA verification; those remain with later `FT-005` tasks.
