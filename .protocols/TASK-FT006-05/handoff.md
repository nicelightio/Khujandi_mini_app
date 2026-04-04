# TASK-FT006-05 Handoff

- Backend `order-cancellation` now exposes a command-level refund update path via `OrderCancellationController.recordRefundUpdate()`.
- The command accepts only cancelled paid orders in `PENDING_MANUAL`, requires a non-empty trimmed `refund_note`, and persists `DONE/REJECTED` plus audit/event artifacts without touching provider integrations.
- `TASK-FT006-06` can now wire admin-web UX to this backend path and surface the explicit refund lifecycle already persisted by the slice.
