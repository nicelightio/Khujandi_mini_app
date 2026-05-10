---
description: Context for TASK-FT016-17-FIX delivery-tracking runtime setup repair.
status: active
---
# TASK-FT016-17-FIX Context

## Scope

- Task: `TASK-FT016-17-FIX`
- Trigger: `.protocols/TASK-FT016-17/verification.md` records `FAIL` because delivery-tracking runtime tests still used disabled normal legacy `POST /api/v1/admin/orders/:id/assignment` setup expecting `200`.
- Approved by: `.protocols/AUTONOMOUS-RUN/review.md`

## Micro-check

- Owning slice: `delivery-tracking` runtime verification.
- Adjacent boundary: `delivery-assignment` v2 offer + courier claim setup.
- Owning contour: backend runtime test contour.
- Touched layers: focused test/runtime setup and operational task docs.
- Shared extraction: not justified; the repair is local to the existing runtime spec setup.

## Relevant specs

- `.memory-bank/features/FT-004-courier-assignment.md`: `ASSIGNED` is created only after successful courier claim; pending offers do not assign.
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`: delivery tracking owns post-assignment lifecycle/events.
- `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md`: normal manual operator assignment creates an offer requiring courier confirmation.
- `.memory-bank/states/order-lifecycle.md`: `CREATED|DELAYED -> ASSIGNED` belongs to courier claim, not direct admin assignment.
- `.memory-bank/contracts/operator-delivery-ops-contract.md`: manual offer and claim boundaries.
- `.memory-bank/contracts/api-events-baseline.md`: `order.assigned` is canonical successful claim event.

## Constraints

- Do not re-enable normal legacy `/assignment`.
- Do not change production behavior unless a tiny test wiring bug is directly required.
- Use `/assignment-override` only in explicit override tests with `confirmDirectAssignmentOverride: true`.
- Preserve readability of existing active v1 assigned orders.
