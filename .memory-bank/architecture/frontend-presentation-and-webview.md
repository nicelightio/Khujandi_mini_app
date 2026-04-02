---
description: WHAT/WHY для frontend presentation boundary, Mini App shell и Telegram WebView UX baseline.
status: active
---
# Frontend Presentation And WebView

## Purpose

Зафиксировать архитектурную границу клиентского presentation-слоя, чтобы WebView shell, i18n, state и UI composition не размывали slice boundaries.

## Architectural decisions

- Frontend организуется по capability slices, а не по набору страниц или технических папок.
- `FT-009` описывает shell baseline клиентского контура и не считается отдельным domain slice.
- Бизнес-логика checkout, tracking и review flows остается внутри owning slices; shell предоставляет только presentation/runtime primitives.
- Telegram WebApp integration, i18n, theme, safe-area, viewport stabilization, lifecycle handling и shell navigation policies живут в `shared` только как technical enabling layer.

## Boundary rules

- `shared/ui` хранит только реально переиспользуемые primitives без бизнес-смысла.
- `shared/state` содержит `session`, `ui` и другие truly cross-slice stores.
- Slice-specific state, orchestration и API mapping остаются внутри `slices/*`.
- Компоненты не обращаются напрямую к persistence или Telegram API без соответствующих helpers/hooks.
- Один runtime adapter слой владеет подписками на `themeChanged`, `viewportChanged`, `safeAreaChanged`, `contentSafeAreaChanged`, `activated`, `deactivated`, BackButton/Close/swipes и feature detection через `isVersionAtLeast()`.

## Shell baseline

- Первый запуск требует language overlay `ru/en/tj`.
- Telegram WebView shell должен поддерживать safe-area, stable viewport, lifecycle restore и theme sync.
- Для pin-to-bottom layout shell использует `viewportStableHeight` и обновляется только по stable viewport signals; `viewportHeight` не считается layout source of truth.
- Safe-area baseline использует Telegram safe-area fields/CSS variables (`--tg-safe-area-inset-*`, `--tg-content-safe-area-inset-*`), а не `env(safe-area-inset-*)` как основной механизм.
- `Telegram.WebApp.ready()` вызывается как можно раньше после essential UI bootstrap; `expand()` и swipe/back policies централизуются в shell, а не в feature-коде.
- Visual confirmations для critical UX допускают Telegram-native popup/confirm primitives там, где обычные web modals недостаточно надежны в WebView.
- Visual feedback (`toast`, `loader`, disabled action states) является baseline UX, а не optional polish.

## Related guide

- [.memory-bank/guides/frontend-slices-and-webview.md](../guides/frontend-slices-and-webview.md): HOW-правила структуры frontend, state, i18n и WebView integration.

## Source artifacts

- [doc/FRONTEND_COMPONENT_GUIDE.md](../../doc/FRONTEND_COMPONENT_GUIDE.md): структура React/Vite фронтенда и Telegram WebView UI rules.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): layered architecture и shared boundary rules.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): language overlay, theme и visual feedback baseline.
