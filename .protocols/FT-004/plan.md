---
description: План декомпозиции FT-004 в implementation plan и execution-ready backlog.
status: active
---
# FT-004 Decomposition Plan

## Goal

- Разложить `FT-004` на атомарные implementation tasks для ручного назначения курьера, перевода заказа в `ASSIGNED`, публикации `order.assigned` и actor-targeted Telegram-уведомления.

## Inputs used

- [.memory-bank/features/FT-004-courier-assignment.md](../../.memory-bank/features/FT-004-courier-assignment.md): owning feature spec и acceptance criteria.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../.memory-bank/epics/EP-002-delivery-operations.md): parent epic и операционный outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-007`, `REQ-018` и RTM.
- [.memory-bank/contracts/api-events-baseline.md](../../.memory-bank/contracts/api-events-baseline.md): command/event shape и единый error contract.
- [.memory-bank/contracts/telegram-bot-contract.md](../../.memory-bank/contracts/telegram-bot-contract.md): actor-targeted правило для `order.assigned`.
- [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md): ownership перехода `CREATED -> ASSIGNED`.
- [.memory-bank/architecture/system-contours-and-slices.md](../../.memory-bank/architecture/system-contours-and-slices.md): slice boundaries для `delivery-assignment` и `admin-web`.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../.memory-bank/architecture/events-polling-and-bot-runtime.md): event publication и bot runtime boundary.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): ownership `orders` и `order_status_history`.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): verification baseline для assignment flow.

## Current repository state

- Customer-facing slices `catalog`, `checkout-payment`, `localization` и shell baseline уже декомпозированы, а delivery operations еще не разложены в execution-ready waves.
- Для `FT-004` пока нет зафиксированного implementation plan/backlog section, поэтому foundation wave начинается с docs freeze assignment boundary и verification ownership.
- `admin-access` как отдельная capability остается в `FT-007`, поэтому decomposition для `FT-004` должна переиспользовать admin auth/RBAC boundary без переноса login/session scope в `delivery-assignment`.

## Decomposition strategy

1. W1: зафиксировать docs-first boundaries для assignment, event/audit semantics и actor-targeted bot notification, затем поднять backend/frontend scaffolding.
2. W2: реализовать backend assignment command, RBAC/state validation, `ASSIGNED` transition, audit/event publication и targeted courier notification.
3. W3: подключить admin-web assignment UX, собрать integration/e2e verification и синхронизировать docs/RTM без смешения со scope `FT-005` и `FT-007`.

## Constraints

- `FT-004` владеет только переходом `CREATED -> ASSIGNED`; дальнейшие status transitions остаются в `FT-005`.
- Назначение проходит через auth + RBAC и не обходит server-side state machine.
- `order.assigned` публикуется только после успешной write-operation.
- Уведомление для назначения идет actor-targeted курьеру, без broad broadcast по умолчанию.
- Error contract и audit trail обязательны для assignment write flow.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-004.md`
- backlog section с `TASK-FT004-*`
- execution-ready W1 task для старта docs/spec freeze по courier assignment
