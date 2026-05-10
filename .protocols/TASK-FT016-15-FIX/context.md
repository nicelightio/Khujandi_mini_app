---
description: Execution context for TASK-FT016-15-FIX manager role normalization.
status: active
---
# TASK-FT016-15-FIX Context

## Task

Repair the `TASK-FT016-15` verification failure by normalizing the admin-access `manager` role into the delivery-tracking `operator` capability only at the operator/admin status command boundary.

## Normative Inputs Read

- `AGENTS.md`
- `.memory-bank/commands/autopilot.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/review.md`
- `.protocols/TASK-FT016-15/verification.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/states/order-lifecycle.md`

## Micro-check Before Edits

- Owning capability slice: `delivery-tracking`.
- Owning contour: backend admin runtime boundary for the `admin-web` operator status command.
- Touched layers: dev-runtime route boundary and focused runtime/delivery-tracking tests; operational docs.
- Shared extraction: not justified. This is a local compatibility mapping from `admin-access` roles to the existing delivery-tracking status command actor role.

## Scope Boundary

In scope:
- Normalize authenticated admin-access `manager` to delivery-tracking `operator` for this status command only.
- Keep authenticated `admin` admin-capable.
- Keep non-operator roles rejected.
- Add focused runtime coverage for authenticated `manager` executing `DELIVERED -> COMPLETED`.
- Preserve allowed-next status command semantics from `TASK-FT016-15`.

Out of scope:
- Broad RBAC/authorization rewrite.
- Lifecycle transition changes or arbitrary status overrides.
- UI changes unless a focused test role expectation minimally requires it.
- Cancellation/refund behavior.
- Assignment offer/claim/timeout/auto-offer behavior.
- Legacy direct assignment cleanup.

## Initial Worktree Note

Repository was already broadly dirty from prior FT-016 autonomous tasks before this repair began. This worker will not revert unrelated drift.
