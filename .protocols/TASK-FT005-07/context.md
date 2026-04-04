---
description: Контекст выполнения TASK-FT005-07.
status: active
---
# TASK-FT005-07 Context

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
- `.memory-bank/invariants.md`
- `.memory-bank/testing/index.md`

## Loaded prior-task artifacts
- `.tasks/TASK-FT005-04/TASK-FT005-04-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-05/TASK-FT005-05-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-06/TASK-FT005-06-S-IMPL-final-report-code-01.md`

## Scope focus
- Добавить финальный repo-local verification suite для `FT-005` без новых runtime features.
- Покрыть end-to-end chain `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED` и ordered event observation через existing backend/frontend test harness.
- Подтвердить `409 CONFLICT`, history/event generation и duplicate-safe ordered polling без выхода в cancellation scope `FT-006`.
- Не закрывать `REQ-010`: SLA evidence остается отдельной задачей `TASK-FT005-08`.

## Code areas inspected
- `tests/slices/delivery-tracking/**/*`
- `frontend/src/tests/slices/order-tracking/**/*`
- `frontend/src/slices/order-tracking/**/*`
- `backend/src/slices/delivery-tracking/**/*`

## Notes
- MB уже фиксирует, что `TASK-FT005-06` завершил notifier/polling wiring; текущая задача добирает функциональное end-to-end evidence и должна лишь подготовить `TASK-FT005-08` как следующий SLA step.
