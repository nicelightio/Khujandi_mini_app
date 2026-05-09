---
description: Epic C4 L2 для операционного delivery flow: assignment, tracking, polling, cancellation.
status: active
---
# EP-002 Delivery Operations

## Value

Сделать операционный delivery flow предсказуемым, управляемым и наблюдаемым без ручной координации в чатах.

## Included features

- `FT-004` courier assignment
- `FT-005` order tracking and events polling
- `FT-006` operational cancellation and manual refund tracking
- `FT-016` operator orders monitoring, courier availability and auto-offer

## Success metrics

- Operator/admin вручную инициирует назначение без обхода RBAC, но `ASSIGNED` ставится только после courier claim.
- Auto-offer без Redis/очередей предлагает заказ активным свободным курьерам и закрепляет первого successful claimant.
- Все валидные переходы статусов отражаются в истории и событиях.
- Polling SLA p95 <= 10 секунд подтверждается на MVP-нагрузке.
- Отмена и ручной refund прозрачно фиксируются в заказе и аудите.

## Acceptance criteria

- Courier claim переводит заказ в `ASSIGNED`; pending offers сами по себе не меняют order status на `ASSIGNED`.
- Курьер проводит заказ через серверно-разрешенные переходы до `DELIVERED`; operator/admin закрывает `DELIVERED -> COMPLETED`.
- `GET /events?since=<cursor>` возвращает упорядоченные события и `next_cursor` строкой.
- Отмена доступна только разрешенным ролям и фиксирует причину, инициатора и refund state.

## Constraints / invariants

- Клиент не отменяет заказ.
- Нет broad broadcast по умолчанию, кроме explicit auto-offer fan-out активным свободным курьерам.
- Event format должен оставаться совместимым для future SSE/WS.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): delivery lifecycle, cancellation and SLA.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): delivery slices and contour placement.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): status, cancel and events endpoints.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): orders, history, events and refund fields.
