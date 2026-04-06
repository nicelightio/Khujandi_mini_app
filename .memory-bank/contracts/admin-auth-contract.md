---
description: Контракт login/password auth для веб-админки MVP.
status: active
---
# Admin Auth Contract

## Endpoints

- `POST /admin/auth/login`
- `POST /admin/auth/refresh`
- `POST /admin/auth/logout`

## Provisioning baseline

- Self-signup отсутствует.
- Provisioning admin accounts делает только `boss`.
- В MVP provisioning остается out-of-band (`seed`/manual operator procedure) и не требует отдельного runtime UI/API внутри `FT-007`.

## Rules

- Минимальная длина пароля: 12 символов.
- После 5 неудачных попыток за 15 минут логин блокируется на 30 минут.
- Блокировка возвращает `429 TOO_MANY_REQUESTS` с единым error contract.

## Credential and token handling

- Пароли хранятся только как `password_hash`; plaintext storage запрещен.
- `refresh_token` хранится только в hash form.
- Refresh token rotation должна происходить на успешном `refresh`, а предыдущий token более не считается валидным.
- Logout, lockout и password change ревокают активную session/refresh chain по соответствующему user/session scope.

## Session policy

- access token: 15 минут
- refresh/session lifetime: 3 дня
- idle timeout: 30 минут
- idle timeout считается по server-side `last_activity_at` / эквивалентному session activity marker, а не по клиентскому таймеру.

## Transport constraints

- Admin auth surface предназначен только для trusted transport boundary (HTTPS/TLS на deploy edge).
- Session transport для MVP фиксируется как HTTPS-only HttpOnly cookie contour; secret-bearing tokens не должны попадать в `localStorage`, `sessionStorage` или иное JS-readable persistent storage.
- Cookie-based auth должен использовать `Secure`, `HttpOnly`, `SameSite=Lax` baseline и server-side `Origin/Referer` validation для state-changing auth requests.
- `POST /admin/auth/login` устанавливает новую cookie-based session chain; `POST /admin/auth/refresh` ротирует refresh token и cookie pair; `POST /admin/auth/logout` очищает и ревокает активную chain.
- Secret-bearing tokens не логируются и не возвращаются в audit payload.

## Audit

- Пишутся `login_success`, `login_failed`, `locked`, `logout`.

## Source artifacts

- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): login/refresh/logout и security baseline.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): credentials, sessions и audit tables.
- [doc/PRD.md](../../doc/PRD.md): password policy, lockout и session lifetime MVP.
