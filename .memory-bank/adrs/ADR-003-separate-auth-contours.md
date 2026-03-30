---
description: ADR по разделению auth-контуров Mini App и веб-админки.
status: active
---
# ADR-003 Separate Auth Contours

## Decision

Mini App использует Telegram auth, а веб-админка использует отдельный login/password контур.

## Why

- У клиентского и операционного контуров разные trust assumptions и security policies.
- Веб-админке нужны password policy, lockout, session lifetime и audit.
- Это снижает риск смешения прав и surface area.

## Consequences

- Admin auth требует отдельные таблицы credentials/sessions/audit.
- `boss` выполняет provisioning admin accounts.

## Sources

- `doc/PRD.md`
- `doc/API_GUIDELINES.md`
- `doc/DATA_MODEL.md`
