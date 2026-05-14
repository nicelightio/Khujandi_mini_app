---
description: Plan for TASK-FT019-04 Staff table metrics read models.
status: active
---
# TASK-FT019-04 Plan

## Scope

Implement backend read models only for Staff panel table metrics.

## Steps

1. Add narrow domain read-model types for courier table delivery metrics, courier review averages, operator processed-order counts and operator table metrics.
2. Add source readers:
   - `delivery-assignment`: courier delivered count, manual adjustment, automatic penalties and unsuccessful percent.
   - `reviews-feedback`: average client-to-courier review rating.
   - `delivery-tracking`: unique operator processed-order counts from write-action evidence.
   - `admin-access`: operator roster/manual adjustment/rating composition using processed counts supplied from the delivery-tracking source.
3. Add focused tests for:
   - `DELIVERED` vs `COMPLETED` courier semantics.
   - unsuccessful percent cancellation/problem bucket and active-status exclusion.
   - client-to-courier average review source.
   - duplicate operator writes collapsing to one processed order.
   - operator rating formula.
4. Run focused Jest suites, focused eslint for touched files and `git diff --check`.
5. Record handoff, verification placeholder and final implementation report.

## Out Of Scope

- Runtime/dev routes.
- Frontend UI.
- Staff cards.
- Courier/operator command behavior.
- Schema or migration changes.
- `FAILED` order status.
- Delivery/review/auth state mutation.
