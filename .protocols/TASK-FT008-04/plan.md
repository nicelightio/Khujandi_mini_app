---
description: План выполнения TASK-FT008-04.
status: active
---
# TASK-FT008-04 Plan

1. Добавить domain/application contracts для submit review command и duplicate-safe result.
2. Реализовать service-level validation: auth, actor/direction ownership, `COMPLETED` gate, `rating/reason_code/comment` normalization.
3. Расширить Prisma repository duplicate-safe persistence через unique pair lookup/fallback.
4. Добавить unit/integration coverage для reject/persist/replay paths.
5. Прогнать доступные quality gates для `reviews-feedback`, затем выполнить MB sync и task artifacts.
