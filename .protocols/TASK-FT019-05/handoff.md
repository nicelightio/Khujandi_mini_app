---
description: Handoff for TASK-FT019-05 Staff cards and history read models.
status: active
---
# TASK-FT019-05 Handoff

## Result

Implementation completed for backend read-model scope. Final verifier `PASS` remains pending separate review.

## Added

- Courier Staff card read model in `delivery-assignment`:
  - common added/deactivated/reactivated metadata;
  - lifecycle history and manual rating adjustment history;
  - last 10 courier orders;
  - last 10 problem orders for unfinished, defensive future-`FAILED` source strings and client rating `1`;
  - table metric fields reused in card shape.
- Courier rating-1 problem evidence reader in `reviews-feedback`, filtered to client-authored client-to-courier reviews.
- Operator order history read model in `delivery-tracking`:
  - last 10 write-touched processed orders;
  - problem orders for defensive future-`FAILED` source strings and write-touched orders not personally completed by that operator;
  - duplicate writes collapse by order in the card projection.
- Operator Staff card composition in `admin-access`:
  - common added/deactivated/reactivated metadata;
  - lifecycle history and manual rating adjustment history;
  - processed count/rating plus delivery-tracking order blocks.
- Focused card tests in `tests/slices/admin-access`, `delivery-assignment`, `delivery-tracking` and `reviews-feedback`.

## Not Done

- No dev-runtime/API routes.
- No admin-web/frontend UI.
- No command behavior.
- No schema or migration changes.
- No lifecycle/status changes and no `OrderStatus.FAILED`.
- No delivery/review/auth state mutation.
- No shared staff/CRM abstraction.

## Checks

- Focused Staff card/read-model Jest: `PASS`.
- Focused Staff metrics/card Jest: `PASS`.
- Focused ESLint for touched source/tests: `PASS`.
- `npm run test:admin-access -- --runInBand`: `PASS`.
- `npm run test:delivery-assignment -- --runInBand`: `PASS`.
- `PAYMENT_PROVIDER=mock APP_ENV=staging npm run test:delivery-tracking -- --runInBand`: `PASS`.
- `npm run test:reviews-feedback -- --runInBand`: `PASS` with existing `1 todo`.
- Focused grep for `OrderStatus.FAILED`: `PASS`.
- `git diff --check`: `PASS`.

## Risks / Follow-Up Notes

- The future-`FAILED` bucket is defensive string handling only. It does not add or imply a current order lifecycle status.
- API/runtime composition remains deferred to `TASK-FT019-06`; it should compose these readers explicitly and keep route RBAC in the admin-web protected boundary.
- The worktree has unrelated dirty files from adjacent tasks; this handoff is scoped to TASK-FT019-05.

## Recommendation

Proceed to verifier/orchestrator review. `TASK-FT019-06` should start only after acceptance of this task because it depends on the Staff card read-model contract.
