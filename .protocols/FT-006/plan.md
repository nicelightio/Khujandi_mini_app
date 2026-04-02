---
description: План декомпозиции FT-006 в implementation plan и execution-ready backlog.
status: active
---
# FT-006 Decomposition Plan

## Goal

- Разложить `FT-006` на атомарные implementation tasks для разрешенной операционной отмены заказа, явного manual refund tracking и audit/event semantics без смешения со scope `FT-004` и `FT-005`.

## Inputs used

- [.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md](../../.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md): owning feature spec, acceptance criteria и edge cases.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../.memory-bank/epics/EP-002-delivery-operations.md): parent epic и delivery operations outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-011`, `REQ-012`, `REQ-018` и RTM.
- [.memory-bank/contracts/api-events-baseline.md](../../.memory-bank/contracts/api-events-baseline.md): error shape и command response baseline.
- [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md): cancellation states, allowed actors и refund_status boundary.
- [.memory-bank/runbooks/manual-refund-and-negative-alerts.md](../../.memory-bank/runbooks/manual-refund-and-negative-alerts.md): operational manual refund procedure.
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../../.memory-bank/architecture/events-polling-and-bot-runtime.md): event publication/runtime constraints.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): ownership `refund_status`, `refund_note` и cancellation persistence.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): cancellation/refund verification baseline.

## Current repository state

- `FT-004` и `FT-005` уже декомпозированы как preceding delivery operations steps, но cancellation/refund branch пока не разложена в execution-ready backlog.
- В normative layer уже есть state/runbook guidance для cancellation и manual refund, поэтому foundation wave `FT-006` начинается с docs freeze policy ownership, allowed actors и refund-state semantics.
- `FT-006` должен переиспользовать existing event/error boundaries и не создавать auto-refund contour, который остается вне MVP scope.

## Decomposition strategy

1. W1: зафиксировать docs-first cancellation policy, refund state semantics и verify ownership; поднять backend/admin scaffolding.
2. W2: реализовать cancellation command flow, allowed-role/state validation, refund tracking persistence и audit/event publication.
3. W3: подключить operator UX, собрать end-to-end cancellation evidence и финальный manual-refund verification bundle.

## Constraints

- Клиент не может инициировать отмену.
- `admin` и `courier` могут отменять заказ только в явно разрешенных state/policy cases.
- Paid cancellation не может оставаться без видимого `refund_status`.
- Refund в MVP ручной; online auto-refund не входит в scope.
- Cancellation write flow обязан использовать единый error contract и порождать audit/event side effects.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- backlog section с `TASK-FT006-*`
- execution-ready W1 task для старта docs/spec freeze по cancellation и refund tracking
