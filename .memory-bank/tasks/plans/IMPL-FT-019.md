---
description: Implementation handoff for FT-019 Staff panel in admin-web.
status: active
---
# IMPL-FT-019 Staff Panel

## Goals

- Add an `admin-web` Staff panel available only to `admin` and `boss`.
- Manage two staff types without a shared CRM abstraction: couriers from `User` role `COURIER`, operators from `AdminAccount` role `OPERATOR`.
- Support active staff lists, boss archive view, soft delete/deactivate, boss-only reactivation, operator password reset and nickname updates.
- Show courier/operator tables, staff cards, manual rating adjustment history and delivery/review-derived metrics.
- Preserve existing auth, delivery lifecycle, review and event ownership boundaries.

## Source Artifacts

- `.memory-bank/features/FT-019-staff-panel.md`
- `.memory-bank/contracts/staff-panel-contract.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/requirements.md`
- `doc/ARCHITECTURE.md`

## Normative Inputs

- `Staff panel` lives in `admin-web` and is available only to `admin` and `boss`.
- `operator` has no access to Staff panel.
- Staff panel creates only operator-level web accounts; `ADMIN` and `BOSS` remain bootstrap/env-managed.
- Operator passwords are stored only as `password_hash`; new plaintext password can be shown only once on create/reset.
- Password reset is `boss` only and must revoke active operator sessions according to `admin-auth-contract`.
- Soft delete/deactivate is used instead of hard delete.
- `admin` sees active staff only; `boss` can see archive/soft-deleted staff and reactivate.
- Courier delivered count uses orders that reached `DELIVERED`; global successful order KPI remains `COMPLETED`.
- Operator processed count uses unique orders with at least one operator write action; read/open/view does not count.
- Courier average review rating comes from `reviews-feedback` client-to-courier reviews and is read-only.
- `FAILED` is not introduced as an order status by FT-019.

## Ownership And Boundaries

- Owning capability: Staff management surface in `admin-web`.
- Primary contour: `admin-web`.
- Touched layers: frontend presentation/API model, backend presentation/application/read-models, domain contracts, persistence and tests.
- Slice ownership:
  - `admin-access`: role/session enforcement, operator `AdminAccount`, password hashing, session revocation.
  - `delivery-assignment`: courier roster state and existing automatic penalty source data.
  - `delivery-tracking`: order lifecycle/status history and operator write-action evidence.
  - `reviews-feedback`: review records for courier average rating.
- Shared extraction is not justified. If implementation appears to require broad shared user/staff code, stop and report an architecture decision request.

## Implementation Waves

### TASK-FT019-01 - Staff persistence and domain contracts

- Scope: backend persistence/domain foundation only.
- Files: `backend/prisma/schema.prisma`, new Prisma migration, `backend/src/slices/admin-access/domain/**/*`, `backend/src/slices/delivery-assignment/domain/**/*`, focused backend tests.
- Verify: explicit structured fields/tables exist for staff nickname/metadata, soft-delete/reactivation metadata and manual rating adjustments; no hard delete path or `OrderStatus.FAILED` is added.
- Quality gates: focused schema/repository tests, `npm run lint`, `git diff --check`.

### TASK-FT019-02 - Operator staff account commands

- Scope: `admin-access` backend application/infra.
- Files: `backend/src/slices/admin-access/**/*`, `tests/slices/admin-access/**/*`.
- Verify: admin/boss can create only `OPERATOR`; duplicate email and weak password fail controlled; `boss` can reset password and revoke operator sessions; plaintext password is returned only once and never persisted/audited.
- Quality gates: admin-access unit/integration tests, secret-leak negative assertions, `npm run lint`, `git diff --check`.

### TASK-FT019-03 - Courier staff roster commands

- Scope: courier staff create/deactivate/reactivate/rating adjustment command boundary.
- Files: `backend/src/slices/delivery-assignment/**/*`, optional staff-panel backend adapter files, `tests/slices/delivery-assignment/**/*`.
- Verify: admin/boss can create courier staff by `telegram_user_id` and nickname; soft delete preserves historical references; only boss can reactivate; manual `+1/-1` adjustments are actor/timestamp recorded and do not mutate review averages.
- Quality gates: focused delivery-assignment/staff tests, `npm run lint`, `git diff --check`.

### TASK-FT019-04 - Staff table metrics read models

- Scope: backend read models only.
- Files: explicit backend read-model/repository files under owning slices, `tests/slices/delivery-tracking/**/*`, `tests/slices/reviews-feedback/**/*`, `tests/slices/admin-access/**/*`.
- Verify: couriers table returns delivered count, order rating, average client review rating and unsuccessful percent from source data; operators table returns unique processed-order count and rating from write-action evidence.
- Quality gates: focused read-model tests with `DELIVERED` vs `COMPLETED`, cancellation/problem buckets and duplicate operator writes.

### TASK-FT019-05 - Staff cards and history read models

- Scope: backend card read models.
- Files: same backend staff read-model boundary, tests for card data.
- Verify: common card metadata, rating adjustment history, last 10 orders and problem blocks are returned without changing order lifecycle or review semantics.
- Quality gates: focused card read-model tests, no `FAILED` enum/schema addition, `git diff --check`.

### TASK-FT019-06 - Admin Staff panel API/runtime routes

