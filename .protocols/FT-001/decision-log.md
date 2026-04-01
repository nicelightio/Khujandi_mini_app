---
description: Decision log для декомпозиции FT-001 в waves и task cards.
status: active
---
# FT-001 Decision Log

## Decisions

- 2026-03-30: `FT-001` декомпозируется внутри owning `catalog` slice без выделения отдельной seller capability.
- 2026-03-30: Так как runtime code directories еще отсутствуют, foundation wave начинается со spec freeze и slice scaffolding.
- 2026-03-30: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT001-0X`.
- 2026-03-30: Rename/snapshot invariant покрывается в `FT-001` через rename policy и запрет побочных cross-table mutation; полноценная order snapshot integration позже будет естественно пересекаться с `FT-002` implementation.

## Open questions

- Нет blocking-вопросов для декомпозиции `FT-001`.

## Notes

- Первая ready task волна intentionally starts с docs/contract freeze, затем backend/frontend skeleton work.
