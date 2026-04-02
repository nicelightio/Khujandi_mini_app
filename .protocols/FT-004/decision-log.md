---
description: Decision log для декомпозиции FT-004 в waves и task cards.
status: active
---
# FT-004 Decision Log

## Decisions

- 2026-04-02: `FT-004` декомпозируется как owning `delivery-assignment` slice без переноса status-machine логики следующих переходов в текущий scope.
- 2026-04-02: Первая wave начинается с docs freeze, потому что feature acceptance явно требует зафиксировать RBAC, `order.assigned`, targeted notification и audit/error semantics до runtime implementation.
- 2026-04-02: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT004-0X`.
- 2026-04-02: `admin-access` остается отдельной capability `FT-007`; task cards `FT-004` переиспользуют admin auth/RBAC boundary, но не включают login/session implementation.
- 2026-04-02: Верификация `FT-004` включает backend integration для RBAC/state/audit/event semantics и минимум один admin assignment e2e flow с targeted courier notification evidence.

## Open questions

- Нужен ли в runtime отдельный статус доступности курьера уже на этапе `FT-004`, либо initial implementation ограничится active-role validation и оставит richer availability policy на последующие delivery tasks.
- Какой минимальный admin-web UX baseline достаточно для e2e в текущем репозитории до полной реализации `FT-007`: thin protected route с seeded auth fixture или более явная operator page.

## Notes

- `REQ-018` входит в decomposition scope именно через assignment audit/error contract; общая error/audit поверхность для дальнейших delivery transitions остается у `FT-005` и `FT-006`.
