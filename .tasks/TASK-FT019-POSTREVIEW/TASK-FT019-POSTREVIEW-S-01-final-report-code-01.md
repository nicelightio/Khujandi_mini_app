---
description: Post-implementation code review report for FT-019 Staff panel wave.
status: active
---
# TASK-FT019-POSTREVIEW S-01 Final Report Code 01

## Verdict

`FAIL`

## Review Scope

- Role: `SUBAGENT reviewer`.
- Owning contour: `admin-web`.
- Owning/consumed slices: `admin-access`, `delivery-assignment`, `delivery-tracking`, `reviews-feedback`.
- Layers inspected: Memory Bank specs/contracts/status, Prisma schema/migration, backend runtime/application/infra/readers/tests, frontend API/route/UI/tests, protocol/task reports.
- Shared extraction: not justified and not found as a blocking drift.

## Findings

### 1. `P1` Staff-created/reset operator passwords cannot authenticate in the checked-in runtime

Staff runtime creates and resets operator passwords with a SHA-256 hash, but the default admin auth runtime verifier only accepts the seeded boss fixture pair `super-secret-01` / `stored-hash`. The service login path verifies against the stored `passwordHash`, so an operator created through Staff panel receives a one-time password that cannot be used to log in through the default `/admin` auth runtime.

Evidence:

- `backend/src/dev-runtime/routes/admin-staff.routes.ts:12` defines `staffPasswordHashing.hash` as SHA-256.
- `backend/src/dev-runtime/routes/admin-staff.routes.ts:333` uses that hashing dependency on operator create.
- `backend/src/dev-runtime/routes/admin-staff.routes.ts:387` uses the same hashing dependency on password reset.
- `backend/src/dev-runtime/modules/dev-api-runtime.ts:111`-`114` defaults auth verification to `secret === "super-secret-01" && secretHash === "stored-hash"`.
- `backend/src/slices/admin-access/application/admin-access.service.ts:245` verifies login via the injected `passwordHasher.verify(input.password, account.passwordHash)`.
- `backend/src/slices/admin-access/application/admin-access.service.ts:371`-`374` and `:514`-`:518` return the plaintext value only as the one-time create/reset result.
- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts:98`-`119` creates an operator and asserts the hash is not plaintext, but does not attempt login with `strong-password-01`.
- `tests/slices/admin-access/admin-access-staff-runtime.spec.ts:345`-`354` checks reset response/hash storage, but does not assert old password fails and new password succeeds.
- Spec intent: `.memory-bank/features/FT-019-staff-panel.md:30` requires admin-created operator web login, and `.memory-bank/features/FT-019-staff-panel.md:127`-`128` requires operator-only creation with hash-only password storage. `.memory-bank/contracts/admin-auth-contract.md:18`-`19` says Staff provisioning consumes the admin auth contract without changing login/session rules.

Impact:

- Staff panel can appear to provision an operator successfully while producing an unusable login.
- Boss password reset can appear to succeed while also producing an unusable replacement password.
- Existing green runtime tests do not cover the auth boundary that the feature depends on.

Bounded repair recommendation:

- Make the Staff create/reset hashing dependency and admin auth verification dependency compatible in `dev-runtime` by using one checked-in password adapter for both operations, or by seeding/verifying with the same hash scheme.
- Add a runtime regression test: boss creates operator, operator logs in with the one-time password, operator remains forbidden from `/admin/staff`, boss resets the password, old credentials fail and new credentials succeed.

### 2. `P1` Courier Staff deactivation does not make the courier operationally inactive

Courier Staff deactivation only writes Staff lifecycle metadata. It leaves `User.isActive`, `autoOfferEnabled`, availability transitions and auto-offer candidate selection unchanged. A courier hidden from Staff active lists can still remain operationally active or re-enable work through delivery-assignment paths.

Evidence:

- Contract effect says deactivated staff becomes inactive/soft-deleted: `.memory-bank/contracts/staff-panel-contract.md:79`-`86`.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:621`-`628` updates only `staffDeactivatedAt` and `staffDeactivatedByAdminAccountId`.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:706`-`720` selects auto-offer candidates by `role`, `isActive`, `autoOfferEnabled` and `acceptingOrdersUntil`, with no `staffDeactivatedAt` exclusion.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:737`-`748` can set `isActive: true` on start work, with no Staff lifecycle guard.
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts:781`-`790` can set `autoOfferEnabled`, with no Staff lifecycle guard.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:243`-`304` checks only courier existence/current availability for start/stop/auto-offer participation.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:568`-`579` creates broadcast offers from candidate couriers and `toAvailability`.
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts:855`-`864` derives active/free state from `isActive`, cutoff and `autoOfferEnabled`, not Staff lifecycle.
- `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts:239`-`274` verifies metadata and lifecycle event, but not operational ineligibility.

