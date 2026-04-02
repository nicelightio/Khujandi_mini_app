---
description: HOW-гайд по организации React/Vite frontend, shared state и Telegram WebView shell.
status: active
---
# Frontend Slices And WebView

## Related architecture

- [.memory-bank/architecture/frontend-presentation-and-webview.md](../architecture/frontend-presentation-and-webview.md): WHAT/WHY для frontend presentation boundary.

## Recommended layout

```text
frontend/src/
  app/
  slices/
    <capability>/
      routes/
      components/
      hooks/
      api/
      model/
  shared/
    ui/
    lib/
    state/
    telegram/
    i18n/
    styles/
```

## Placement rules

- `routes/`: screen-level containers и route composition.
- `components/`: slice-specific UI.
- `hooks/`: orchestration клиентского поведения.
- `api/`: HTTP mapping конкретного slice.
- `model/`: slice-local state, selectors и view-model rules.
- `shared/state`: только truly global session/ui state.

## WebView shell checklist

- вызвать `Telegram.WebApp.ready()` рано;
- по необходимости вызвать `Telegram.WebApp.expand()`;
- использовать единый runtime adapter для всех `Telegram.WebApp.*` обращений;
- учитывать Telegram safe-area fields/CSS variables `--tg-safe-area-inset-*` и `--tg-content-safe-area-inset-*`, а не `env(safe-area-inset-*)` как baseline;
- стабилизировать высоту через `viewportStableHeight` и `viewportChanged(isStateStable=true)`;
- обновлять theme variables по `themeChanged`;
- обрабатывать `activated/deactivated` как shell lifecycle signals;
- применять feature detection через `isVersionAtLeast()` и graceful fallback;
- не допускать double-submit без loader/disabled state.

## i18n and persistence

- first-run language overlay обязателен;
- выбор языка хранится по explicit fallback policy `DeviceStorage -> CloudStorage -> localStorage`, а после auth синхронизируется с backend profile при наличии такого контура;
- компоненты не пишут напрямую в `localStorage`; используйте helpers в `shared/lib`.
- session identifiers не хранятся в `localStorage`.

## Source artifacts

- [doc/FRONTEND_COMPONENT_GUIDE.md](../../doc/FRONTEND_COMPONENT_GUIDE.md): frontend structure и WebView specifics.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): language/theme/feedback baseline.
