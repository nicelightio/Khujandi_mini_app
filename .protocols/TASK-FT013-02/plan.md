---
description: Execution plan for TASK-FT013-02.
status: active
---
# TASK-FT013-02 Plan

## Scope

Require the customer checkout route to consume a valid `FT-012` composition draft and render customer confirmation from that draft. Missing, empty or invalid draft state must recover to catalog/cart without fake order data, payment start or order creation.

## Steps

1. Inspect current `checkout-payment` route, existing catalog handoff output and focused tests.
2. Replace isolated/fake checkout route data with contract-shaped draft consumption and validation.
3. Add controlled recovery UI for missing/invalid drafts.
4. Add focused frontend route/page smoke coverage for valid draft and direct `/checkout` recovery.
5. Run focused frontend tests/gates.
6. Update Memory Bank docs and task status artifacts.

## Expected Files

- `frontend/src/slices/checkout-payment/**/*`.
- `frontend/src/tests/slices/checkout-payment/**/*`.
- `frontend/src/slices/catalog/**/*` only if existing handoff output requires a narrow adjustment.
- `.memory-bank/tasks/backlog.md`, `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`, `.memory-bank/changelog.md`, `.memory-bank/index.md` after implementation.

## Verification

- Valid composition reaches checkout confirmation with selected shop, line items, quantities, display snapshots and preview total visible.
- Direct `/checkout` or missing/empty composition shows controlled recovery to catalog/cart.
- No payment/order side effects are introduced in this task.