Impact:

- A courier deactivated from Staff panel can still be eligible for broadcast auto-offers if they were active/auto-offer enabled.
- A deactivated courier can potentially use existing Telegram delivery-assignment availability paths to resume active work.
- This violates the Staff contract wording and hides a real operations bug behind a Staff-list visibility test.

Bounded repair recommendation:

- On Staff deactivation, either also set delivery operational state to inactive and disable auto-offer, or make delivery-assignment availability/auto-offer/claim paths fail closed when `staffDeactivatedAt !== null`.
- Add regression tests for: deactivated active courier is absent from auto-offer candidates, cannot start work, cannot enable auto-offer, and becomes eligible again only after boss reactivation.

### 3. `P3` Memory Bank RTM/status drift remains for `REQ-038`

The implementation/status docs mark FT-019 as done and verified, but the RTM row still marks the related requirement as planned.

Evidence:

- `.memory-bank/requirements.md:107` keeps `REQ-038` lifecycle as `planned`.
- `.memory-bank/features/FT-019-staff-panel.md:11`-`13` says `TASK-FT019-10` final verification passed.
- `.memory-bank/tasks/backlog.md:150`-`152` marks `FT-019 Staff panel` as `done`.
- `.tasks/TASK-FT019-10/TASK-FT019-10-S-VERIFY-final-report-code-01.md` reports `PASS`.

Impact:

- Specs/status are internally inconsistent, so future agents may make conflicting assumptions about whether `REQ-038` is accepted.
- Because this post-review verdict is `FAIL`, flipping the RTM to verified now would also be misleading.

Bounded repair recommendation:

- Leave `REQ-038` non-verified until the two P1 repairs are complete, then update the RTM/status docs in one verification closure step.

## Non-Blocking Notes / Gaps

- No hard-delete Staff implementation was found; hard-delete hits are docs/negative assertions.
- No `OrderStatus.FAILED` enum drift was found. Broad `FAILED` hits are payment/login statuses or defensive Staff problem-bucket strings/tests, not an added order lifecycle state.
- Frontend Staff route/nav/RBAC and one-time password rendering look aligned with the contract: operator is forbidden before Staff fetch, Staff nav is hidden for operator, password hash is not rendered, and plaintext is limited to create/reset result state.
- Full repo `tsc` was not rerun in this review; prior reports classify current full-repo diagnostics as non-Staff/mixed residual drift. This review focused on Staff correctness and targeted Staff tests.

## Files Inspected

