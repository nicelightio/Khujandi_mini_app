---
description: Decision log для декомпозиции FT-006 в waves и task cards.
status: active
---
# FT-006 Decision Log

## Decisions

- 2026-04-02: `FT-006` декомпозируется как owning `order-cancellation` slice для cancellation transitions, cancellation reason/actor persistence и manual refund tracking semantics.
- 2026-04-02: Первая wave начинается с docs freeze, потому что feature acceptance требует явно зафиксировать allowed-role cancellation policy, refund visibility и audit/error semantics до runtime implementation.
- 2026-04-02: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT006-0X`.
- 2026-04-02: Manual refund tracking выделяется в отдельную core task после базовой cancellation command logic, чтобы не смешивать state transition correctness с post-cancel operator workflow.
- 2026-04-02: Verification baseline для `FT-006` включает не только cancellation authorization checks, но и явную проверку того, что paid-cancel case не остается без `refund_status` и audit trail.

## Open questions

- Нужен ли отдельный operator action для смены `refund_status` с `PENDING_MANUAL` на `DONE/REJECTED` в рамках `FT-006`, либо initial MVP closure ограничится фиксацией baseline state и note persistence hooks.
- Нужно ли публиковать отдельный refund-specific event type поверх cancellation event semantics, или достаточно cancellation event payload с refund metadata на текущем MVP этапе.

## Notes

- `REQ-018` входит в decomposition scope через cancellation error contract, audit и event generation; review-related bot alerts из refund runbook остаются вне текущего feature scope.
