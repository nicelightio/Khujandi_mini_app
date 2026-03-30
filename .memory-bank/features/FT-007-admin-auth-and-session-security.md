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
- Только `boss` provision admin accounts.
- Пароль минимум 12 символов.
- После 5 неудачных попыток за 15 минут учетная запись блокируется на 30 минут.
- Access token живет 15 минут, refresh/session lifetime 3 дня, idle timeout 30 минут.
- Login success/failure/lockout/logout аудируются.

## Edge cases & failure modes

- Заблокированный пользователь получает `429 TOO_MANY_REQUESTS` с единым error contract и `trace_id`.
- Просроченный refresh token не восстанавливает сессию.

## Constraints / invariants

- Временная блокировка логина использует `429 TOO_MANY_REQUESTS`.
- Admin auth отделен от Mini App auth.

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
