---
description: Feature C4 L3 для ручного назначения курьера администратором.
status: active
---
# FT-004 Courier Assignment

## REQs

- `REQ-007`, `REQ-018`

## Use cases

- Администратор получает новый заказ и вручную назначает курьера.
- Курьер получает назначение через Telegram-бота.

## Acceptance criteria

- Только разрешенная админ-роль может назначать курьера.
- Назначение переводит заказ в `ASSIGNED`.
- Успешный assignment пишет `order_status_history`, публикует событие `order.assigned` и возвращает command-response с актуальными `updated_at` и `revision`.
- `order.assigned` остается семантикой owning slice `delivery-assignment` и не подменяется transport-level bot/runtime деталями.
- Уведомление идет только назначенному курьеру как actor-targeted delivery; broad broadcast для assignment не допускается по умолчанию.
- Assignment write flow использует единый error contract и фиксируется в audit trail.

## Scope boundary

- `FT-004` владеет только переходом `CREATED -> ASSIGNED` и связанным assignment notification.
- Дальнейший delivery lifecycle после `ASSIGNED` принадлежит `FT-005`.

## Edge cases & failure modes

- Нельзя назначить неактивного или недоступного курьера, если такой инвариант реализован в домене.
- Повторное назначение должно быть валидировано по текущему состоянию заказа.

## Normative inputs

- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): event shape, string `revision` contract и единый error shape.
- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md): actor-targeted уведомление назначенному курьеру.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): ownership перехода `CREATED -> ASSIGNED`.
- [.memory-bank/testing/index.md](../testing/index.md): baseline quality gates для assignment flow.

## Test strategy pointers

- e2e: admin assigns courier to created order.
- integration: RBAC and assignment policy.

## Implementation status

- `TASK-FT004-04` closes the backend command path for authenticated admin assignment, `CREATED -> ASSIGNED` validation, `order_status_history`/audit writes, canonical `order.assigned` publication, and repo-local controlled-error coverage.
- `TASK-FT004-05` closes targeted courier notification transport wiring for `order.assigned`, keeping bot delivery actor-targeted and failure-safe without changing assignment domain semantics.
- `TASK-FT004-06` wires the admin-web assignment submit UX to the backend command path, renders controlled success/error feedback, and prevents duplicate submit side effects without pulling `FT-007` auth/session scope into the slice.
- `TASK-FT004-07` closes final repo-local verification and docs sync for `FT-004`: backend/unit integration evidence, admin-web route smoke including the default backend API path, RTM closure for `REQ-007` and the `FT-004` `REQ-018` trace row, and explicit scope separation from `FT-005` and `FT-007`.
