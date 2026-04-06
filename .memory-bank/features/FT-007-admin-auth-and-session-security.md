---
description: Feature C4 L3 для login/password auth-контура веб-админки и security policies.
status: active
---
# FT-007 Admin Auth And Session Security

## REQs

- `REQ-015`, `REQ-016`, `REQ-017`, `REQ-018`

## Use cases

- Provisioned admin входит в веб-админку.
- Сессия refresh-ится в допустимых пределах.
- Неуспешные попытки входа приводят к временной блокировке.

## Acceptance criteria

- Self-signup отсутствует.
- Только `boss` provision admin accounts; в MVP provisioning остается out-of-band (`seed`/manual operator flow) и не требует отдельного self-service UI.
- Пароль минимум 12 символов.
- После 5 неудачных попыток за 15 минут учетная запись блокируется на 30 минут.
- Access token живет 15 минут, refresh/session lifetime 3 дня, idle timeout 30 минут.
- Login success/failure/lockout/logout аудируются.
- Session transport для `admin-web` использует HTTPS-only HttpOnly cookie boundary и не хранит secret-bearing tokens в JS-readable storage.

## Edge cases & failure modes

- Заблокированный пользователь получает `429 TOO_MANY_REQUESTS` с единым error contract и `trace_id`.
- Просроченный refresh token не восстанавливает сессию.

## Constraints / invariants

- Временная блокировка логина использует `429 TOO_MANY_REQUESTS`.
- Admin auth отделен от Mini App auth.
- Boss-controlled provisioning остается отдельной operational procedure и не расширяет `FT-007` до provisioning UI/API.
- Session transport фиксируется как cookie-based: access/refresh tokens передаются только через HTTPS-only HttpOnly cookies; frontend не владеет bearer-token storage.

## Normative inputs

- [.memory-bank/contracts/admin-auth-contract.md](../contracts/admin-auth-contract.md): login/refresh/logout, hashing, revocation и lockout contract.
- [.memory-bank/testing/index.md](../testing/index.md): auth quality gates и verification baseline.

## Verification targets

- `POST /admin/auth/login`
- `POST /admin/auth/refresh`
- `POST /admin/auth/logout`

## Test strategy pointers

- e2e: login/refresh/logout happy path.
- integration: lockout window, audit writes, TTL and idle timeout.

## Verification boundary

- `TASK-FT007-01` фиксирует docs/spec layer: provisioning baseline, cookie transport, lockout/session policy и verify ownership.
- `TASK-FT007-06` закрывает admin-web UX wiring: shared login/protected shell, cookie-backed login/refresh/logout wiring для existing admin pages и controlled feedback для lockout/session expiry.
- `TASK-FT007-07` закрывает final repo-local verification/docs sync: backend/frontend suites, RTM closure и feature-level acceptance confirmation без расширения scope в provisioning UI.

## Implementation status

- `TASK-FT007-01` зафиксировал docs-first boundary: no-self-signup baseline, boss-controlled out-of-band provisioning, lockout/session lifetime policy и HTTPS-only HttpOnly cookie transport.
- `TASK-FT007-02` добавил backend `admin-access` scaffold, Prisma baseline для credentials/sessions/auth audit и repo-local Jest harness без выноса auth invariants в `shared`.
- `TASK-FT007-03` добавил frontend login route, shared protected shell и admin smoke harness для isolated `admin-web` contour.
- `TASK-FT007-04` реализовал backend login flow: password verification только для provisioned accounts, `login_success/login_failed/locked` audit writes, controlled `401/429` outcomes и отсутствие session side effects на rejected attempts.
- `TASK-FT007-05` реализовал refresh/logout/session lifetime enforcement: hashed refresh-token rotation, fixed 3-day session lifetime, 30-minute idle timeout, revocation on logout/expiry/lockout и controlled `401` outcomes для invalid or expired sessions.
- `TASK-FT007-06` подключил admin-web к backend auth boundary через cookie-based auth API, centralized router/protected-shell login flow, controlled expired/restoring/logout feedback и shared auth protection для assignment/cancellation pages без page-local session logic.
- `TASK-FT007-07` закрыл финальную repo-local verification/docs sync: backend `admin-access` и admin frontend suites подтверждают login/refresh/logout, lockout/audit, fixed session lifetime и protected-route UX, поэтому `REQ-015`, `REQ-016`, `REQ-017` и `FT-007`-row для `REQ-018` закрыты в текущем repo-local scope.
