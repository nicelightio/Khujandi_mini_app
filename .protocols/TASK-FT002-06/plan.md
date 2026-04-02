---
description: Execution plan for TASK-FT002-06.
status: active
---
# TASK-FT002-06 Plan

## Inputs strategy
- Use the task-card verify statement as the primary acceptance basis.
- Reuse the `checkoutOrder()` boundary introduced in `TASK-FT002-05` and refine only the non-`PAID` paths.
- Keep retry semantics explicit in `AppError.details` so the contract remains deterministic and easy to verify in tests.

## Planned steps
1. Extend the payment finalization model with explicit retry-safe error details for `FAILED`, `CANCELED`, and timeout-like `PENDING` outcomes.
2. Update the service trust gate so non-`PAID` outcomes return controlled `AppError` responses before any persistence lookup or write.
3. Add unit/integration coverage that proves failed, canceled, and timeout-like outcomes return retry-safe details and leave `orders` untouched.
4. Sync task-local reports and backlog state after targeted verification.

## Constraints
- Failed, canceled, and timeout-like payment outcomes must not create an order.
- Existing trusted `PAID` handling and duplicate-delivery idempotency must remain intact.
- Error details must stay compatible with the project-wide `{ error: { code, message, details }, trace_id }` contract.

## Verification targets
- `POST /orders/checkout` returns a controlled error for failed, cancelled, and timeout-like payment outcomes.
- Failure-path error details indicate retry-safe semantics.
- No order persistence happens for non-`PAID` payment outcomes.
