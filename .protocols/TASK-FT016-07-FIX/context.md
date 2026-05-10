---
description: Execution context for TASK-FT016-07-FIX.
status: active
---
# TASK-FT016-07-FIX Context

## Loaded sources

- [AGENTS.md](../../AGENTS.md): project operating guide.
- [.memory-bank/commands/execute.md](../../.memory-bank/commands/execute.md): task execution protocol.
- [.memory-bank/commands/autopilot.md](../../.memory-bank/commands/autopilot.md): autopilot queue protocol.
- [.memory-bank/tasks/backlog.md](../../.memory-bank/tasks/backlog.md): task card and status.
- [.protocols/AUTONOMOUS-RUN/review.md](../AUTONOMOUS-RUN/review.md): APPROVE gate for this repair only.
- [.protocols/TASK-FT016-07/verification.md](../TASK-FT016-07/verification.md): failing verification evidence.
- [.memory-bank/bugs/BUG-2026-05-09-task-ft016-07-presentation-scope-leak.md](../../.memory-bank/bugs/BUG-2026-05-09-task-ft016-07-presentation-scope-leak.md): blocker and required repair.
- [.memory-bank/spec-index.md](../../.memory-bank/spec-index.md), [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md), [.memory-bank/product.md](../../.memory-bank/product.md), [.memory-bank/requirements.md](../../.memory-bank/requirements.md): core spec layer.
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../../.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md): FT-016 scope.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../../.memory-bank/contracts/operator-delivery-ops-contract.md), [.memory-bank/contracts/telegram-bot-contract.md](../../.memory-bank/contracts/telegram-bot-contract.md), [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md): task-scoped boundary rules.

## Boundary check

- Owning capability slice: `delivery-assignment`.
- Owning contour: backend application boundary for future `telegram-bot` consumption.
- Touched layers: remove out-of-scope `presentation` exposure; preserve `application`, `domain`, `infra`, and focused tests.
- Shared extraction: not justified; no common primitive or repeated cross-slice behavior is needed.
- Scope guard: no offers, courier claims, bot menu UI/harness, admin UI toggle, auto-offer fan-out, timeout evaluator, status/order history/audit/event side effects, chat redirects or message persistence.

## Drift

`TASK-FT016-07` behavior itself matches the application/domain/infra availability boundary, but verification found a layer-boundary drift: `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts` exposed availability methods too early. This repair removes only that presentation exposure.
