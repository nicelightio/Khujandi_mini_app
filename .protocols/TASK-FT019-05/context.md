---
description: Context for TASK-FT019-05 Staff cards and history read models.
status: active
---
# TASK-FT019-05 Context

## Role

- ROLE: SUBAGENT
- TYPE: implementer

## Task

Implement backend read models only for FT-019 Staff cards/history.

## Inputs Read

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` TASK-FT019-05 card
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.protocols/FT-019/plan.md`
- `.protocols/FT-019/decision-log.md`
- `.protocols/TASK-FT019-01/{handoff,verification}.md`
- `.protocols/TASK-FT019-02/{handoff,verification}.md`
- `.protocols/TASK-FT019-03/{handoff,verification}.md`
- `.protocols/TASK-FT019-04/{handoff,verification}.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- Current backend slice read-model/domain files and focused tests under the task-owned slices.

## Ownership

- Owning capability surface: `FT-019` Staff panel card/history read models.
- Owning contour: `admin-web`.
- Owning slices:
  - `admin-access`: operator staff identity, lifecycle history and manual rating adjustments.
  - `delivery-assignment`: courier staff identity, lifecycle history, manual rating adjustments and courier assigned-order card blocks.
  - `delivery-tracking`: operator write-evidence order history and personally-completed problem classification.
  - `reviews-feedback`: client-to-courier review average and rating-1 courier problem evidence.
- Touched layers: backend domain read-model types, backend infrastructure read-model readers, focused backend tests, task protocol/docs artifacts.
- Shared extraction: not justified. The read models are slice-local projections over each source-of-truth boundary; adding a shared staff/CRM abstraction would violate `doc/ARCHITECTURE.md` and `staff-panel-contract`.

## Scope Guard

- Read-only card models only.
- No dev-runtime/API routes.
- No frontend UI.
- No command behavior changes.
- No schema or migration changes.
- No order lifecycle/status changes.
- No `OrderStatus.FAILED` addition.
- No delivery/review/auth state mutation.
- No hard delete.

## Drift Notes

- Worktree already contains many unrelated modified/untracked files and prior FT-019 artifacts. This task must stay additive and scoped.
- `TASK-FT019-04` is verified `PASS`; its metric readers are prerequisites for this card layer.
