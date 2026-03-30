---
description: Практический гайд по следующему шагу после PRD bootstrap.
status: active
---
# PRD Bootstrap Next Steps

## Goal

Перейти от Memory Bank спецификаций к исполнимым задачам без массовой спекулятивной генерации backlog.

## Flow

1. Выбери одну `FT-*` из `.memory-bank/features/index.md`.
2. Запусти `/prd-to-tasks FT-<NNN>`.
3. Проверь, что `tasks/backlog.md` получил task cards только для выбранной feature.
4. Выполняй задачи через `/execute TASK-<ID>` по одной волне.

## Rule

- `/prd` не должен автоматически генерировать TASK-IDs для всех features сразу.
