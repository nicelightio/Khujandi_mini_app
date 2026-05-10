---
description: Execution context for TASK-FT016-13 DELAYED presentation/read-copy surfacing.
status: active
---
# TASK-FT016-13 Context

## Task

- Task ID: `TASK-FT016-13`
- Feature: `FT-016`
- Scope: surface `DELAYED` escalation in the operator panel and customer order status copy.
- Source queue: [.memory-bank/tasks/backlog.md](../../.memory-bank/tasks/backlog.md)
- Approved by: [.protocols/AUTONOMOUS-RUN/review.md](../AUTONOMOUS-RUN/review.md)

## Spec Priming

Read before code inspection:

- [AGENTS.md](../../AGENTS.md)
- [.memory-bank/commands/autopilot.md](../../.memory-bank/commands/autopilot.md)
- [.memory-bank/mbb/index.md](../../.memory-bank/mbb/index.md)
- [.memory-bank/spec-index.md](../../.memory-bank/spec-index.md)
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md)
- [.memory-bank/index.md](../../.memory-bank/index.md)
- [.memory-bank/product.md](../../.memory-bank/product.md)
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md)
- [.memory-bank/tasks/backlog.md](../../.memory-bank/tasks/backlog.md)
- [.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md](../../.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md)
- [.protocols/AUTONOMOUS-RUN/status.md](../AUTONOMOUS-RUN/status.md)
- [.protocols/AUTONOMOUS-RUN/review.md](../AUTONOMOUS-RUN/review.md)
- [.protocols/TASK-FT016-12/verification.md](../TASK-FT016-12/verification.md)
- [.memory-bank/epics/EP-002-delivery-operations.md](../../.memory-bank/epics/EP-002-delivery-operations.md)
- [.memory-bank/features/FT-004-courier-assignment.md](../../.memory-bank/features/FT-004-courier-assignment.md)
- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../../.memory-bank/features/FT-005-order-tracking-and-events-polling.md)
- [.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md](../../.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md)
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../../.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md)
- [.memory-bank/states/order-lifecycle.md](../../.memory-bank/states/order-lifecycle.md)
- [.memory-bank/contracts/api-events-baseline.md](../../.memory-bank/contracts/api-events-baseline.md)
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../../.memory-bank/contracts/operator-delivery-ops-contract.md)

## Micro-check Before Edits

- Owning capability slice: `delivery-tracking`.
- Consumed adjacent slice: `delivery-assignment` only as the source of `DELAYED` state from prior timeout evaluator work; no assignment behavior changes are in scope.
- Owning contours: `admin-web` for operator panel read presentation; `mini-app` for customer order tracking read presentation.
- Touched layers: frontend presentation, frontend read-model/parser/view-model, focused frontend tests, task operational docs.
- Shared justification: no new shared extraction is justified. `DELAYED` copy and read handling should stay in existing admin/order-tracking modules unless the current code already has a shared frontend status primitive that must be updated for type compatibility.

## Scope Boundaries

In scope:

- Admin/operator top alert and row/read-model copy must display `DELAYED` clearly.
- Customer order tracking parser/view copy must support `DELAYED`.
- Customer `DELAYED` state must read as waiting/problem copy, not courier progress.
- Customer UI must remain read-only with no mutation controls.
- Existing active orders must remain readable/operational.

Out of scope:

- Customer mutation commands.
- Timeout evaluator changes.
- Assignment rules, manual offer, auto-offer, claim changes.
- Backend lifecycle mutation changes.
- `PICKED_UP`/completion behavior.
- Legacy direct assignment cleanup.
- Admin panel rebuild.

## Current Repo Note

`git status` was already dirty before this task, including prior FT-016 task files and likely uncommitted implementation artifacts. This task must avoid reverting unrelated drift and should touch only the scoped files needed for `TASK-FT016-13`.
