---
description: Handoff for TASK-FT019-04 Staff table metrics read models.
status: active
---
# TASK-FT019-04 Handoff

## Result

Implementation completed for backend read-model scope.

## Added

- Courier Staff table delivery metrics reader in `delivery-assignment`:
  - delivered count uses assigned courier orders that reached `DELIVERED`;
  - `COMPLETED` is not treated as the global successful-order shortcut for this metric;
  - `courier_order_rating = floor(delivered_orders_count / 100) + manual_rating_adjustment + automatic_penalties`;
  - unsuccessful percent uses cancellation/problem terminal states and excludes active unfinished statuses.
- Courier average client review rating reader in `reviews-feedback`:
  - averages only client-to-courier reviews where the review author matches the order client.
- Operator processed-order evidence reader in `delivery-tracking`:
  - counts unique orders touched by operator write evidence;
  - duplicate writes on one order collapse to one;
  - read/view events are not counted.
- Operator Staff table composition reader in `admin-access`:
  - combines operator roster, processed counts and manual rating adjustment;
  - `operator_rating = floor(processed_orders_count / 100) + manual_rating_adjustment`.

## Not Done

- No dev-runtime/API routes.
- No admin-web UI.
- No command endpoint behavior.
- No staff cards.
- No schema or migration changes.
- No delivery/review/auth state mutation.
- No `OrderStatus.FAILED`.
- No shared staff/CRM abstraction.

## Checks

- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-operator-staff-metrics.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-metrics.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-metrics.spec.ts tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts --runInBand`: `PASS`
- `npm run test:admin-access -- --runInBand`: `PASS`
- `npm run test:delivery-assignment -- --runInBand`: `PASS`
- `PAYMENT_PROVIDER=mock APP_ENV=staging npm run test:delivery-tracking -- --runInBand`: `PASS`
- `npm run test:reviews-feedback -- --runInBand`: `PASS`
- Focused eslint for touched source/tests: `PASS`
- `git diff --check`: `PASS`

## Caveat

- Plain `npm run test:delivery-tracking -- --runInBand` failed on checkout `503` without explicit mock-payment runtime configuration. It passed with `PAYMENT_PROVIDER=mock APP_ENV=staging`, which matches the guarded mock-payment runtime policy.

## Risks / Follow-Up Notes

- Bot communication writes do not currently have a durable order communication table/source. The operator processed-count reader recognizes known `order.message_sent` / `order.message_received` event actor fields if such events exist later, but this task did not invent a new communication source.
- `TASK-FT019-06` or later API composition should combine these source readers explicitly rather than moving staff metrics into `shared`.

## Recommendation

Proceed to verifier/orchestrator review. `TASK-FT019-05` can use these table metric readers as prerequisites for card read models after acceptance.