- Scope: backend presentation/runtime routes for Staff panel.
- Files: `backend/src/dev-runtime/**/*`, backend route tests and integration tests.
- Verify: role gates allow `admin`/`boss`, reject `operator`; routes expose list/card/create/deactivate/reactivate/rating-adjustment/password-reset commands with canonical error shape.
- Quality gates: runtime/API integration tests, `npm run lint`, `git diff --check`.

### TASK-FT019-07 - Admin-web Staff panel route and tables

- Scope: admin-web route, API client, table shell and access states.
- Files: `frontend/src/admin/**/*`, `frontend/src/tests/admin/**/*`.
- Verify: `/admin/staff` renders only behind protected admin session, shows separate `Couriers` and `Operators` tables, hides archive controls from `admin`, and denies `operator` access.
- Quality gates: focused admin router/API/component tests, `npm run build:frontend`, `npm run lint`, `git diff --check`.

### TASK-FT019-08 - Admin-web roster command workflows

- Scope: admin-web command UX.
- Files: `frontend/src/admin/**/*`, `frontend/src/tests/admin/**/*`.
- Verify: create courier, create operator, soft delete, boss archive/reactivate, boss reset password/nickname edit and rating adjustment workflows handle success/error/duplicate submit states; one-time password display is visible only after create/reset.
- Quality gates: focused admin Staff panel workflow tests, `npm run build:frontend`, `npm run lint`, `git diff --check`.

### TASK-FT019-09 - Admin-web staff cards

- Scope: admin-web card/detail UX.
- Files: `frontend/src/admin/**/*`, `frontend/src/tests/admin/**/*`.
- Verify: courier/operator cards display common metadata, latest orders, problem blocks and rating history using backend read models without exposing delivery mutation controls.
- Quality gates: focused card/component tests, responsive smoke where practical, `npm run build:frontend`, `git diff --check`.

### TASK-FT019-10 - Final verification and Memory Bank sync

- Scope: verification/evidence/docs only unless a blocking bug is found.
- Files: `.tasks/TASK-FT019-10/**/*`, `.memory-bank/requirements.md`, `.memory-bank/features/FT-019-staff-panel.md`, `.memory-bank/testing/index.md`, `.memory-bank/tasks/backlog.md`, `.memory-bank/index.md`, optional runbook/testing docs.
- Verify: final repo-local gates cover RBAC, operator/courier creation, soft delete/archive/reactivation, password hash/one-time display, session revocation, metric semantics and staff cards; `REQ-038` remains planned until evidence supports moving it.
- Quality gates: lint, typecheck/build, focused backend/frontend tests, e2e/admin flow if available, `git diff --check`.

## Expected Touched Files

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/**/migration.sql`
- `backend/src/slices/admin-access/**/*`
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/slices/delivery-tracking/**/*`
- `backend/src/slices/reviews-feedback/**/*`
- `backend/src/dev-runtime/**/*`
- `frontend/src/admin/**/*`
- `frontend/src/tests/admin/**/*`
- `tests/slices/admin-access/**/*`
- `tests/slices/delivery-assignment/**/*`
- `tests/slices/delivery-tracking/**/*`
- `tests/slices/reviews-feedback/**/*`
- `.tasks/TASK-FT019-*/*`
- Relevant Memory Bank docs only when implementation reveals doc drift or final evidence is recorded.

## Tests

- Backend RBAC tests for `admin`/`boss` access and `operator` denial.
- Operator account creation tests for `OPERATOR` only, duplicate email, weak password and hash-only persistence.
- Password reset tests proving active operator sessions are revoked and plaintext is one-time response state only.
- Courier staff command tests for Telegram id/nickname creation, soft delete, boss-only reactivation and historical reference preservation.
- Rating adjustment tests for `+1/-1`, actor/timestamp history and no mutation of review average.
- Courier metrics tests for `DELIVERED` delivered count, unsuccessful percent and review average source data.
- Operator metrics tests for unique order write-action counting and no read/view counting.
- Admin-web route/API/component tests for tables, archive visibility, command workflows and staff cards.

## UAT Steps

1. Login as `admin`; open `/admin/staff`; confirm active Couriers and Operators tables are visible.
2. As `admin`, create a courier by Telegram user id and nickname.
3. As `admin`, create an operator with email/password and confirm the account role is `OPERATOR`.
4. As `operator`, try `/admin/staff` and confirm access is denied.
5. As `admin`, soft-delete a courier/operator and confirm the staff member leaves the default list.
6. As `boss`, open archive, reactivate the staff member and reset an operator password.
7. Confirm the new password is shown once after create/reset and is not visible on refresh or card read.
8. Seed delivered/cancelled/reviewed orders and verify courier/operator metrics and staff cards.

## Risks

- Accidentally allowing Staff panel to create `ADMIN`/`BOSS`.
- Leaking plaintext operator password through logs, audit or repeated reads.
- Treating `DELIVERED` as global successful KPI instead of staff-rating-only delivered count.
- Introducing `FAILED` as a lifecycle state without a separate lifecycle decision.
- Creating a broad shared staff/user abstraction.
- Counting read-only operator views as processed orders.
- Hiding historical references after soft delete.

## Constraints

- Do not implement runtime code in decomposition tasks.
- Do not add hard delete.
- Do not create self-signup.
- Do not move admin auth/session policy out of `admin-access`.
- Do not move delivery lifecycle ownership into Staff panel.
- Do not change review payload semantics.
- Do not use JS-readable storage for admin session secrets.
