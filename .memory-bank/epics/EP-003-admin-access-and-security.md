---
description: Epic C4 L2 для отдельного auth-контура веб-админки и security policies MVP.
status: active
---
# EP-003 Admin Access And Security

## Value

Дать операционной команде отдельный и безопасный способ входа в веб-админку без смешения с Telegram auth контуром клиента.

## Included features

- `FT-007` admin auth and session security

## Success metrics

- Вход доступен только provisioned admin accounts.
- Политики lockout, TTL access token, refresh lifetime и idle timeout работают предсказуемо.
- Аудит auth-событий пригоден для операционного контроля.

## Acceptance criteria

- Login/password flow работает без self-signup.
- Только `boss` может provision админ-аккаунты.
- После 5 неудачных попыток за 15 минут вход блокируется на 30 минут.
- Login success, failure, lockout и logout аудируются.

## Constraints / invariants

- Пароль >= 12 символов.
- 2FA не входит в MVP.
- Admin auth должен быть полностью отделен от Mini App Telegram auth.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): admin auth scope and security policies.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): admin auth endpoints and error semantics.
- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): admin credentials/sessions/audit model.
