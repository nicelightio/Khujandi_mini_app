# TASK-FT014-02 Plan

## Goal

Add a customer status entry surface reachable from successful `FT-013` paid-order output, tied to the created order identity, with safe recovery when order identity is missing.

## Steps

1. Inspect checkout success metadata flow and existing frontend delivery-tracking/customer status code.
2. Add the minimal route/link/surface needed to enter customer order status with the real `orderId`.
3. Add controlled recovery for missing/lost order identity without fake status data.
4. Add focused frontend smoke coverage for paid-order metadata -> status entry and missing identity recovery.
5. Run relevant tests/gates and record evidence.
6. Sync Memory Bank/backlog/changelog and task artifacts.

## Non-Goals

- No changes to payment/order creation ownership.
- No customer lifecycle mutation commands.
- No full `GET /events?since=<cursor>` polling consumer wiring in this task.
- No duplicate delivery state machine.
- No shared business module extraction.

## Verification Basis

- Status entry is reachable from successful paid order creation metadata.
- Status entry uses the same created order identity.
- Missing/lost identity shows controlled recovery.
- UI does not display another user's order, route-local fake status, courier/admin controls, cancellation commands or refund internals.
