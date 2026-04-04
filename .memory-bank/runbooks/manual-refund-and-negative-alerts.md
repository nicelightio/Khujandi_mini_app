---
description: Операционный runbook для ручного refund workflow и обработки негативных отзывов.
status: active
---
# Manual Refund And Negative Alerts

## Manual refund

1. Зафиксировать отмену заказа с причиной и инициатором.
2. Если возврат не требуется, зафиксировать `refund_status = NOT_REQUIRED` и не открывать manual refund workflow.
3. Если заказ оплачен и возврат требуется, в момент успешной отмены зафиксировать `refund_status = PENDING_MANUAL`.
4. После ручной обработки обновить статус на `DONE` или `REJECTED` и сохранить `refund_note` как итог/manual outcome.
5. Убедиться, что cancellation и refund action попали в аудит и остаются видимыми оператору.

## Verification boundary

- Docs-first freeze для allowed-role cancellation, refund-state semantics и verify routing выполняется в `TASK-FT006-01`.
- Repo-local functional verification по cancellation authorization, forbidden attempts и visible refund-state presence выполняется в `TASK-FT006-07`.
- Финальная operator evidence sync для manual refund lifecycle (`PENDING_MANUAL -> DONE/REJECTED`) закрыта в `TASK-FT006-08`.

## Closure evidence

- Repo-local backend evidence подтверждает, что paid cancellation сразу фиксирует `refund_status = PENDING_MANUAL`, а затем manual refund update завершает workflow только в `DONE` или `REJECTED` с сохранением `refund_note` и canonical `order.refund_updated` audit/event writes.
- Repo-local admin smoke evidence подтверждает, что операторский UI удерживает явный `refund_status` и итоговый `refund_note` видимыми от отмены до final manual refund outcome.
- RTM closure для `REQ-012` и `REQ-018` (`FT-006`) допустима только вместе с этими evidence sources и итоговым sync-отчетом `TASK-FT006-08`.

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
