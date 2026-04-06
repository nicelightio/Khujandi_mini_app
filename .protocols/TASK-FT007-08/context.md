---
description: Context snapshot for TASK-FT007-08 admin auth HTTP runtime boundary bugfix.
status: active
---

# TASK-FT007-08 Context

- Richer inputs loaded: `tasks/backlog.md`, `features/FT-007-admin-auth-and-session-security.md`, `tasks/plans/IMPL-FT-007-BUGFIX-auth-runtime-cookie-boundary.md`, `bugs/BUG-2026-04-06-ft007-missing-admin-auth-runtime-cookie-boundary.md`, `contracts/admin-auth-contract.md`, `runbooks/security-auth-and-secret-response.md`, `testing/index.md`.
- Scope: deliver the missing real HTTP boundary for `POST /api/v1/admin/auth/login|refresh|logout` with enforced cookie transport policy on top of the owning `admin-access` slice.
- Constraints: keep auth ownership inside `admin-access`, require `Secure` + `HttpOnly` + `SameSite=Lax`, validate `Origin/Referer` server-side, and do not expose secret-bearing tokens to JS-readable storage.
- Fallback usage: none; task-specific bug plan and normative contract are present.
