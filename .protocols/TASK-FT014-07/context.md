---
description: Execution context for TASK-FT014-07 customer events runtime repair.
status: active
---
# TASK-FT014-07 Context

## Loaded Sources

- `AGENTS.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-014-customer-order-status-visibility-and-delivery-tracking-integration.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/bugs/BUG-2026-04-27-ft014-events-runtime-and-cursor-drift.md`
- `.memory-bank/tasks/plans/IMPL-FT-014.md`

## Richer Inputs

- Found task-card fields in `.memory-bank/tasks/backlog.md`: Source, Constraints, Verification Targets, Tests, Docs.
- Found feature-level normative inputs in `FT-014`, `FT-013`, `FT-005`, `api-events-baseline`, `order-lifecycle`.
- Fallback: no separate `.protocols/TASK-FT014-07` existed before this run, so this protocol is initialized from the task-card plus feature/contract specs.

## Ownership And Boundaries

- Owning capability slice: `delivery-tracking` for customer-facing status visibility over the existing event stream.
- Contour: `mini-app` customer read-only status path.
- Touched layers: runtime HTTP presentation adapter plus application/read-side event filtering; `checkout-payment` may be touched only for status handoff metadata.
- Shared justification: no new shared extraction. The existing shared event transport contract is consumed/mounted; event semantics and customer filtering stay in the owning runtime/read path.

## Invariants

- `GET /api/v1/events?since=<cursor>` must be mounted in the checked-in dev/runtime path used by Mini App status polling.
- `since`, `revision`, and `next_cursor` remain string opaque API boundary values.
- Checkout success must not seed status polling with incompatible `order.id` cursor data.
- Customer status visibility remains read-only and must not expose courier/admin controls.
- Do not close `REQ-033` and do not attempt Android Telegram evidence closure in this task.
