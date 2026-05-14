---
description: Handoff for TASK-FT019-02 operator staff account commands.
status: active
---
# TASK-FT019-02 Handoff

## Result

Implementation completed for the scoped `admin-access` backend command/application/infra baseline.
Verifier failure `TASK-FT019-02-S-VERIFY-final-report-code-01` was repaired for password reset actor metadata.

## Added

- Operator staff account creation command for `admin`/`boss`.
- Creation path accepts only `role: operator`; requested `admin`/`boss` roles are rejected before hashing/persistence.
- Duplicate normalized login and weak password cases fail with controlled `AppError`.
- Password plaintext is used only as command input and one-time response state; repository persistence receives hash only.
- Boss-only operator password reset updates `passwordHash`, revokes active operator sessions and writes structured actor metadata through the existing operator staff lifecycle event mechanism.
- Boss-only operator nickname update records `nickname_updated` lifecycle metadata.
- Prisma adapter methods for `AdminAccount(OPERATOR)` and `OperatorStaffLifecycleEvent`.
- Focused tests under `tests/slices/admin-access/admin-access-operator-staff.spec.ts`.

## Not done

- No dev-runtime/API routes.
- No admin-web UI.
- No courier staff commands.
- No metrics/card read models.
- No schema/migration changes.
- No `OrderStatus.FAILED`.
- No shared staff/CRM abstraction.

## Checks

- `npm run test:admin-access -- --runInBand`: `PASS`
- `npx eslint backend/src/slices/admin-access tests/slices/admin-access/admin-access-operator-staff.spec.ts`: `PASS`
- `git diff --check`: `PASS`

## Fix notes

- `TASK-FT019-01` persistence has no dedicated `PASSWORD_RESET` lifecycle action and this fix does not expand schema/enums/public contracts.
- Reset metadata uses the existing `OperatorStaffLifecycleEvent` structure for target, actor and timestamp, with `reason: password_reset` and unchanged nickname fields. Plaintext password is not written into metadata/audit.

## Risks / follow-up notes

- A dedicated persisted `PASSWORD_RESET` lifecycle action remains a possible follow-up contract/schema decision if the orchestrator wants a first-class action instead of the current structured reason-based metadata within the existing lifecycle table.
- Final verifier should specifically inspect secret handling: plaintext appears only in command/test response assertions, never in repository persistence/audit calls.

## Recommendation

`TASK-FT019-03` can proceed after orchestrator/verifier acceptance of `TASK-FT019-02`.
