---
description: Execution context for TASK-FT016-12 offer timeout evaluator.
status: active
---
# TASK-FT016-12 Context

## Task

Implement offer timeout evaluator as an explicit KISS application command after `TASK-FT016-11` verification.

## Normative Sources Read

- [AGENTS.md](../../AGENTS.md): project operating guide.
- [.memory-bank/commands/autopilot.md](../../.memory-bank/commands/autopilot.md): `/autopilot` execution rules.
- [.memory-bank/mbb/index.md](../../.memory-bank/mbb/index.md): Memory Bank rules.
- [.memory-bank/spec-index.md](../../.memory-bank/spec-index.md): normative spec router.
- [.memory-bank/index.md](../../.memory-bank/index.md): Memory Bank navigation.
- [.memory-bank/product.md](../../.memory-bank/product.md): product baseline.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-007`, `REQ-018`, `REQ-036`.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): slice/layer/contour boundaries.
- [.memory-bank/tasks/backlog.md](../../.memory-bank/tasks/backlog.md): active task card.
- [.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md](../../.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md): staged implementation plan.
- [.protocols/AUTONOMOUS-RUN/status.md](../AUTONOMOUS-RUN/status.md): run status.
- [.protocols/AUTONOMOUS-RUN/review.md](../AUTONOMOUS-RUN/review.md): `APPROVE` gate for this task.
- [.protocols/TASK-FT016-11/verification.md](../TASK-FT016-11/verification.md): optional auto-offer broadcast `PASS` evidence.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../.memory-bank/epics/EP-002-delivery-operations.md): delivery operations epic.
- [.memory-bank/features/FT-004-courier-assignment.md](../../.memory-bank/features/FT-004-courier-assignment.md): offer/claim and timeout semantics.
- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../../.memory-bank/features/FT-005-order-tracking-and-events-polling.md): lifecycle/event constraints.
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../../.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md): operator delayed alert and courier offer flow.
- [.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md](../../.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md): customer read-only dependency on delayed status.
- [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md): canonical lifecycle and `DELAYED` timeout rule.
- [.memory-bank/contracts/api-events-baseline.md](../../.memory-bank/contracts/api-events-baseline.md): event shape and publish-after-persistence rule.
- [.memory-bank/contracts/telegram-bot-contract.md](../../.memory-bank/contracts/telegram-bot-contract.md): repeat/delayed notification contract.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../../.memory-bank/contracts/operator-delivery-ops-contract.md): timeout baseline and command boundary.

## Ownership Micro-Check

- Owning capability slice: `delivery-assignment`.
- Owning contour: backend explicit application command, with narrow dev-runtime/manual tick/test harness and Telegram bot notification boundary.
- Touched layers: application, domain types, infrastructure/persistence, narrow dev-runtime route, Telegram notifier adapter, focused tests, task docs.
- Shared extraction: not justified. Timeout business rules are assignment-domain policy and can use existing shared DB/event/error primitives without new shared business code.

## Constraints

- KISS only: no Redis, queues, cron daemon, worker architecture, microservice, GPS/maps/routing or dispatch optimization.
- Evaluator must be explicit/callable by runtime/manual tick/test harness.
- Repeat notification after 3 minutes must happen once for still-pending offers.
- Timeout after 6 minutes must expire pending offers, set or keep order `DELAYED`, publish timeout/delayed events after persistence, notify operators once, and penalize only personal target courier once when supported.
- Repeated evaluator calls must be idempotent for repeat notifications, penalties, timeout/delayed events, history/audit and operator notifications.
- Must not modify claimed/`ASSIGNED` orders, accepted offers, orders with `courierId`, terminal/completed/cancelled lifecycle or post-`ASSIGNED` states.
