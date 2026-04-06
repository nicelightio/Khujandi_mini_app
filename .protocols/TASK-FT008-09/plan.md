---
description: План выполнения TASK-FT008-09.
status: active
---
# TASK-FT008-09 Plan

1. Убрать implicit process-local draft assumption и выбрать durable runtime guarantee.
2. Добавить slice-owned persistence для review drafts с явным TTL и без размывания owning submit path.
3. Обновить bot flow так, чтобы callback/comment шаги переживали restart/shared-DB multi-instance hop в пределах TTL.
4. Обновить repo-local unit/integration coverage на durable draft semantics и duplicate-safe final submit.
5. Синхронизировать Memory Bank, verification evidence и task artifacts.
