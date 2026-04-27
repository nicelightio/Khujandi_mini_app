---
description: Каноническая state model заказа для MVP.
status: active
---
# Order Lifecycle

## Main flow

`CREATED -> ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`

`CREATED` появляется только после successful paid order creation в `checkout-payment`; это customer-visible starting status, но не delivery operation transition.

## Cancellation states

- `CANCELLED_BY_ADMIN`
- `CANCELLED_BY_COURIER_UNAVAILABLE`

## Rules

- Переходы валидируются серверной state machine.
- Невалидный переход возвращает `409 CONFLICT`.
- Каждый валидный переход пишет `order_status_history` и доменное событие.
- Отмена фиксирует причину и инициатора.
- Для отмененного заказа `refund_status` обязан быть явным и не может оставаться неустановленным.
- `NOT_REQUIRED` используется только если отмененный заказ не требует возврата средств.
- Paid cancellation обязан в момент успешной отмены входить в `PENDING_MANUAL`.
- `DONE` и `REJECTED` используются только как результат отдельной ручной refund-обработки после cancellation commit.
- Переход `PENDING_MANUAL -> DONE|REJECTED` должен проверяться атомарно в persistence boundary; stale/concurrent refund update attempts после первого успешного terminal update возвращают `409 CONFLICT` и не создают новых audit/event side effects.
- `refund_note` фиксирует операторский контекст/manual outcome и не меняет order status сам по себе.
- Для `FT-005` post-assignment lifecycle допускает только adjacent courier-driven transitions; skip/replay/regression и попытки уйти из terminal status считаются невалидными и не создают side effects.

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
- Внутри `FT-005` allowed chain фиксирована как `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`; переходы `ASSIGNED -> DELIVERED`, `IN_PROGRESS -> COMPLETED` и любые reverse/replay attempts нарушают state contract и возвращают `409 CONFLICT`.
- Terminal statuses `COMPLETED` и `CANCELLED_*` не имеют исходящих переходов.
- Изменение `refund_status` после отмены не reopen-ит order lifecycle: cancelled order остается terminal по `order.status`, пока manual refund workflow меняет только refund metadata.
- Для MVP нет специфицированных переходов отмены из `DELIVERED`; такие сценарии считаются out of current state contract, пока не появится отдельное уточнение.
- Customer-facing status visibility may display this lifecycle, but customer UI remains read-only and does not own any transition command.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): lifecycle и cancellation rules MVP.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): `409 CONFLICT` и order status endpoints.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): refund_status и order_status_history model.
