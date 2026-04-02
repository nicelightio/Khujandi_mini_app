---
description: Feature C4 L3 для state machine заказа, истории статусов и polling событий.
status: active
---
# FT-005 Order Tracking And Events Polling

## REQs

- `REQ-008`, `REQ-009`, `REQ-010`, `REQ-018`

## Use cases

- Курьер подтверждает заказ и ведет доставку через статусы.
- Клиент и админка видят обновления через polling.

## Acceptance criteria

- Поддерживаются переходы `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Сервер отклоняет невалидный переход с `409 CONFLICT`.
- Каждый валидный переход пишет `order_status_history` и доменное событие.
- `GET /events?since=<cursor>` возвращает ordered event stream и строковый `next_cursor`.
- Event payload использует поля `type`, `entity`, `entity_id`, `payload`, `revision`, `created_at`.
- Command-ответы публикуют `updated_at` и `revision`, где это нужно для дешевого polling.
- Решение должно поддерживать целевой polling SLA p95 <= 10 секунд.

## Edge cases & failure modes

- Дубликаты polling-запросов не должны ломать порядок или курсор.
- Невалидный переход не должен менять состояние заказа.
- Ошибки должны использовать единый error contract с `trace_id`.
- Resume после `activated/deactivated` не должен приводить к двойным status fetch/update side effects.

## Constraints / invariants

- Event format остается стабильным для future SSE/WS.

## Scope boundary

- `FT-005` владеет post-assignment lifecycle: `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Переход `CREATED -> ASSIGNED` и событие назначения курьера принадлежат `FT-004`.

## Normative inputs

- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): `/events`, event shape и error contract.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): order lifecycle, transition ownership и terminal states.
- [.memory-bank/testing/index.md](../testing/index.md): quality gates и SLA-sensitive verification.

## Verification targets

- `PATCH /orders/{id}/status`
- `GET /events?since=<cursor>`

## Test strategy pointers

- e2e: courier drives order to `COMPLETED` and UI observes events.
- integration: state machine, history writes, ordered cursor polling.
- verify: SLA evidence on test load.
