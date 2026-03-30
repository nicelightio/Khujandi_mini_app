---
description: Feature C4 L3 для базового Telegram WebView UX и shell-поведения клиентского Mini App.
status: active
---
# FT-009 Mini App Shell And WebView UX

## REQs

- `REQ-019`

## Use cases

- Клиент открывает Mini App в Telegram WebView без layout-jump проблем.
- Пользователь взаимодействует с каталогом и checkout в адаптивном интерфейсе с явной обратной связью.

## Acceptance criteria

- Mini App корректно работает в Telegram WebView на мобильных сценариях.
- Поддерживаются светлая и темная темы.
- Safe-area inset и стабильная высота viewport учитываются в shell-слое.
- Действия пользователя сопровождаются визуальной обратной связью: `toast`, `loader`, `disabled action state`.
- UI-компоненты остаются отделены от бизнес-логики.

## Edge cases & failure modes

- Экран не должен "прыгать" при изменении viewport в WebView.
- Асинхронные действия не должны допускать silent double-submit без визуального состояния загрузки.

## Constraints / invariants

- Это baseline UX для MVP, а не post-MVP polish.
- Shell-требования не должны размазывать domain logic по UI-слою.

## Normative inputs

- [.memory-bank/architecture/frontend-presentation-and-webview.md](../architecture/frontend-presentation-and-webview.md): shell boundary и presentation ownership.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для WebView shell smoke и action feedback.

## Test strategy pointers

- e2e: Telegram WebView shell smoke, theme/safe-area rendering, action feedback.
- unit: shell state helpers and theme/language persistence glue.
