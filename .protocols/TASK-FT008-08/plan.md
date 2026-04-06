---
description: План выполнения TASK-FT008-08.
status: active
---
# TASK-FT008-08 Plan

1. Добавить revision identity в callback payload review stepper-а.
2. Хранить ожидаемые `stage + revision` в draft state и отклонять stale callbacks как `ignored` без мутации draft.
3. Обновить unit/integration tests на новый payload формат и stale replay scenarios.
4. Прогнать targeted review specs и зафиксировать evidence.
5. Синхронизировать task protocol и Memory Bank changelog/bug notes по факту завершения.
