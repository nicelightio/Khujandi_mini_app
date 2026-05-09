---
description: Каноническая state model заказа для MVP.
status: active
---
# Order Lifecycle

## Main flow

`CREATED -> ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`

`CREATED` появляется только после successful paid order creation в `checkout-payment`.

`ASSIGNED` означает, что курьер уже успешно подтвердил/claim-нул заказ. Pending offer конкретному курьеру или broadcast offer всем активным курьерам не переводит order status в `ASSIGNED`.

`DELIVERED` не является финальным успешным закрытием: оператор/admin должен вручную подтвердить и закрыть заказ в `COMPLETED`.

## Problem / cancellation states

- `DELAYED`: заказ требует срочного внимания, потому что курьер не принял pending offer/auto-offer вовремя или заказ завис без курьера.
- `CANCELLED_BY_ADMIN`
- `CANCELLED_BY_COURIER_UNAVAILABLE`

## Rules

- Переходы валидируются серверной state machine.
- Невалидный переход возвращает `409 CONFLICT`.
- Каждый валидный переход пишет `order_status_history` и доменное событие.
- Operator/admin status change требует confirmation UI с предупреждением, что действие попадет в историю.
- Operator/admin comment optional для обычного status change и required для cancellation.
- Отмена фиксирует причину и инициатора.
- Для отмененного заказа `refund_status` обязан быть явным и не может оставаться неустановленным.
- `NOT_REQUIRED` используется только если отмененный заказ не требует возврата средств.
- Paid cancellation обязан в момент успешной отмены входить в `PENDING_MANUAL`.
- `DONE` и `REJECTED` используются только как результат отдельной ручной refund-обработки после cancellation commit.
- Переход `PENDING_MANUAL -> DONE|REJECTED` должен проверяться атомарно в persistence boundary; stale/concurrent refund update attempts после первого успешного terminal update возвращают `409 CONFLICT` и не создают новых audit/event side effects.
- `refund_note` фиксирует операторский контекст/manual outcome и не меняет order status сам по себе.

## Courier offer / claim rules

- Manual assignment и auto-offer создают assignment offer, но не меняют status на `ASSIGNED` до подтверждения курьером.
- Auto-offer MAY fan-out order offer активным свободным курьерам, если настройка панели включена.
- Курьер в боте видит `пытаемся получить заказ...` до ответа сервера.
- Claim должен быть atomic: закрепление возможно только если order still active, `courier_id` пустой, статус допускает claim (`CREATED` или `DELAYED`), courier active/free.
- Первый successful claim выставляет `courier_id`, `ASSIGNED`, `assigned_at`, пишет history/event и возвращает success этому courier.
- Остальные concurrent claim attempts получают controlled already-taken outcome без side effects.
- Если offer не принят за 3 минуты, отправляется повторное уведомление; если еще через 3 минуты не принят, заказ переходит/остается `DELAYED`, operators получают срочный alert, а для персонального offer courier `rating_score` уменьшается на 1.

## Transition ownership matrix

| From | To | Allowed actor | Notes |
|---|---|---|---|
| `CREATED` | `ASSIGNED` | `courier` via atomic claim | claim after manual offer or auto-offer; owned by `delivery-assignment` |
| `DELAYED` | `ASSIGNED` | `courier` via atomic claim | urgent re-offer/manual offer path |
| `CREATED` | `DELAYED` | `system`, `operator`, `admin` | no accepted courier in allowed window / manual escalation |
| `ASSIGNED` | `PICKED_UP` | `courier`, `operator`, `admin` | товар забран из магазина; operator/admin change is audited override/control action |
| `PICKED_UP` | `IN_PROGRESS` | `courier`, `operator`, `admin` | курьер едет к клиенту |
| `IN_PROGRESS` | `DELIVERED` | `courier`, `operator`, `admin` | заказ доставлен, требует operator completion |
| `DELIVERED` | `COMPLETED` | `operator`, `admin` | ручное закрытие оператором; successful KPI point |
| `CREATED` | `CANCELLED_BY_ADMIN` | `operator`, `admin` | операционная отмена |
| `DELAYED` | `CANCELLED_BY_ADMIN` | `operator`, `admin` | операционная отмена проблемного заказа |
| `ASSIGNED` | `CANCELLED_BY_ADMIN` | `operator`, `admin` | операционная отмена |
| `PICKED_UP` | `CANCELLED_BY_ADMIN` | `operator`, `admin` | операционная отмена до delivery completion |
| `IN_PROGRESS` | `CANCELLED_BY_ADMIN` | `operator`, `admin` | операционная отмена до delivery completion |
| `ASSIGNED` | `CANCELLED_BY_COURIER_UNAVAILABLE` | `courier` | unavailable-case |
| `PICKED_UP` | `CANCELLED_BY_COURIER_UNAVAILABLE` | `courier` | unavailable-case |
| `IN_PROGRESS` | `CANCELLED_BY_COURIER_UNAVAILABLE` | `courier` | unavailable-case before delivery completion |

## Boundary notes

- Ownership boundary по features:
  `FT-004` владеет assignment offer/claim semantics and `CREATED|DELAYED -> ASSIGNED`,
  `FT-005` владеет delivery progress lifecycle `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`,
  `FT-006` владеет cancellation transitions и refund tracking semantics,
  `FT-016` задает operator panel, courier availability/auto-offer, delayed alert and cross-contour UX rules.
- Terminal statuses `COMPLETED` и `CANCELLED_*` не имеют исходящих переходов.
- Изменение `refund_status` после отмены не reopen-ит order lifecycle: cancelled order остается terminal по `order.status`, пока manual refund workflow меняет только refund metadata.
- Для MVP нет специфицированных переходов отмены из `DELIVERED`; такие сценарии считаются out of current state contract, пока не появится отдельное уточнение.
- Customer-facing status visibility may display this lifecycle, but customer UI remains read-only and does not own any transition command.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): lifecycle и cancellation rules MVP.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): `409 CONFLICT` и order status endpoints.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): refund_status и order_status_history model.
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md): operator panel, auto-offer and courier claim rules.
