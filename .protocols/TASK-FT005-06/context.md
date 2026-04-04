---
description: Контекст выполнения TASK-FT005-06.
status: active
---
# TASK-FT005-06 Context

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/invariants.md`
- `.memory-bank/testing/index.md`

## Loaded prior-task artifacts
- `.tasks/TASK-FT005-03/TASK-FT005-03-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-04/TASK-FT005-04-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-05/TASK-FT005-05-S-IMPL-final-report-code-01.md`

## Scope focus
- Подключить `order.status_changed` bot notification без переноса transition business rules в transport layer.
- Подключить frontend polling consumer к ordered event stream так, чтобы resume/retry не дублировал write-side effects и повторные revisions не давали двойного UI apply.
- Не закрывать финальный `REQ-010` SLA evidence и не заходить в cancellation/review/admin-auth scope.

## Code areas inspected
- `backend/src/slices/delivery-tracking/**/*`
- `backend/src/integrations/telegram-bot/**/*`
- `frontend/src/slices/order-tracking/**/*`
- `tests/slices/delivery-tracking/**/*`
- `frontend/src/tests/slices/order-tracking/**/*`

## Notes
- Backlog уже содержит `TASK-FT005-06: in_progress`; в worktree есть внешние изменения в `.memory-bank/tasks/backlog.md` и `.protocols/AUTONOMOUS-RUN/status.md`, их не трогаю вне необходимого task scope.
