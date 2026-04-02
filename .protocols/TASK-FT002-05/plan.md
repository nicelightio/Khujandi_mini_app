---
description: Execution plan for TASK-FT002-05.
status: active
---
# TASK-FT002-05 Plan

## Inputs strategy
- Use the task-card `Verify` statement as the primary acceptance basis.
- Preserve the existing `checkout-payment` slice ownership and extend only the backend layers required for trusted finalization.
- Prefer a minimal payment confirmation contract in code that is deterministic to test and keeps all trust decisions server-side.

## Planned steps
1. Extend `checkout-payment` domain types with trusted payment finalization input and provider confirmation primitives.
2. Add service logic that validates trusted source + canonical paid status, rejects client-only signals, and performs idempotent order creation.
3. Extend the repository boundary with the minimal lookup/create operations required for duplicate callback protection.
4. Expose the finalization flow through the `POST /orders/checkout` controller/module boundary.
5. Add task-targeted unit/integration tests for trusted success, untrusted source, non-paid status, and duplicate delivery idempotency.

## Constraints
- No order without trusted successful payment.
- Client-only payment signals cannot create orders.
- Duplicate delivery must return the existing order rather than produce a second write.
- Payment identity must stay within the `checkout-payment` slice and rely on explicit DB uniqueness fields already present in the schema baseline.

## Verification targets
- Successful trusted payment creates exactly one order with `payment_status = PAID`.
- Duplicate callback/status confirmation does not create a second order.
- Untrusted or non-paid confirmation is rejected before order creation.
