---
description: Execution context for TASK-FT007-02.
status: in_progress
---
# TASK-FT007-02 Context

## Task
- Task ID: `TASK-FT007-02`
- Goal: scaffold backend `admin-access` slice, persistence touchpoints, and repo-local test baseline without claiming full login/refresh/logout runtime closure.

## Loaded inputs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT007-02` card)
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/tasks/plans/IMPL-FT-007.md`
- `.memory-bank/epics/EP-003-admin-access-and-security.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/runbooks/security-auth-and-secret-response.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Normative inputs found
- `TASK-FT007-02` is scaffold-only: it must prepare the owning backend `admin-access` slice and persistence/test baseline, but not close the runtime login/refresh/logout flows yet.
- Credentials, refresh/session persistence, and auth audit ownership must stay inside `admin-access`; shared code may only remain technical/testing primitives.
- The baseline must preserve boss-controlled out-of-band provisioning, password-hash-only storage, hashed refresh tokens, 15-minute access TTL, 3-day refresh lifetime, 30-minute idle timeout, and `login_success/login_failed/locked/logout` audit semantics.

## Existing code patterns inspected
- `backend/prisma/schema.prisma`
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/slices/delivery-tracking/**/*`
- `backend/src/slices/order-cancellation/**/*`
- `backend/src/shared/errors/app-error.ts`
- `backend/src/shared/testing/create-test-context.ts`
- `tests/slices/delivery-assignment/**/*`
- `tests/slices/order-cancellation/**/*`
- `package.json`
- `jest.config.cjs`

## Fallback usage
- Richer task-card fields and `IMPL-FT-007` were available, so classic fallback beyond feature/epic/requirements was not needed.

## Key constraints
- Do not move admin credentials/session invariants into `shared`.
- Keep the scaffold future-ready for `TASK-FT007-04` and `TASK-FT007-05` without silently implementing production login/refresh/logout behavior ahead of those tasks.
