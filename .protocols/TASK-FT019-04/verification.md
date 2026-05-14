---
description: Verification placeholder for TASK-FT019-04 Staff table metrics read models.
status: active
---
# TASK-FT019-04 Verification

## Verdict

`PASS`

## Scope verified

- Owning capability: `FT-019` Staff panel table metrics.
- Owning contour: `admin-web`.
- Touched slices verified: `delivery-assignment`, `reviews-feedback`, `delivery-tracking`, `admin-access`.
- Touched layers verified: backend domain read-model types, backend infrastructure readers, focused tests.
- Shared extraction: not introduced.
- Out-of-scope surfaces verified as not changed by this task: runtime/dev routes, admin-web UI, command behavior, schema/migration, state mutation, hard delete, `OrderStatus.FAILED`.

## Evidence

- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:95` defines unsuccessful courier statuses only as `CANCELLED_BY_ADMIN` and `CANCELLED_BY_COURIER_UNAVAILABLE`; no `FAILED` bucket/status is added.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:159` queries delivered reach evidence from `orderStatusHistory` with `newStatus: "DELIVERED"`.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:198` counts delivered orders from current `DELIVERED` or prior delivered history, so `COMPLETED` is not used as a shortcut unless the order actually reached `DELIVERED`.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:211` composes `courier_order_rating` from `floor(delivered/100)`, manual adjustment and existing automatic penalty score.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:203` counts unsuccessful orders from assigned courier terminal/problem states and excludes active unfinished statuses from the percent denominator.
- `backend/src/slices/reviews-feedback/infrastructure/prisma-staff-metrics.reader.ts:54` queries courier-target reviews and `:75` filters to reviews whose author is the order client.
- `backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader.ts:71` restricts event evidence to known write event types; read/view events are not in the DB query type set.
- `backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader.ts:125` stores processed orders in `Set`s per operator, so duplicate writes collapse to one order.
- `backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader.ts:166` includes status history writes, `:170` includes write events by actor, and `:185` includes cancellation/refund audit writes.
- `backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader.ts:61` reads only `AdminAccount(OPERATOR)` roster rows and `:120` composes processed count plus manual adjustment into `operator_rating`.
- `backend/prisma/schema.prisma:10` still defines `OrderStatus` without `FAILED`; focused grep found only pre-existing `PaymentStatus.FAILED` and `LOGIN_FAILED`.

## Checks run

- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-operator-staff-metrics.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-metrics.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-metrics.spec.ts tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts --runInBand`: `PASS` (4 suites, 4 tests).
- `npm run test:admin-access -- --runInBand`: `PASS` (5 suites, 28 tests).
- `npm run test:delivery-assignment -- --runInBand`: `PASS` (7 suites, 64 tests).
- `npm run test:reviews-feedback -- --runInBand`: `PASS` (3 suites, 24 passed, 1 todo).
- `npm run test:delivery-tracking -- --runInBand`: `FAIL` in `delivery-tracking.runtime.spec.ts` checkout setup with expected `200` but received `503`.
- `PAYMENT_PROVIDER=mock APP_ENV=staging npm run test:delivery-tracking -- --runInBand`: `PASS` (4 suites, 33 tests).
- `npx eslint backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader.ts backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader.ts backend/src/slices/reviews-feedback/infrastructure/prisma-staff-metrics.reader.ts tests/slices/admin-access/admin-access-operator-staff-metrics.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-metrics.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-metrics.spec.ts tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts`: `PASS`.
- `git diff --check`: `PASS`.
- Focused grep for `OrderStatus.FAILED`, runtime/admin-web Staff routes, hard delete and prohibited state mutation: `PASS` for TASK-FT019-04 scope.

## Issues found

None blocking for TASK-FT019-04.

## Delivery-tracking plain-env assessment

The plain `delivery-tracking` failure is not a TASK-FT019-04 blocker. It reproduces the reported checkout `503` before delivery-tracking/read-model assertions run, and the same suite passes with the documented guarded mock payment env: `PAYMENT_PROVIDER=mock APP_ENV=staging`. This matches the existing FT-017/FT-018 mock-payment guard policy rather than a staff metrics regression.

## Recommendation

`TASK-FT019-05` may proceed after orchestrator acceptance of this `PASS`.
