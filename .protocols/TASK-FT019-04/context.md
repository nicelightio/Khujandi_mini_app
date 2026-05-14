---
description: Context for TASK-FT019-04 Staff table metrics read models.
status: active
---
# TASK-FT019-04 Context

## Role

ROLE: SUBAGENT
TYPE: implementer

## Required Context Read

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/contracts/operator-delivery-ops-contract.md`
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/tasks/plans/IMPL-FT-019.md`
- `.protocols/FT-019/plan.md`
- `.protocols/FT-019/decision-log.md`
- `.protocols/TASK-FT019-01/handoff.md`
- `.protocols/TASK-FT019-01/verification.md`
- `.protocols/TASK-FT019-02/handoff.md`
- `.protocols/TASK-FT019-02/verification.md`
- `.protocols/TASK-FT019-03/handoff.md`
- `.protocols/TASK-FT019-03/verification.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`

## Owning Capability And Boundaries

- Owning capability: `FT-019` Staff panel table metrics.
- Owning contour: `admin-web`.
- Touched slices:
  - `delivery-assignment`: courier staff roster, delivered/unsuccessful order metric source and courier manual/automatic rating components.
  - `reviews-feedback`: client-to-courier average review rating source.
  - `delivery-tracking`: operator write-action evidence read model.
  - `admin-access`: operator staff roster, manual rating adjustment and operator table rating composition.
- Touched layers: backend `domain` read-model types, backend `infrastructure` read-model readers, focused tests.
- Not touched: presentation/runtime routes, frontend UI, command endpoints, migrations/schema, delivery/review/auth state mutation.

## Shared Justification

No `shared` extraction is justified. The read models are narrow source readers under existing owning slices. Cross-slice composition is deferred to later API/runtime work and must stay explicit.

## Constraints

- Read models only; no state mutation.
- Do not add `OrderStatus.FAILED`.
- Courier delivered count uses assigned courier orders that reached `DELIVERED`; this does not change the project global successful KPI, which remains `COMPLETED`.
- Courier average review rating comes from `reviews-feedback` client-to-courier reviews.
- Operator processed count uses unique orders with at least one operator write action; reads/views are excluded and duplicate writes collapse per order.
- Existing working tree has unrelated dirty files; do not revert or overwrite them.

## Source Notes

- Courier automatic penalties currently persist as `User.ratingScore`, decremented by personal offer timeout logic.
- Manual staff rating adjustments persist in `CourierStaffRatingAdjustment` and `OperatorStaffRatingAdjustment`.
- Operator write evidence currently exists in status history, assignment offer events and cancellation/refund audit rows. Bot communication writes do not have a durable order communication model in the current codebase; the reader accepts known order-message event shapes if they appear later but does not invent a new source.
