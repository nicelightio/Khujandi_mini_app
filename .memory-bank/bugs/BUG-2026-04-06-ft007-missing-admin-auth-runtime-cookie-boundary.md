---
description: Archived bug for FT-007 after adding the real admin auth HTTP cookie boundary and transport enforcement.
status: archived
---
# BUG-2026-04-06 FT-007 Missing Admin Auth Runtime Cookie Boundary

## Summary

`FT-007` was closed as if the separate `admin-web` auth contour already existed end-to-end, but the repository currently exposes only slice-local service/controller/module logic for admin auth. The promised runtime HTTP boundary for `POST /admin/auth/login`, `POST /admin/auth/refresh`, and `POST /admin/auth/logout` is not wired in the checked-in backend runtime, and the required cookie transport policy is therefore not actually enforced.

## Detection

- Date: `2026-04-06`
- Detection mode: semantic verification of PR `#6` against `origin/main`
- Reviewed files:
  - `backend/src/slices/admin-access/application/admin-access.service.ts`
  - `backend/src/slices/admin-access/presentation/admin-access.controller.ts`
  - `backend/src/slices/admin-access/presentation/admin-access.module.ts`
  - `frontend/src/admin/api/admin-auth-api.ts`
  - `frontend/src/admin/app/router.tsx`
  - `.memory-bank/contracts/admin-auth-contract.md`
  - `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- Evidence:
  - `frontend/src/admin/api/admin-auth-api.ts` already sends real requests to `/api/v1/admin/auth/login`, `/api/v1/admin/auth/refresh`, and `/api/v1/admin/auth/logout` with `credentials: "include"`.
  - Repository search over `backend/src/**/*.ts` did not find runtime HTTP handlers or a checked-in backend server/runtime adapter that exposes those endpoints.
  - Repository search over `backend/src/**/*.ts` did not find admin-auth cookie set/clear behavior, `Secure`/`HttpOnly`/`SameSite=Lax` enforcement, or `Origin/Referer` validation for state-changing admin auth requests.

## Expected behavior

- `admin-web` must authenticate through real backend HTTP endpoints that own the runtime boundary for login, refresh, and logout.
- The backend must issue and rotate secret-bearing session cookies via HTTPS-only `HttpOnly` cookies and clear them on logout.
- State-changing admin auth requests must enforce the transport constraints fixed in `admin-auth-contract.md`, including `Secure`, `HttpOnly`, `SameSite=Lax`, and server-side `Origin/Referer` validation.

## Actual behavior

- Admin auth semantics exist only at slice/service level.
- The frontend route shell assumes the runtime endpoints exist, but no repo-local backend HTTP path currently fulfills that contract.
- Cookie transport hardening is described in specs but not actually implemented at the admin-auth runtime boundary.

## Impact

- `FT-007` closure is semantically incomplete: the feature does not yet solve the real admin-web login/session problem end-to-end.
- Existing frontend auth flow can only succeed against mocks or out-of-repo assumptions.
- Security-sensitive transport guarantees are currently documentary, not runtime-enforced.
- `REQ-015`, `REQ-017`, and the `FT-007` `REQ-018` closure should not be considered fully trustworthy until the runtime boundary exists.

## Execution notes

- This bug should be fixed inside the owning `admin-access` slice/runtime boundary; do not spread admin auth rules into `shared` or page-local frontend code.
- Reuse the existing session/lockout/audit semantics already implemented in the slice.
- Keep `FT-004` and `FT-006` admin pages behind the same centralized auth boundary.
- Treat cookie transport policy as normative, not optional hardening.

## Suggested fix

- Add a checked-in backend runtime HTTP boundary that exposes `POST /api/v1/admin/auth/login`, `POST /api/v1/admin/auth/refresh`, and `POST /api/v1/admin/auth/logout`.
- Issue/rotate/revoke admin session cookies using the existing `admin-access` service semantics.
- Enforce `Secure`, `HttpOnly`, and `SameSite=Lax` cookie policy and reject invalid `Origin/Referer` on state-changing requests.
- Add backend integration coverage for the HTTP contract and at least one end-to-end admin-web flow against the real runtime boundary.

## Follow-up artifacts

- Backlog task: `TASK-FT007-08`
- Implementation plan: `.memory-bank/tasks/plans/IMPL-FT-007-BUGFIX-auth-runtime-cookie-boundary.md`

## Resolution

- Date: `2026-04-06`
- Added `backend/src/slices/admin-access/presentation/admin-auth-http.ts` as the checked-in runtime boundary for `POST /api/v1/admin/auth/login|refresh|logout`.
- Runtime now enforces `Secure` + `HttpOnly` + `SameSite=Lax` admin cookies and rejects invalid `Origin/Referer` with the project error contract.
- Added repo-local backend HTTP integration coverage and admin frontend runtime smoke proving login/refresh/logout through the real cookie boundary.
