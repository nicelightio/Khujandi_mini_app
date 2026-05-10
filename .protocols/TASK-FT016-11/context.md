---
description: Execution context for TASK-FT016-11 optional auto-offer broadcast trigger.
status: active
---
# TASK-FT016-11 Context

## Task

Implement optional auto-offer broadcast trigger after `TASK-FT016-10` atomic claim verification.

## Normative Sources Read

- [AGENTS.md](../../AGENTS.md): project operating guide.
- [.memory-bank/commands/autopilot.md](../../.memory-bank/commands/autopilot.md): `/autopilot` execution rules.
- [.memory-bank/mbb/index.md](../../.memory-bank/mbb/index.md): Memory Bank rules.
- [.memory-bank/spec-index.md](../../.memory-bank/spec-index.md): normative spec router.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): slice/layer/contour boundaries.
- [.memory-bank/product.md](../../.memory-bank/product.md): product baseline.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): REQ-007, REQ-018, REQ-036.
- [.memory-bank/epics/EP-002-delivery-operations.md](../../.memory-bank/epics/EP-002-delivery-operations.md): delivery operations epic.
- [.memory-bank/features/FT-004-courier-assignment.md](../../.memory-bank/features/FT-004-courier-assignment.md): offer/claim semantics.
- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../../.memory-bank/features/FT-005-order-tracking-and-events-polling.md): lifecycle/event constraints.
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../../.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md): auto-offer and operator panel scope.
- [.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md](../../.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md): customer read-only dependency.
- [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md): canonical lifecycle.
- [.memory-bank/contracts/api-events-baseline.md](../../.memory-bank/contracts/api-events-baseline.md): event persistence-before-publish contract.
- [.memory-bank/contracts/telegram-bot-contract.md](../../.memory-bank/contracts/telegram-bot-contract.md): courier offer/claim notification contract.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../../.memory-bank/contracts/operator-delivery-ops-contract.md): operator delivery command boundary.
- [.memory-bank/tasks/backlog.md](../../.memory-bank/tasks/backlog.md): active task card.
- [.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md](../../.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md): staged implementation plan.
- [.protocols/AUTONOMOUS-RUN/status.md](../AUTONOMOUS-RUN/status.md): run status.
- [.protocols/AUTONOMOUS-RUN/review.md](../AUTONOMOUS-RUN/review.md): APPROVE gate and conditions.
- [.protocols/TASK-FT016-10/verification.md](../TASK-FT016-10/verification.md): atomic claim PASS evidence.

## Ownership

- Owning capability slice: `delivery-assignment`.
- Owning contour: backend/dev-runtime command path with narrow `admin-web` trigger and Telegram bot notification boundary.
- Touched layers: application, domain contracts, infra/persistence, narrow presentation/runtime adapter, focused admin API/UI tests, task docs.
- Shared justification: no shared extraction. Broadcast eligibility, offer creation and claimability are slice-owned business rules; existing shared auth/error/event primitives are sufficient.

## Scope Guard

- Auto-offer defaults OFF and runs only through explicit operator/admin trigger or explicit opt-in mechanism.
- Eligible couriers must be active, free and `autoOfferEnabled`.
- Broadcast creates pending offer state and `order.offer_created` artifacts only; order remains `CREATED|DELAYED`.
- Broadcast must not set `courierId`, `ASSIGNED`, `assignedAt`, status history, assignment audit, or `order.assigned`.
- Notifications happen only after persistence succeeds.
- Existing manual targeted offer, atomic claim and legacy direct assignment override remain intact.
