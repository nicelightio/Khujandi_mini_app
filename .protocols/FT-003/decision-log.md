---
description: Decision log для декомпозиции FT-003 в waves и task cards.
status: active
---
# FT-003 Decision Log

## Decisions

- 2026-04-02: `FT-003` декомпозируется как shared frontend/runtime enabling work без создания отдельного domain slice.
- 2026-04-02: Первая wave начинается с docs freeze, потому что feature spec прямо требует зафиксировать default language policy до реализации.
- 2026-04-02: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT003-0X`.
- 2026-04-02: Post-auth language sync реализуется через уже существующий Mini App auth/profile contour, а не через новый параллельный backend module.
- 2026-04-02: Telegram-specific verification для localization ограничивается overlay/persistence/client-matrix evidence; shell theme/safe-area/lifecycle baseline остается зоной `FT-009`.

## Open questions

- Должен ли runtime implementation использовать `ru` как единственный pre-auth default или разрешен UI hint из `Telegram user.language_code` после validated auth context, пока explicit user choice еще не сохранен.
- Нужен ли отдельный lightweight `/profile` preference endpoint для sync выбранного языка, либо достаточно расширить существующий auth/session contour.

## Notes

- `REQ-022` и `REQ-023` входят в decomposition scope как cross-cutting constraints для storage policy и Telegram-specific verification, хотя primary feature mapping остается у `FT-003`.
