---
description: Handoff for TASK-FT019-03 courier staff roster commands.
status: active
---
# TASK-FT019-03 Handoff

## Result

Implementation completed for the scoped `delivery-assignment` backend command/application/infra baseline.

## Added

- Courier staff command types and service methods for create, soft-deactivate, boss-only reactivate and manual rating adjustment.
- Commands operate on courier staff profiles over `User(COURIER)` and use explicit actor admin-account metadata.
- Courier create accepts `telegram_user_id` and nickname; no web password or password hash is created.
- Duplicate active courier, deactivated existing courier and non-courier Telegram identity conflicts fail with controlled `AppError`.
- Soft deactivate/reactivate write explicit staff lifecycle metadata and structured `CourierStaffLifecycleEvent` records; no hard delete path is added.
- Manual rating adjustment records `+1/-1` in `CourierStaffRatingAdjustment` with actor/timestamp/reason metadata and does not update review-average source data.
- Focused tests under `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts`.

## Not done

- No dev-runtime/API routes.
- No admin-web UI.
- No operator account commands.
- No staff table metrics or card read models.
- No courier offer/claim lifecycle, availability semantics or bot runtime behavior changes.
- No schema/migration changes and no `OrderStatus.FAILED`.
- No shared staff/CRM abstraction.

## Checks

- `npm run test:delivery-assignment -- --runInBand`: `PASS`
- `npx eslint backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts`: `PASS`
- `git diff --check`: `PASS`

## Risks / follow-up notes

- Final verifier should inspect that manual rating adjustments remain history-only and are not mixed with `reviews-feedback` average review rating.
- Runtime/API route exposure remains intentionally deferred to `TASK-FT019-06`.

## Recommendation

`TASK-FT019-04` can proceed after verifier/orchestrator acceptance of `TASK-FT019-03`; it should consume the courier staff roster baseline for metrics read models without changing lifecycle or review semantics.
