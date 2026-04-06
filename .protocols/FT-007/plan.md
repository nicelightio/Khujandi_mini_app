---
description: План декомпозиции FT-007 в implementation plan и execution-ready backlog.
status: active
---
# FT-007 Decomposition Plan

## Goal

- Разложить `FT-007` на атомарные implementation tasks для отдельного admin login/password контура, lockout policy, session lifetime enforcement и auth audit без смешения с Mini App auth и без растягивания scope на отдельную provisioning capability.

## Inputs used

- [.memory-bank/features/FT-007-admin-auth-and-session-security.md](../../.memory-bank/features/FT-007-admin-auth-and-session-security.md): owning feature spec, acceptance criteria и verification targets.
- [.memory-bank/epics/EP-003-admin-access-and-security.md](../../.memory-bank/epics/EP-003-admin-access-and-security.md): parent epic и admin security outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-015`, `REQ-016`, `REQ-017`, `REQ-018` и RTM.
- [.memory-bank/contracts/admin-auth-contract.md](../../.memory-bank/contracts/admin-auth-contract.md): login/refresh/logout, hashing, lockout and revocation contract.
- [.memory-bank/runbooks/security-auth-and-secret-response.md](../../.memory-bank/runbooks/security-auth-and-secret-response.md): lockout response и token compromise handling.
- [.memory-bank/invariants.md](../../.memory-bank/invariants.md): auth/RBAC, audit и error contract invariants.
- [.memory-bank/architecture/system-contours-and-slices.md](../../.memory-bank/architecture/system-contours-and-slices.md): `admin-web` contour и `admin-access` slice ownership.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../.memory-bank/architecture/data-boundaries-and-persistence.md): credentials, sessions и auth audit persistence ownership.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): admin-access verification baseline.

## Current repository state

- Existing admin routes for assignment and cancellation already exist in `frontend/src/admin/*`, but they explicitly avoided taking ownership over login/session behavior.
- Backend `admin-access` implementation, Prisma persistence and test harness are still absent, so decomposition must start from docs freeze plus backend/frontend scaffolding.
- Contract and runbook layer already defines baseline auth rules, but MVP still needs an explicit docs-first decision on provisioning baseline and transport/session semantics before execution.

## Decomposition strategy

1. W1: freeze docs-first auth boundary and add backend/frontend scaffolding for `admin-access`.
2. W2: implement backend login, lockout, refresh/logout, rotation, expiry and auth audit semantics.
3. W3: wire admin-web session UX to existing admin pages, then close with repo-local verify evidence and docs sync.

## Constraints

- Admin auth must stay fully separate from Mini App Telegram auth.
- Self-signup is forbidden; only pre-provisioned accounts may authenticate.
- Passwords and refresh tokens are stored only as hashes.
- Lockout, logout and expired session paths must revoke active chains and preserve the unified error contract.
- Existing admin pages must consume one shared auth boundary instead of reimplementing auth rules per route.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-007.md`
- backlog section с `TASK-FT007-*`
- execution-ready W1 task для docs/spec freeze по admin auth, provisioning baseline и session policy
