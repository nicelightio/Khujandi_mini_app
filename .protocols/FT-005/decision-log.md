---
description: Decision log для декомпозиции FT-005 в waves и task cards.
status: active
---
# FT-005 Decision Log

## Decisions

- 2026-04-02: `FT-005` декомпозируется как owning `delivery-tracking` slice для post-assignment lifecycle, `order_status_history` и `events` polling semantics.
- 2026-04-02: Первая wave начинается с docs freeze, потому что feature acceptance требует явно зафиксировать status ownership, `409 CONFLICT`, ordered cursor contract и SLA verification boundaries до runtime implementation.
- 2026-04-02: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT005-0X`.
- 2026-04-02: Notification semantics для status progression опираются на существующий bot contract, но transport/runtime слой не получает ownership бизнес-правил state machine.
- 2026-04-02: SLA evidence выносится в отдельную verify/polish task, чтобы не смешивать измерение latency с базовой корректностью state transitions.

## Open questions

- Нужен ли для MVP отдельный lightweight read model для polling consumers, либо ordered stream можно закрыть поверх общего `events` contour без дополнительной проекции.
- Какие конкретные test-load параметры считать достаточными для `REQ-010`, если production-like traffic simulator еще не оформлен в отдельный runbook.

## Notes

- `REQ-018` входит в decomposition scope через status command error contract и audit/event generation, а cancellation-specific audit semantics остаются у `FT-006`.
