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
2. Проверить order context, сторону отзыва и то, что alert привязан к уникальному persisted review после `COMPLETED`.
3. Эскалировать активным администраторам через Telegram-бота.
4. Не выполнять повторную manual escalation для duplicate доставки того же negative review сигнала.
5. Зафиксировать операционную реакцию в соответствующем интерфейсе/логе.

## Verification boundary for negative alerts

- `TASK-FT008-01` фиксирует docs-first boundary: `COMPLETED` gate, structured review payload, duplicate/noise handling и active-admin fan-out semantics.
- `TASK-FT008-05` закрывает runtime publication/dispatch `review.negative` без расширения scope в admin auth/session.
- `TASK-FT008-07` закрыл final repo-local evidence sync для two-sided reviews, duplicate-safe negative alert flow и RTM closure `REQ-013` / `REQ-014`.
- `TASK-FT008-09` делает review-draft runtime guarantee явной: active bot draft хранится durably `1 hour`; restart/redeploy/shared-DB multi-instance hops не должны ломать следующий шаг review flow, а после TTL оператор ожидает controlled restart flow вместо implicit fragility.
- `TASK-FT008-10` закрывает operational assumptions: `ReviewDraft` rollout materialized checked-in Prisma SQL artifact, а expired rows считаются semantically dead после `expiresAt` и могут удаляться без влияния на review/result semantics.

## Review draft rollout and retention

1. Перед deploy review-draft-backed bot flow применить checked-in SQL artifact `backend/prisma/migrations/20260406153000_add_review_draft_table/migration.sql` к runtime PostgreSQL schema.
2. Убедиться, что deploy pipeline регенерирует Prisma client для актуального `backend/prisma/schema.prisma`.
3. Считать любой `ReviewDraft` с `expiresAt <= now()` просроченным и невалидным для дальнейших bot steps; runtime уже fail-close'ится как `missing_draft` и требует нового `startFlow`.
4. Cleanup expired drafts допустим в любой maintenance window командой `DELETE FROM "ReviewDraft" WHERE "expiresAt" <= NOW();`.
5. Этот cleanup не требует дополнительных domain compensations: финальный review уже защищен idempotent submit path, а непройденный draft после TTL считается abandoned draft, а не активным бизнес-объектом.

## Abuse and noise handling

1. Если alert выглядит spoofed, duplicate или noisy, проверить trace/log context и источник ingress события.
2. Не выполнять manual escalation повторно, пока не подтверждена уникальность и легитимность сигнала.
3. Зафиксировать suspected abuse/noise в операционном логе и при необходимости временно ограничить downstream fan-out по run-time policy.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): обязательность manual refund и negative alerts.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): runtime bot behavior и alert semantics.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): refund_status/refund_note и review/event data model.
