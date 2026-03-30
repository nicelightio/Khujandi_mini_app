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
- Публикуется событие `order.assigned`.
- Уведомление идет actor-targeted получателю, а не broad broadcast по умолчанию.
- Assignment write flow использует единый error contract и фиксируется в audit trail.

## Scope boundary

- `FT-004` владеет только переходом `CREATED -> ASSIGNED` и связанным assignment notification.
- Дальнейший delivery lifecycle после `ASSIGNED` принадлежит `FT-005`.

## Edge cases & failure modes

- Нельзя назначить неактивного или недоступного курьера, если такой инвариант реализован в домене.
- Повторное назначение должно быть валидировано по текущему состоянию заказа.

## Normative inputs

- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md): actor-targeted уведомление назначенному курьеру.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): ownership перехода `CREATED -> ASSIGNED`.
- [.memory-bank/testing/index.md](../testing/index.md): baseline quality gates для assignment flow.

## Test strategy pointers

- e2e: admin assigns courier to created order.
- integration: RBAC and assignment policy.
