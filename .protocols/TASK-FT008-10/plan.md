---
description: План выполнения TASK-FT008-10.
status: active
---
# TASK-FT008-10 Plan

1. Проверить текущий Prisma state и подтвердить отсутствие checked-in rollout artifact для `ReviewDraft`.
2. Добавить минимальный checked-in SQL rollout artifact для materialization `ReviewDraft` без переписывания review runtime.
3. Явно зафиксировать retention/cleanup policy для expired drafts в spec/runbook слое.
4. Синхронизировать backlog/changelog/index и task artifacts.
5. Прогнать targeted verification gates и зафиксировать evidence в protocol/task reports.
