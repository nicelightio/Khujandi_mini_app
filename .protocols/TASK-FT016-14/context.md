---
description: Context protocol for TASK-FT016-14 v2 delivery tracking state machine.
status: active
---
# TASK-FT016-14 Context

## Task

- TASK-ID: `TASK-FT016-14`
- Goal: enable v2 delivery tracking state machine for courier progress.
- Owning capability slice: `delivery-tracking`.
- Contours: `backend`, `telegram-bot`.
- Touched layers: `domain`, `application`, `infrastructure`, Telegram bot presentation adapter/harness, focused tests.
- Shared extraction: not justified. The state machine is slice-owned `delivery-tracking` business behavior; Telegram code must remain a contour adapter and must not become shared business logic.

## Required Spec Context

- `REQ-008`: courier drives `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`; operator/admin later closes `DELIVERED -> COMPLETED`.
- `REQ-009`: valid lifecycle changes write history/event and return string revision metadata.
- `REQ-018`: conflict/error behavior must remain controlled; no side effects on invalid transitions.
- `FT-005`: owns delivery progress lifecycle, polling/event semantics, and 409 conflict behavior.
- `FT-016`: requires additive migration and compatibility for existing active orders.
- `FT-014`: customer status visibility consumes tracking events read-only and must not gain mutation commands.
- `order-lifecycle`: `DELIVERED -> COMPLETED` is operator/admin-owned and out of this task.
- `telegram-bot-contract`: bot-driven courier actions must pass through server-side state machine.

## Scope

In scope:
- Enable normal courier flow `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`.
- Update transition map and action statuses.
- Update Telegram delivery tracking harness labels, callback parsing, and available notification actions.
- Preserve existing active orders already in `IN_PROGRESS` or `DELIVERED`; no mass rewrite.
- Keep legacy `IN_PROGRESS -> DELIVERED` valid for already-in-progress orders.
- Add focused backend and bot harness tests for new transitions, invalid skip/replay/regression, legacy compatibility, and no courier completion.

Out of scope:
- Operator completion UI or admin status command.
- Cancellation/refund changes.
- Assignment offer/claim/timeout/auto-offer changes.
- Legacy direct assignment cleanup.
- Customer mutation commands.
- Shared extraction or broad bot runtime rewrite.
- Mass rewrite/backfill of active orders.

## Initial Drift / Compatibility Notes

- Current implementation may still contain legacy `ASSIGNED -> IN_PROGRESS -> DELIVERED -> COMPLETED` behavior from FT-005 v1.
- Existing active orders can legitimately lack `PICKED_UP`; this task must not require data rewrite to continue delivery.
- `DELIVERED -> COMPLETED` rejection for courier is expected until `TASK-FT016-15` adds operator/admin closure.
