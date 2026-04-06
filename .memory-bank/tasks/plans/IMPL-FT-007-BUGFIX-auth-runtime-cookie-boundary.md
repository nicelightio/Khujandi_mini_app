---
description: Bugfix plan for FT-007 runtime HTTP auth boundary and cookie transport enforcement.
status: active
---
# IMPL-FT-007-BUGFIX-auth-runtime-cookie-boundary

## Goal

Доставить реальный checked-in runtime boundary для `FT-007`, чтобы `admin-web` входил через backend HTTP endpoints и cookie-based session contour, а не только через slice-level service/controller semantics.

## Bug linkage

- `.memory-bank/bugs/BUG-2026-04-06-ft007-missing-admin-auth-runtime-cookie-boundary.md`
- Backlog task: `TASK-FT007-08`

## Current state

- `admin-access` slice уже владеет login, lockout, refresh rotation, logout revocation и audit semantics.
- `frontend/src/admin/api/admin-auth-api.ts` и `frontend/src/admin/app/router.tsx` уже ожидают runtime HTTP contract.
- В repo отсутствуют backend HTTP handlers, cookie transport enforcement и явный checked-in backend runtime adapter/server shell для admin auth.

## Normative inputs

- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/runbooks/security-auth-and-secret-response.md`
- `.memory-bank/testing/index.md`

## Constraints

- Не выносить ownership admin auth в `shared` без необходимости.
- Не хранить secret-bearing tokens в JS-readable storage.
- Cookie policy должна соблюсти `Secure`, `HttpOnly`, `SameSite=Lax` baseline.
- State-changing auth requests должны иметь server-side `Origin/Referer` validation согласно contract layer.
- Existing admin routes должны остаться за единым auth boundary без page-local auth logic.

## Steps

1. Добавить minimal checked-in backend runtime adapter/server shell, который экспонирует `POST /api/v1/admin/auth/login`, `POST /api/v1/admin/auth/refresh`, `POST /api/v1/admin/auth/logout` поверх existing `admin-access` service semantics.
2. Реализовать выдачу, rotation и очистку cookie pair для admin session chain без возврата secret-bearing tokens в JS-readable storage.
3. Зафиксировать и применить transport validation: `Secure`, `HttpOnly`, `SameSite=Lax`, `Origin/Referer` checks для state-changing auth requests.
4. Подключить existing frontend admin auth API к реальному runtime boundary без изменения page-level auth ownership.
5. Добавить integration/e2e verification именно для HTTP boundary и cookie behavior, а не только для module/controller level.
6. Обновить feature/docs closure так, чтобы `FT-007` снова опирался на фактическое runtime evidence.

## Expected touched files

- `.memory-bank/bugs/BUG-2026-04-06-ft007-missing-admin-auth-runtime-cookie-boundary.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/contracts/admin-auth-contract.md` при необходимости
- `.memory-bank/changelog.md`
- `backend/src/**/admin-auth*`, `backend/src/**/http*`, `backend/src/**/server*` в owning runtime boundary
- `backend/src/slices/admin-access/**/*`
- `tests/slices/admin-access/**/*`
- `frontend/src/admin/**/*`
- `frontend/src/tests/admin/**/*`

## Tests

- backend integration: реальные HTTP `login/refresh/logout` handlers доступны из checked-in runtime boundary и возвращают contract-compliant responses.
- backend integration: login выставляет cookie pair с expected attributes; logout очищает cookies; refresh ротирует refresh cookie.
- backend integration: invalid `Origin/Referer` для state-changing auth requests блокируется controlled error contract.
- frontend/admin integration or e2e smoke: protected route restore/login/logout работает через реальный backend runtime boundary.

## Verify

- `admin-web` login path работает end-to-end без mock-only assumptions и без out-of-repo runtime gaps.
- Runtime transport policy соответствует `admin-auth-contract.md`, а не только slice-local tests.
- Final evidence подтверждает именно существование и работоспособность HTTP cookie contour.
