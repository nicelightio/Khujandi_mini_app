---
description: Verification notes for TASK-FT019-06 Staff panel backend API/runtime routes.
status: active
---
# TASK-FT019-06 Verification

## Verdict

`PASS`

## Scope Position

- Owning capability slice: `admin-access`.
- Owning contour: `admin-web` backend API/runtime.
- Touched layers verified: dev-runtime presentation/routes plus narrow `admin-access` application command orchestration.
- Shared extraction: not justified; implementation keeps separate `courier` and `operator` resources/read models and does not add a generic CRM/staff abstraction.

## Evidence

- Route RBAC resolves protected admin session and rejects non-`admin`/`boss` roles with canonical `AppError` payload in `backend/src/dev-runtime/routes/admin-staff.routes.ts:56` and `:65`; runtime spec verifies `OPERATOR` gets `403` with `{ error, trace_id }` in `tests/slices/admin-access/admin-access-staff-runtime.spec.ts:33`.
- Archive visibility is boss-only via `includeInactive` guard and active-row filtering in `backend/src/dev-runtime/routes/admin-staff.routes.ts:77` and `:90`; runtime spec verifies admin default lists hide deactivated staff, admin archive/reactivate is denied, and boss archive/reactivation succeeds in `tests/slices/admin-access/admin-access-staff-runtime.spec.ts:159`.
- Routes are separate courier/operator resources under `/api/v1/admin/staff/couriers` and `/api/v1/admin/staff/operators`; matchers are explicit in `backend/src/dev-runtime/routes/admin-staff.routes.ts:169`.
- Courier create route passes only `telegram_user_id` and `nickname` into `delivery-assignment` in `backend/src/dev-runtime/routes/admin-staff.routes.ts:252`; service/repository create `User(COURIER)` staff data without web password state in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:69` and `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:515`.
- Operator create route delegates to `admin-access`; service rejects non-`operator` requested roles and returns plaintext only as `oneTimePassword` in `backend/src/dev-runtime/routes/admin-staff.routes.ts:313` and `backend/src/slices/admin-access/application/admin-access.service.ts:318`; repository hard-codes `role: "OPERATOR"` and stores `passwordHash` in `backend/src/slices/admin-access/infrastructure/prisma-admin-access.repository.ts:386`.
- Soft deactivate/reactivate are metadata updates, not hard delete. Courier and operator routes are in `backend/src/dev-runtime/routes/admin-staff.routes.ts:267` and `:334`; boss-only reactivation is enforced in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:169` and `backend/src/slices/admin-access/application/admin-access.service.ts:418`.
- Password reset is boss-only, hashes the new password, revokes active sessions and returns the new password once in `backend/src/slices/admin-access/application/admin-access.service.ts:481`; runtime test verifies response/hash boundary in `tests/slices/admin-access/admin-access-staff-runtime.spec.ts:320`, while service test verifies admin denial and no plaintext in persistence/lifecycle calls in `tests/slices/admin-access/admin-access-operator-staff.spec.ts:262`.
- Nickname update is boss-only in `backend/src/dev-runtime/routes/admin-staff.routes.ts:388` and `backend/src/slices/admin-access/application/admin-access.service.ts:521`; service tests cover boss success/admin denial in `tests/slices/admin-access/admin-access-operator-staff.spec.ts:342`.
- Rating adjustments are limited to `+1/-1` by runtime validation in `backend/src/dev-runtime/routes/admin-staff.routes.ts:155`; courier/operator commands persist adjustment history without review-average mutation in `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:207` and `backend/src/slices/admin-access/application/admin-access.service.ts:454`.
- Read endpoints compose prior table/card readers without route-level mutation in `backend/src/dev-runtime/routes/admin-staff.routes.ts:95` and `:128`; runtime test verifies list/card responses include table metrics/history fields in `tests/slices/admin-access/admin-access-staff-runtime.spec.ts:121` and `:356`.
- `OrderStatus.FAILED` was not added: Prisma `OrderStatus` remains `CREATED..CANCELLED_BY_COURIER_UNAVAILABLE` in `backend/prisma/schema.prisma:10`; checked domain order status unions also omit `FAILED` in `backend/src/slices/delivery-tracking/domain/delivery-tracking.types.ts:14` and `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts:14`. Remaining `FAILED` hits are `PaymentStatus.FAILED`, `LOGIN_FAILED`, and defensive read-model problem-bucket string evidence from TASK-FT019-05.
- Frontend Staff UI search found no `/admin/staff` / `Staff panel` frontend additions in `frontend/src`; TASK-FT019-06 implementation report does not list frontend or schema/migration files.

## Checks Run

- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-staff-runtime.spec.ts --runInBand`: `PASS` (1 suite, 4 tests).
- `npm run test:admin-access -- --runInBand`: `PASS` (7 suites, 33 tests).
- `npm run test:delivery-assignment -- --runInBand`: `PASS` (8 suites, 65 tests).
- `PAYMENT_PROVIDER=mock APP_ENV=staging npm run test:delivery-tracking -- --runInBand`: `PASS` (5 suites, 34 tests).
- `npm run test:reviews-feedback -- --runInBand`: `PASS` (3 suites, 25 passed, 1 todo).
- Focused ESLint for TASK-FT019-06 backend/test files: `PASS`.
- Grep/sanity checks for hard delete route, `OrderStatus.FAILED`, frontend Staff UI, and password exposure outside create/reset response: `PASS`.
- `git diff --check`: `PASS`.

## Blockers / Risks

- No blocking issue found.
- Endpoint URL shape is under-specified in the Staff panel contract. The implementation uses existing runtime/admin conventions with `/api/v1/admin/staff/couriers` and `/api/v1/admin/staff/operators`; this is internally consistent but should be treated as the de facto route shape until frontend TASK-FT019-07 consumes it or the contract names URLs explicitly.
- Runtime tests do not separately assert admin-denied password reset/nickname update or invalid rating delta at route level. The service tests cover boss-only reset/nickname rules and hash-only persistence; route-level coverage is still adequate for this thin adapter, but these are useful additions for TASK-FT019-08 workflow tests.
- Worktree contains substantial unrelated dirty changes from previous/parallel work; this verification accepts only TASK-FT019-06 scoped files and behavior.

## Recommendation

Accept `TASK-FT019-06` as `PASS` and allow `TASK-FT019-07` to proceed, with frontend API client tests locked to the observed `/api/v1/admin/staff/couriers` and `/api/v1/admin/staff/operators` route shape unless the orchestrator decides to update the public contract first.
