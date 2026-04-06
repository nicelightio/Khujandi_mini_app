---
description: План выполнения TASK-FT008-05.
status: active
---
# TASK-FT008-05 Plan

1. Добавить contracts для active-admin resolution и negative-alert notifier в `reviews-feedback` slice.
2. Расширить Prisma repository: low-rating path пишет `review.negative` рядом с `review.created`, а также умеет читать активных администраторов.
3. Реализовать service-level non-blocking fan-out к Telegram notifier только для уникально созданного negative review.
4. Добавить repo-local unit/integration coverage для low-rating publication, admin targeting и replay no-op.
5. Прогнать quality gates, затем выполнить MB sync и task artifacts.
