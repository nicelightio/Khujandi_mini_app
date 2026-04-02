---
description: Decision log для декомпозиции FT-009 в waves и task cards.
status: active
---
# FT-009 Decision Log

## Decisions

- 2026-04-02: `FT-009` декомпозируется как shared frontend/runtime enabling work без создания нового business capability slice.
- 2026-04-02: Первая wave начинается с docs freeze, чтобы до runtime-реализации закрепить `ready()/expand()`, safe-area, stable viewport, lifecycle и verification ownership для shared `REQ-022/023`.
- 2026-04-02: Для детерминированной навигации используются feature-scoped task IDs вида `TASK-FT009-0X`.
- 2026-04-02: Repo-local runtime contract tests и route/page smoke собираются отдельной задачей раньше финального Telegram client-matrix verify, чтобы manual evidence не блокировал внутреннюю runtime стабилизацию.
- 2026-04-02: Реальный Telegram client-matrix scope для customer-facing checkout UI закрывается только в финальной verify/docs-sync задаче `FT-009`, а не возвращается в `FT-002` или `FT-003`.

## Open questions

- Нужен ли отдельный shared shell component/provider поверх `LocalizationBoundary`, либо текущий `AppRouter` сможет безопасно владеть shell runtime orchestration без лишнего усложнения.
- Достаточно ли repo-local browser/runtime smoke для части theme/viewport feedback checks, или потребуется поднять дополнительный deterministic harness до финального client-matrix verify.

## Notes

- `REQ-022` входит в decomposition scope `FT-009` только в части shell persistence/storage policy и JS-readable storage guardrails; auth/session transport closure уже частично реализована в `FT-002`.
- `REQ-023` закрывается совместно с `FT-003`, но именно `FT-009` должен замкнуть shell/runtime client-matrix evidence для catalog и checkout customer-facing flows.
