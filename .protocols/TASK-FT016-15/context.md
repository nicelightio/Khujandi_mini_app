---
description: Execution context for TASK-FT016-15 operator/admin status control.
status: active
---
# TASK-FT016-15 Context

## Task

Add operator/admin status command/API for allowed next transitions only, especially `DELIVERED -> COMPLETED`, plus admin-web confirmation action and actor-visible history/read model.

## Normative Inputs Read

- `AGENTS.md`
- `.memory-bank/commands/autopilot.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/review.md`
- `.protocols/TASK-FT016-14/verification.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`

## Micro-check Before Edits

- Owning capability slice: `delivery-tracking`.
- Owning contours: `backend` and `admin-web`.
- Touched layers: backend application/presentation/runtime tests, admin-web API/model/UI tests, operational docs.
- Shared extraction: not justified; allowed transition rules remain local to `delivery-tracking`, and admin UI consumes the existing operator read/command boundary.

## Scope Boundary

In scope:
- Server-side operator/admin status command for allowed next transitions only.
- `DELIVERED -> COMPLETED` closure by `operator`/`admin`.
- Confirmation popup/action in existing operator panel.
- Actor role/name in history/read model.
- Focused backend/runtime/admin tests.

Out of scope:
- Broad arbitrary status override or multi-step jump.
- Cancellation reason/refund changes.
- Assignment offers/claims/timeouts/auto-offer changes.
- Legacy direct assignment cleanup.
- Re-enabling courier completion from bot.
- Shared business state-machine extraction.

## Initial Worktree Note

Repository was already broadly dirty from prior FT-016 autonomous tasks before this task began. This worker will not revert or normalize unrelated drift.
