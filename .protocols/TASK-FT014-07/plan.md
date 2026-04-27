---
description: Execution plan for TASK-FT014-07.
status: active
---
# TASK-FT014-07 Plan

1. Inspect checked-in dev runtime mounting, existing delivery-tracking event read path, checkout success metadata, and focused tests.
2. Add the smallest runtime repair for mounted `GET /api/v1/events?since=...`, including explicit customer/order scoping if absent.
3. Align checkout success cursor/revision handoff with event-stream revision rather than order id while keeping cursor/revision as opaque strings at API boundaries.
4. Add focused regression tests for mounted runtime, cursor compatibility, empty-window ordered events, and unrelated-order visibility.
5. Run focused gates, record evidence under `.tasks/TASK-FT014-07/`, and sync Memory Bank without closing `REQ-033`.

## Boundary Check

- Single owning slice: `delivery-tracking` read/event visibility, with narrow checkout handoff metadata integration.
- Contour remains `mini-app`; operational lifecycle commands stay with `delivery-assignment`, `delivery-tracking`, and `order-cancellation`.
- Business rules do not move to `shared`; mounted route/filtering is runtime integration over existing contracts.
