---
description: Каноническая state model заказа для MVP.
status: active
---
# Order Lifecycle

## Main flow

`CREATED -> ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`

## Cancellation states

- `CANCELLED_BY_ADMIN`
- `CANCELLED_BY_COURIER_UNAVAILABLE`

## Rules

- Переходы валидируются серверной state machine.
- Невалидный переход возвращает `409 CONFLICT`.
- Каждый валидный переход пишет `order_status_history` и доменное событие.
- Отмена фиксирует причину и инициатора.
- Для paid-cancel case должен быть отражен `refund_status`: `NOT_REQUIRED`, `PENDING_MANUAL`, `DONE`, `REJECTED`.

## Transition ownership matrix

| From | To | Allowed actor | Notes |
|---|---|---|---|
| `CREATED` | `ASSIGNED` | `admin` | ручное назначение курьера |
| `ASSIGNED` | `IN_PROGRESS` | `courier` | курьер принял заказ |
| `IN_PROGRESS` | `DELIVERED` | `courier` | заказ доставлен |
| `DELIVERED` | `COMPLETED` | `courier` | delivery flow завершен |
| `CREATED` | `CANCELLED_BY_ADMIN` | `admin` | операционная отмена |
| `ASSIGNED` | `CANCELLED_BY_ADMIN` | `admin` | операционная отмена |
| `IN_PROGRESS` | `CANCELLED_BY_ADMIN` | `admin` | операционная отмена до terminal completion |
| `ASSIGNED` | `CANCELLED_BY_COURIER_UNAVAILABLE` | `courier` | unavailable-case |
| `IN_PROGRESS` | `CANCELLED_BY_COURIER_UNAVAILABLE` | `courier` | unavailable-case до delivery completion |

## Boundary notes

- Ownership boundary по features:
  `FT-004` владеет `CREATED -> ASSIGNED`,
  `FT-005` владеет `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`,
  `FT-006` владеет cancellation transitions и refund tracking semantics.
- Terminal statuses `COMPLETED` и `CANCELLED_*` не имеют исходящих переходов.
- Для MVP нет специфицированных переходов отмены из `DELIVERED`; такие сценарии считаются out of current state contract, пока не появится отдельное уточнение.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): lifecycle и cancellation rules MVP.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): `409 CONFLICT` и order status endpoints.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): refund_status и order_status_history model.
