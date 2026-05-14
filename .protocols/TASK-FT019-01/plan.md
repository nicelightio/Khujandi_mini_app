---
description: План реализации TASK-FT019-01 Staff persistence/domain baseline.
status: active
---
# TASK-FT019-01 Plan

## Scope

Реализовать только additive persistence/domain baseline, нужный будущим FT-019 Staff panel commands и read models.

## Шаги

1. Добавить explicit staff lifecycle metadata в `AdminAccount` и `User`.
2. Добавить structured lifecycle history и manual rating adjustment tables для operator staff и courier staff.
3. Добавить slice-local domain contracts для будущих operator/courier staff commands и read models.
4. Зафиксировать progress, verification placeholder и handoff artifacts.
5. Запустить `npx prisma validate` и `git diff --check`.

## Non-goals

- Нет API/runtime routes.
- Нет application services или repository implementations.
- Нет admin-web UI.
- Нет password reset behavior.
- Нет metrics/read-model implementation.
- Нет `FAILED` order status.
- Нет shared staff/CRM abstraction.
