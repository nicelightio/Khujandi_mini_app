---
description: Implementation plan для FT-007 admin auth and session security.
status: active
---
# IMPL-FT-007

## Goal

Доставить `FT-007` как owning `admin-access` slice: только заранее provisioned admin accounts могут входить в `admin-web` через отдельный login/password контур без self-signup, после 5 неудачных попыток за 15 минут включается lockout на 30 минут с `429 TOO_MANY_REQUESTS`, access token живет 15 минут, refresh/session lifetime ограничен 3 днями, idle timeout составляет 30 минут, а login success/failure/lockout/logout всегда фиксируются в audit trail.

## Current state

- `frontend/src/admin/*` уже содержит shell и operational routes для assignment/cancellation, но эти slices сознательно не брали ownership над auth/session scope `FT-007`.
- В backend пока отсутствует owning `admin-access` slice, persistence baseline для credentials/sessions/audit и execution-ready verification harness.
- Docs-first baseline для MVP зафиксирован: admin provisioning остается boss-controlled out-of-band procedure, а session transport использует HTTPS-only HttpOnly cookies без JS-readable token storage.

## REQs

- `REQ-015`
- `REQ-016`
- `REQ-017`
- `REQ-018`

## Normative inputs

- [.memory-bank/features/FT-007-admin-auth-and-session-security.md](../../features/FT-007-admin-auth-and-session-security.md): acceptance criteria, edge cases и verification targets.
- [.memory-bank/epics/EP-003-admin-access-and-security.md](../../epics/EP-003-admin-access-and-security.md): parent epic success criteria и admin security scope.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-015`, `REQ-016`, `REQ-017`, `REQ-018` и RTM.
- [.memory-bank/contracts/admin-auth-contract.md](../../contracts/admin-auth-contract.md): login/refresh/logout, hashing, lockout, revocation и audit contract.
- [.memory-bank/runbooks/security-auth-and-secret-response.md](../../runbooks/security-auth-and-secret-response.md): lockout-response, session compromise и revocation procedure.
- [.memory-bank/invariants.md](../../invariants.md): auth/RBAC, audit и error-contract invariants.
- [.memory-bank/architecture/system-contours-and-slices.md](../../architecture/system-contours-and-slices.md): отдельный `admin-web` contour и owning `admin-access` slice boundary.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): ownership credentials, sessions и auth audit persistence.
- [.memory-bank/testing/index.md](../../testing/index.md): admin-access quality gates и verification baseline.

## Constraints

- Admin auth полностью отделен от Mini App Telegram auth и не должен переиспользовать его transport/session assumptions.
- Self-signup отсутствует; login допускается только для заранее provisioned accounts в рамках boss-controlled policy и out-of-band provisioning baseline.
- Пароли и refresh tokens хранятся только в hash form; secret-bearing tokens не логируются и не попадают в audit payload.
- После 5 неудачных попыток за 15 минут учетная запись блокируется на 30 минут и возвращает `429 TOO_MANY_REQUESTS` по единому error contract.
- Access token живет 15 минут, refresh/session lifetime ограничен 3 днями, idle timeout составляет 30 минут неактивности.
- Logout, lockout и истечение допустимых session limits обязаны ревокать активную session/refresh chain в соответствующем scope.
- Existing admin routes (`assignment`, `cancellation`) должны подключаться к единому auth boundary, а не вводить локальные auth rules внутри отдельных slices.
- Session transport фиксируется как HTTPS-only HttpOnly cookie contour с `SameSite=Lax` baseline и server-side `Origin/Referer` validation для state-changing auth requests.

## Steps

1. Freeze docs-first admin auth boundary, provisioning baseline, transport/session policy и verify ownership для `FT-007`. Status: done.
2. Scaffold backend `admin-access` slice, persistence touchpoints и backend test harness без выноса credentials/session invariants в `shared`.
3. Scaffold minimal admin login/session frontend shell и test harness, который сможет защищать существующие admin routes.
4. Реализовать backend login flow с password verification, failed-attempt tracking, lockout window и auth audit writes.
5. Реализовать refresh/logout/session lifetime enforcement с rotation, revocation, expiry и idle-timeout semantics.
6. Подключить admin-web login/protected-route UX к backend auth flow, сохранив единый controlled error surface для login, lockout, expiry и logout.
7. Добавить integration/e2e coverage, final verify evidence и docs sync по acceptance criteria `FT-007`, не размывая scope в provisioning UI или unrelated admin capabilities.

## Expected touched files

- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-007.md`
- `.memory-bank/index.md`
- `backend/prisma/schema.prisma`
- `backend/src/slices/admin-access/**/*`
- `backend/src/shared/**/*`
- `tests/slices/admin-access/**/*`
- `frontend/src/admin/**/*`
- `frontend/src/tests/admin/**/*`
- `frontend/src/app/**/*`

## Tests

- backend integration: только provisioned admin account может войти; invalid credentials не создают session side effects.
- backend integration: 5 неудачных login attempts за 15 минут приводят к `429 TOO_MANY_REQUESTS`, lockout audit и отсутствию новых sessions.
- backend integration: successful login пишет `login_success`, неуспешный login пишет `login_failed`, lockout пишет `locked`, logout пишет `logout`.
- backend integration: refresh rotation инвалидирует предыдущий refresh token; expired refresh token и idle-expired session не восстанавливают session.
- admin-web e2e: login/refresh/logout happy path и protected-route redirect/session-expired feedback для existing admin pages.
- verify: acceptance criteria `FT-007` полностью закрыты repo-local evidence без выхода в отдельный provisioning capability.

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for admin login/session flow
- verify lockout, audit and session-lifetime evidence for `FT-007`

## UAT steps

1. Подготовить заранее provisioned admin account с валидным password policy и открыть `admin-web` login flow.
2. Выполнить успешный login и убедиться, что protected admin routes становятся доступны, а audit содержит `login_success`.
3. Ввести неверный пароль 5 раз в пределах 15 минут и убедиться, что далее login возвращает `429 TOO_MANY_REQUESTS`, а audit содержит `login_failed` и `locked`.
4. Выполнить refresh в пределах допустимой session lifetime и убедиться, что rotation инвалидирует предыдущий refresh token.
5. Проверить, что session после 30 минут неактивности и после истечения 3 дней не восстанавливается через `refresh`.
6. Выполнить logout и убедиться, что session chain ревокнута, protected routes снова требуют login, а audit содержит `logout`.
