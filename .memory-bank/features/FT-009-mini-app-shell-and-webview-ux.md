---
description: Feature C4 L3 для базового Telegram WebView UX и shell-поведения клиентского Mini App.
status: active
---
# FT-009 Mini App Shell And WebView UX

## REQs

- `REQ-019`
- `REQ-022`
- `REQ-023`

## Current implementation state

- `TASK-FT009-01` completed the docs-first freeze for shell/runtime ownership, shared storage boundary, and Telegram-specific verify routing against `FT-002` and `FT-003`.
- `TASK-FT009-02` added the app-level shell boundary, shared shell state/context scaffold, and repo-local runtime bridge test harness needed before wiring real Telegram runtime events.
- `TASK-FT009-03` now wires `ready()/expand()`, centralized runtime event handling, stable viewport/safe-area CSS propagation, and graceful non-Telegram fallback into the shared app shell baseline.
- `TASK-FT009-04` now connects catalog and checkout to the shared shell layout/policy layer, including centralized back/swipe metadata and shell-owned action feedback framing without moving auth/payment logic into shared UI.
- `TASK-FT009-06` completed the shell/runtime closure for `FT-009`: repo-local shell/runtime gates pass and operator-confirmed Android Telegram verification closes the shell-owned customer-facing catalog/checkout WebView behavior without requiring screenshots as blocking artifacts.
- This closure does not by itself close the shared `REQ-022/023` rows while `FT-002` still lacks a non-stubbed mounted checkout runtime in the checked-in app path.

## Use cases

- Клиент открывает Mini App в Telegram WebView без layout-jump проблем.
- Пользователь взаимодействует с каталогом и checkout в адаптивном интерфейсе с явной обратной связью.

## Acceptance criteria

- Mini App корректно работает в Telegram WebView на мобильных сценариях.
- Поддерживаются светлая и темная темы.
- Safe-area inset и стабильная высота viewport учитываются в shell-слое.
- Действия пользователя сопровождаются визуальной обратной связью: `toast`, `loader`, `disabled action state`.
- UI-компоненты остаются отделены от бизнес-логики.
- Все обращения к `Telegram.WebApp.*` проходят через единый runtime adapter; feature usage защищен `isVersionAtLeast()` и graceful fallback.
- Shell использует `viewportStableHeight` и stable viewport events для pin-to-bottom layout; `viewportHeight` не используется как основной layout anchor.
- Safe-area baseline использует Telegram safe-area fields/CSS variables, а не `env(safe-area-inset-*)`.
- Shell обрабатывает `activated/deactivated`, centralized back/swipe policy и ранний `ready()` bootstrap.
- Для critical WebView confirmations допускаются Telegram-native popup/confirm primitives по shell policy.
- `FT-009` владеет только shared shell/runtime частью `REQ-022`: safe-area/theme/viewport/lifecycle policy, centralized swipe/back behavior и non-sensitive shell persistence boundary без хранения session identifiers в JS-readable storage.
- `FT-009` не переносит в shell auth/session transport из `FT-002` и language-choice domain behavior из `FT-003`; feature использует их как already-owned boundaries.
- Telegram-specific real-client evidence для customer-facing Mini App flows, включая checkout UI, закрывается на уровне shell/runtime verification этой feature; обязательный blocking baseline для текущего MVP ограничен `Android Telegram` и operator-confirmed notes.

## Edge cases & failure modes

- Экран не должен "прыгать" при изменении viewport в WebView.
- Асинхронные действия не должны допускать silent double-submit без визуального состояния загрузки.
- Отсутствие некоторых Telegram API на старом клиенте не должно ломать приложение; shell переходит в documented fallback mode.

## Constraints / invariants

- Это baseline UX для MVP, а не post-MVP polish.
- Shell-требования не должны размазывать domain logic по UI-слою.

## Normative inputs

- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): runtime adapter boundary, storage split, and ownership rules between `FT-002`, `FT-003`, and `FT-009`.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../architecture/frontend-presentation-and-webview.md): shell boundary и presentation ownership.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для WebView shell smoke и action feedback.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../runbooks/telegram-mini-app-verification.md): runtime/client-matrix verify ownership.

## Verify ownership boundary

- `FT-009` владеет shell bootstrap, runtime adapter events, safe-area/theme/viewport/lifecycle behavior, centralized swipe/back policy, and real Telegram runtime evidence for customer-facing catalog/checkout UI.
- `FT-002` сохраняет ownership над Telegram auth/session transport, trusted payment confirmation, and transport/source verification.
- `FT-003` сохраняет ownership над first-run language overlay, explicit language persistence, fallback-to-`ru`, and post-auth profile sync.

## Test strategy pointers

- e2e: Telegram WebView shell smoke, theme/safe-area rendering, action feedback.
- unit: shell state helpers and theme/shared-persistence glue.
- contract tests: runtime adapter for theme/viewport/safe-area/lifecycle events.
- repo-local closure: deterministic Jest coverage for shell state, adapter events, catalog shell markers, and checkout visual feedback before real-client verify.
- verify: Telegram test environment/manual run в `Android Telegram` для shell/runtime behavior, включая customer-facing checkout UI после интеграции shell/runtime baseline; operator-confirmed notes are sufficient for closure, while `iOS/Desktop` evidence and screenshots/videos remain optional hardening artifacts. `FT-002` transport checks and `FT-003` language-domain assertions stay outside this scope.
