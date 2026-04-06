---
description: Decision log для декомпозиции FT-007 в waves и task cards.
status: active
---
# FT-007 Decision Log

## Decisions

- 2026-04-04: `FT-007` декомпозируется как owning `admin-access` slice для login/password auth, lockout, session lifetime enforcement и auth audit в отдельном `admin-web` contour.
- 2026-04-04: Первая wave начинается с docs freeze, потому что feature acceptance и contract layer требуют явно зафиксировать provisioning baseline, transport/session policy и verify ownership до runtime implementation.
- 2026-04-04: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT007-0X`.
- 2026-04-04: Backend login/lockout и refresh/logout/session lifetime разделены на отдельные core tasks, чтобы не смешивать credential verification с rotation/revocation/idle-timeout semantics.
- 2026-04-04: Frontend admin auth wiring выделяется в отдельную integration wave после backend session semantics, чтобы existing `FT-004`/`FT-006` admin pages переиспользовали единый auth boundary без локальных auth forks.
- 2026-04-04: Session transport для MVP фиксируется как HTTPS-only HttpOnly cookie contour с `SameSite=Lax` baseline и server-side `Origin/Referer` validation вместо bearer-token storage в `admin-web`.
- 2026-04-04: Boss-only provisioning на MVP остается out-of-band (`seed`/manual operator procedure) и не расширяет `FT-007` в отдельный provisioning UI/API.

## Open questions

- Отдельный runtime provisioning command/API для boss может понадобиться после MVP, но сейчас остается out of scope до отдельной feature/spec.

## Notes

- `REQ-018` входит в decomposition scope через auth audit, token/session revocation semantics и единый error contract для login, lockout, refresh expiry и logout.
