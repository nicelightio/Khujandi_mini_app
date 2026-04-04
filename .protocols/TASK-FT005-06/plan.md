---
description: План выполнения TASK-FT005-06.
status: active
---
# TASK-FT005-06 Plan

1. Добавить slice-level notifier contract и wiring в `delivery-tracking` service/module с duplicate-safe transport-failure handling.
2. Подключить Telegram bot notifier поверх существующего harness так, чтобы transport оставался action/notification only.
3. Доработать frontend polling consumer: ordered apply, cursor/revision dedupe, available-actions derivation, interval/retry-safe polling wiring.
4. Обновить backend/frontend tests только в границах task scope.
5. Выполнить targeted quality gates, затем sync docs/protocols/report.
