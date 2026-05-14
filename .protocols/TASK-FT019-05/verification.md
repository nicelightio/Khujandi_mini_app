---
description: Verification status for TASK-FT019-05 Staff cards and history read models.
status: active
---
# TASK-FT019-05 Verification

## Verdict

`PASS`

## Scope verified

- Owning capability: `FT-019` Staff panel card/history read models.
- Owning contour: `admin-web`.
- Touched slices verified: `admin-access`, `delivery-assignment`, `delivery-tracking`, `reviews-feedback`.
- Touched layers verified: backend domain read-model types, backend infrastructure readers and focused backend tests.
- Shared extraction: not introduced.
- Out-of-scope surfaces verified as not changed by this task: dev-runtime/API routes, admin-web UI, command behavior, schema/migration, lifecycle mutation, hard delete, `OrderStatus.FAILED`.

## Evidence

- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:358` adds `listCourierStaffCards` as a read-only projection over `findMany` calls; it exposes courier Telegram id/nickname, lifecycle metadata, rating history, table metric fields, last 10 orders and last 10 problem orders.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:517` marks active unfinished courier orders as `unfinished`; `:521` treats string `FAILED` only as defensive `future_failed`; `:525` marks client rating `1` evidence; `:539` and `:540` enforce the last-10 limits.
- `backend/src/slices/reviews-feedback/infrastructure/prisma-staff-metrics.reader.ts:106` adds client-rating-one problem evidence; `:143` through `:148` filter to client-authored client-to-courier reviews only.
- `backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader.ts:254` adds operator order-history projection; `:402` collapses duplicate write evidence per order into unique action types; `:403` through `:416` classify personally completed and problem orders; `:434` and `:435` enforce last-10 processed/problem limits.
- `backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader.ts:216` adds operator Staff card composition; `:329` through `:338` expose added/deactivated/reactivated metadata and rating history; `:339` through `:343` expose processed count/rating plus delivery-tracking order blocks.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts:345` and `backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader.ts:341` keep Staff ratings as `floor(count / 100) + manual adjustment (+ courier penalties)` and do not imply `DELIVERED` is the global successful-order KPI.
- `backend/prisma/schema.prisma:10` keeps `OrderStatus` without `FAILED`; focused grep found no `OrderStatus.FAILED`.

## Checks Run

- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-operator-staff-cards.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-cards.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-cards.spec.ts tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts --runInBand`: `PASS` (4 suites, 5 tests).
- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-operator-staff-metrics.spec.ts tests/slices/admin-access/admin-access-operator-staff-cards.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-metrics.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-cards.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-metrics.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-cards.spec.ts tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts --runInBand`: `PASS` (7 suites, 8 tests).
- `npx eslint backend/src/slices/admin-access/domain/admin-access.types.ts backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader.ts backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts backend/src/slices/delivery-tracking/domain/delivery-tracking.types.ts backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader.ts backend/src/slices/reviews-feedback/domain/reviews-feedback.types.ts backend/src/slices/reviews-feedback/infrastructure/prisma-staff-metrics.reader.ts tests/slices/admin-access/admin-access-operator-staff-cards.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-cards.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-cards.spec.ts tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts`: `PASS`.
- `npm run test:admin-access -- --runInBand`: `PASS` (6 suites, 29 tests).
- `npm run test:delivery-assignment -- --runInBand`: `PASS` (8 suites, 65 tests).
- `PAYMENT_PROVIDER=mock APP_ENV=staging npm run test:delivery-tracking -- --runInBand`: `PASS` (5 suites, 34 tests).
- `npm run test:reviews-feedback -- --runInBand`: `PASS` (3 suites, 25 passed, 1 todo).
- `grep -R "OrderStatus\\.FAILED" -n backend/src tests/slices backend/prisma`: `PASS` with no matches.
- `grep -R "FAILED" -n backend/prisma/schema.prisma backend/src/slices/admin-access backend/src/slices/delivery-assignment backend/src/slices/delivery-tracking backend/src/slices/reviews-feedback tests/slices/admin-access tests/slices/delivery-assignment tests/slices/delivery-tracking tests/slices/reviews-feedback | head -120`: only `PaymentStatus.FAILED`, `LOGIN_FAILED` and defensive string `FAILED` card problem-bucket test/reader evidence.
- `grep -R "Staff\\|staff" -n backend/src/dev-runtime frontend/src/admin | head -120`: `PASS` with no matches.
- `grep -R "deleteMany\\|delete(" -n backend/src/slices/admin-access backend/src/slices/delivery-assignment backend/src/slices/delivery-tracking backend/src/slices/reviews-feedback | head -160`: `PASS` with no matches.
- `git diff --check`: `PASS`.

## Issues found

None blocking for TASK-FT019-05.

## Notes

- Plain `delivery-tracking` package tests were not rerun without env guard in this verification because `TASK-FT019-04` already documented the known checkout mock-payment guard failure. The relevant suite passed with `PAYMENT_PROVIDER=mock APP_ENV=staging`, matching the current FT-017/FT-018 runtime guard policy.
- The worktree contains unrelated dirty files from adjacent FT-019/runtime/UI work. This verdict is scoped to TASK-FT019-05 files and checks.

## Recommendation

`TASK-FT019-06` may proceed after orchestrator acceptance of this `PASS`.
