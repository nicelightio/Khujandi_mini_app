---
description: Execution context for TASK-FT016-04 admin operator orders read surface.
status: active
---
# TASK-FT016-04 Context

## Loaded Inputs

- `AGENTS.md`
- `.memory-bank/commands/execute.md`
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
- `.protocols/TASK-FT016-03/verification.md`
- `.memory-bank/tasks/plans/IMPL-FT-016-operator-delivery-migration.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/states/order-lifecycle.md`

## Review Gate

- AUTONOMOUS-RUN review verdict: `APPROVE` for `TASK-FT016-04` only.
- `TASK-FT016-03` verification: `PASS`.
- Backlog state moved from `ready` to `in_progress` at task start.

## Boundary Check

- Owning capability slice: `delivery-tracking` operator read surface.
- Adjacent consumed slice: `delivery-assignment` markers only for courier assignment/claim display.
- Owning contour: `admin-web`.
- Touched layers: frontend API adapter, route app state, UI component, focused frontend tests.
- Shared extraction: not justified; parsing/view-model code remains local to admin assignment/operator read surface and reuses existing admin shell/theme primitives.

## Scope Guard

- Use `GET /api/v1/admin/operator/delivery/orders` from `TASK-FT016-03`.
- Render today plus previous 3 days as supplied by backend.
- Show severity, current status, courier absent/current marker, assigned/claimed time, row summary, nullable latest-message placeholders, and expandable history.
- Keep existing protected admin shell/theme/navigation.
- Do not add backend mutations, offer submit, auto-offer toggle, chat redirect, cancellation UI changes, status/refund changes, or bot behavior.
