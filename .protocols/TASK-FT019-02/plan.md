---
description: Implementation plan for TASK-FT019-02 operator staff account commands.
status: active
---
# TASK-FT019-02 Plan

## Steps

1. Extend `admin-access` domain contracts with operator staff command inputs/results, password hashing dependency and repository methods.
2. Implement `AdminAccessService` commands:
   - create only `OPERATOR` staff accounts for `admin`/`boss`;
   - reject `ADMIN`/`BOSS` requested roles;
   - reject duplicate login and weak password with controlled `AppError`;
   - return plaintext only as `oneTimePassword` response state;
   - boss-only password reset updates hash and revokes active sessions;
   - boss-only nickname update writes lifecycle metadata.
3. Extend `PrismaAdminAccessRepository` with operator staff persistence methods over `AdminAccount` and `OperatorStaffLifecycleEvent`.
4. Expose thin controller methods without adding runtime routes.
5. Add focused admin-access tests for operator-only create, duplicate/weak password, hash-only persistence, boss-only reset/session revocation and nickname update.
6. Run focused checks and record results in protocol/handoff/report docs.

## Non-goals

- No admin-web route or component.
- No dev-runtime API route.
- No courier staff command.
- No metrics/card read model.
- No schema or migration changes unless a blocking compile issue appears.
