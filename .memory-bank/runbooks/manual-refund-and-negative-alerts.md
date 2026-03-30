---
description: Операционный runbook для ручного refund workflow и обработки негативных отзывов.
status: active
---
# Manual Refund And Negative Alerts

## Manual refund

1. Зафиксировать отмену заказа с причиной и инициатором.
2. Перевести `refund_status` в `PENDING_MANUAL`.
3. После ручной обработки обновить статус на `DONE` или `REJECTED` и сохранить `refund_note`.
4. Убедиться, что действие попало в аудит.

## Negative review alert

1. Получить событие `review.negative`.
2. Проверить order context и сторону отзыва.
3. Эскалировать активным администраторам через Telegram-бота.
4. Зафиксировать операционную реакцию в соответствующем интерфейсе/логе.

## Abuse and noise handling

1. Если alert выглядит spoofed, duplicate или noisy, проверить trace/log context и источник ingress события.
2. Не выполнять manual escalation повторно, пока не подтверждена уникальность и легитимность сигнала.
3. Зафиксировать suspected abuse/noise в операционном логе и при необходимости временно ограничить downstream fan-out по run-time policy.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): обязательность manual refund и negative alerts.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): runtime bot behavior и alert semantics.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): refund_status/refund_note и review/event data model.