- Specs/status: `.memory-bank/mbb/index.md`, `.memory-bank/spec-index.md`, `doc/ARCHITECTURE.md`, `.memory-bank/index.md`, `.memory-bank/product.md`, `.memory-bank/requirements.md`, `.memory-bank/epics/EP-002-delivery-operations.md`, `.memory-bank/epics/EP-003-admin-access-and-security.md`, `.memory-bank/features/FT-019-staff-panel.md`, `.memory-bank/contracts/staff-panel-contract.md`, `.memory-bank/contracts/admin-auth-contract.md`, `.memory-bank/contracts/operator-delivery-ops-contract.md`, `.memory-bank/architecture/data-boundaries-and-persistence.md`, `.memory-bank/states/order-lifecycle.md`, `.memory-bank/tasks/plans/IMPL-FT-019.md`, `.memory-bank/tasks/backlog.md`.
- Protocol/task artifacts: `.protocols/FT-019/decision-log.md`, `.protocols/FT-019/plan.md`, `.protocols/TASK-FT019-01..10/*`, `.tasks/TASK-FT019-01..10/*`, `.tasks/TASK-FT019-DECOMP/*`.
- Persistence: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260513190000_remove_manager_role/migration.sql`, `backend/prisma/migrations/20260514120000_add_ft019_staff_persistence/migration.sql`.
- Backend Staff files: `backend/src/dev-runtime/modules/dev-api-runtime.ts`, `backend/src/dev-runtime/routes/admin-staff.routes.ts`, `backend/src/slices/admin-access/application/admin-access.service.ts`, `backend/src/slices/admin-access/domain/admin-access.types.ts`, `backend/src/slices/admin-access/infrastructure/prisma-admin-access.repository.ts`, `backend/src/slices/admin-access/infrastructure/prisma-operator-staff-metrics.reader.ts`, `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`, `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`, `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`, `backend/src/slices/delivery-assignment/infrastructure/prisma-courier-staff-metrics.reader.ts`, `backend/src/slices/delivery-tracking/infrastructure/prisma-operator-staff-metrics.reader.ts`, `backend/src/slices/reviews-feedback/infrastructure/prisma-staff-metrics.reader.ts`.
- Frontend Staff files: `frontend/src/admin/api/admin-staff-api.ts`, `frontend/src/admin/components/admin-staff-page.tsx`, `frontend/src/admin/routes/admin-staff-route.tsx`, `frontend/src/admin/app/router.tsx`, `frontend/src/admin/components/admin-protected-shell.tsx`, `frontend/src/admin/components/admin-dashboard-page.tsx`, `frontend/src/admin/components/admin-forbidden-route.tsx`.
- Tests: `tests/slices/admin-access/admin-access-operator-staff.spec.ts`, `tests/slices/admin-access/admin-access-operator-staff-metrics.spec.ts`, `tests/slices/admin-access/admin-access-operator-staff-cards.spec.ts`, `tests/slices/admin-access/admin-access-staff-runtime.spec.ts`, `tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts`, `tests/slices/delivery-assignment/delivery-assignment-courier-staff-metrics.spec.ts`, `tests/slices/delivery-assignment/delivery-assignment-courier-staff-cards.spec.ts`, `tests/slices/delivery-tracking/delivery-tracking-operator-staff-metrics.spec.ts`, `tests/slices/delivery-tracking/delivery-tracking-operator-staff-cards.spec.ts`, `tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts`, `frontend/src/tests/admin/admin-staff-api.spec.ts`, `frontend/src/tests/admin/admin-staff-route.spec.tsx`, `frontend/src/tests/admin/admin-router.spec.tsx`.

## Checks Run

- `git diff --check`: `PASS`.
- `npx jest --config jest.config.cjs tests/slices/admin-access/admin-access-operator-staff.spec.ts tests/slices/admin-access/admin-access-operator-staff-metrics.spec.ts tests/slices/admin-access/admin-access-operator-staff-cards.spec.ts tests/slices/admin-access/admin-access-staff-runtime.spec.ts --runInBand`: `PASS`, 4 suites / 12 tests.
- `npx jest --config jest.config.cjs tests/slices/delivery-assignment/delivery-assignment-courier-staff.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-metrics.spec.ts tests/slices/delivery-assignment/delivery-assignment-courier-staff-cards.spec.ts --runInBand`: `PASS`, 3 suites / 9 tests.
- `npx jest --config jest.config.cjs tests/slices/delivery-tracking/delivery-tracking-operator-staff-metrics.spec.ts tests/slices/delivery-tracking/delivery-tracking-operator-staff-cards.spec.ts tests/slices/reviews-feedback/reviews-feedback-staff-metrics.spec.ts --runInBand`: `PASS`, 3 suites / 4 tests.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-staff-api.spec.ts frontend/src/tests/admin/admin-staff-route.spec.tsx frontend/src/tests/admin/admin-router.spec.tsx --runInBand`: `PASS`, 3 suites / 46 tests.
- `grep -RIn "OrderStatus\\.FAILED\\|status: ['\\\"]FAILED\\|FAILED" backend/src tests/slices backend/prisma/schema.prisma | head -80`: no `OrderStatus.FAILED`; remaining hits are payment/login statuses or defensive Staff problem strings/tests.
- `grep -RIn "MANAGER" backend/src frontend/src tests/slices backend/prisma/schema.prisma .memory-bank/features/FT-019-staff-panel.md .memory-bank/contracts/staff-panel-contract.md .memory-bank/tasks/plans/IMPL-FT-019.md | head -80`: no output.
- `grep -RIn "passwordHash\\|password_hash\\|oneTimePassword" frontend/src/admin frontend/src/tests/admin backend/src/dev-runtime/routes/admin-staff.routes.ts backend/src/slices/admin-access tests/slices/admin-access | head -120`: expected create/reset/hash-only references and negative frontend leakage tests; no Staff detail/list hash rendering found.

## Serious Bugs

- Staff-created/reset operator login is broken in the default runtime auth boundary.
- Courier Staff deactivation does not deactivate the courier operationally.

## Recommendation

Do not accept FT-019 as closed yet. Open two bounded repair tasks before final acceptance:

1. `TASK-FT019-POSTFIX-01`: unify Staff password hashing and auth verification in `dev-runtime`, then add login-after-create/reset regression coverage.
2. `TASK-FT019-POSTFIX-02`: enforce courier Staff deactivation in delivery-assignment operational availability/auto-offer paths, then add regression coverage for active/auto-offer courier deactivation and boss reactivation.

After both repairs pass, rerun focused Staff backend/frontend suites and then reconcile `REQ-038` RTM status in `.memory-bank/requirements.md`.
