---
description: План декомпозиции FT-005 в implementation plan и execution-ready backlog.
status: active
---
# FT-005 Decomposition Plan

## Goal

- Разложить `FT-005` на атомарные implementation tasks для post-assignment state machine, ordered event polling и SLA-sensitive verify контура без смешения со scope `FT-004` и `FT-006`.

## Inputs used

- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../../.memory-bank/features/FT-005-order-tracking-and-events-polling.md): owning feature spec, acceptance criteria и verification targets.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../.memory-bank/epics/EP-002-delivery-operations.md): parent epic и delivery operations outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-008`, `REQ-009`, `REQ-010`, `REQ-018` и RTM.
- [.memory-bank/contracts/api-events-baseline.md](../../.memory-bank/contracts/api-events-baseline.md): event shape, string cursor contract и error shape.
- [.memory-bank/contracts/telegram-bot-contract.md](../../.memory-bank/contracts/telegram-bot-contract.md): courier-driven bot action baseline и `order.status_changed` notification rule.
- [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md): ownership переходов `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../.memory-bank/architecture/events-polling-and-bot-runtime.md): shared event transport, polling semantics и duplicate-safe delivery rules.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): ownership `order_status_history` и `events.payload`.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): status-machine, polling и SLA verification baseline.

## Current repository state

- `FT-004` уже декомпозирован как предшествующий delivery step для `CREATED -> ASSIGNED`, но post-assignment lifecycle и polling backlog еще не зафиксированы.
- В normative layer уже есть contracts/states для events и lifecycle, поэтому foundation wave `FT-005` начинается с docs freeze state-machine ownership, polling response shape и SLA verification ownership.
- `FT-005` должен переиспользовать shared `events`/bot runtime boundary и не переносить cancellation semantics, которые остаются в `FT-006`.

## Decomposition strategy

1. W1: зафиксировать docs-first boundaries для state transitions, event stream shape и SLA verification; поднять backend/runtime scaffold.
2. W2: реализовать status command flow, `order_status_history`, ordered event publication/polling и duplicate-safe cursor handling.
3. W3: подключить courier/admin/customer polling consumers, собрать end-to-end verification и отдельный SLA evidence bundle.

## Constraints

- `FT-005` владеет только переходами `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED`.
- Невалидный переход обязан возвращать `409 CONFLICT` без side effects.
- Каждый валидный переход обязан писать `order_status_history` и доменное событие.
- `GET /events?since=<cursor>` обязан возвращать ordered events и строковый `next_cursor`.
- Event format должен оставаться стабильным для future SSE/WS.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- backlog section с `TASK-FT005-*`
- execution-ready W1 task для старта docs/spec freeze по delivery tracking и polling
