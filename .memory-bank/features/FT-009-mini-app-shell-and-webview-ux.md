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
- `TASK-FT009-07` adds the first shell-owned bottom action primitive for customer-facing CTA surfaces: `PageShell` now exposes a shared sticky footer action zone and checkout routes its primary CTA through that shell-owned path instead of page-local placement, with focused shell/page/route coverage.
- `TASK-FT009-08` adds the minimal shell-owned capability/degradation policy: the Telegram bridge now exposes one runtime capability snapshot, shared shell state derives one centralized enhanced-vs-minimal policy from it, and `AppShell` plus `PageShell` now use that policy for native chrome access and bottom-action layout/effect fallback instead of hardcoded assumptions in feature code.
- Post-change `red-verify` for `TASK-FT009-07` returned `semantic-concern`: ownership moved into the shell correctly, but explicit Telegram keyboard-open reachability evidence and wider validation of the new page-level scroll model still remain for the follow-up hardening wave.
- Post-change `red-verify` for `TASK-FT009-08` also returned `semantic-concern`: policy ownership is now centralized correctly, but the reduced-runtime path was still degrading the shell-owned bottom-action layout itself to `inline`; `TASK-FT009-09` has now corrected the repo-local policy to keep the conservative `keyboard-safe` CTA primitive on degraded Telegram runtime paths, while fresh Android Telegram evidence is still pending for full closure.
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
- Визуальная выразительность shell строится static-first средствами: typography, spacing, hierarchy, gradients и quality states дают основной perceived quality еще до добавления heavy motion.
- UI-компоненты остаются отделены от бизнес-логики.
- Все обращения к `Telegram.WebApp.*` проходят через единый runtime adapter; feature usage защищен `isVersionAtLeast()` и graceful fallback.
- Shell использует `viewportStableHeight` и stable viewport events для pin-to-bottom layout; `viewportHeight` не используется как основной layout anchor.
- Safe-area baseline использует Telegram safe-area fields/CSS variables, а не `env(safe-area-inset-*)`.
- Shell обрабатывает `activated/deactivated`, centralized back/swipe policy и ранний `ready()` bootstrap.
- Shell предоставляет shared keyboard-safe layout и bottom action zone primitives для CTA/input-heavy surfaces; keyboard-open и safe-area changes не должны прятать critical action.
- High-churn runtime propagation остается централизованной в shell: feature-код опирается на derived stable state/CSS vars и не требует raw runtime subscriptions по slices.
- Для critical WebView confirmations допускаются Telegram-native popup/confirm primitives по shell policy.
- Customer-facing shell должен оставаться отзывчивым на weak/mid Android Telegram WebView; тяжелые визуальные эффекты и зависимости допустимы только точечно, lazy и с graceful fallback.
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
- Runtime budget является частью shell contract: responsiveness, stable scroll и WebView predictability важнее дорогих декоративных эффектов.
- Shell baseline не должен зависеть от тяжелых runtime styling/animation layers или per-frame animation loops как обязательной основы интерфейса.
- Graceful degradation для weak Android и старых Telegram clients централизуется в shell-level policy; optional effects должны быть отключаемыми без влияния на доменные user flows.
- High-churn runtime updates не должны превращать весь app tree в frequent React churn; shell-owned propagation обязана оставаться дешевой для repeated viewport/theme/safe-area changes.

## Normative inputs

- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): runtime adapter boundary, storage split, and ownership rules between `FT-002`, `FT-003`, and `FT-009`.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../architecture/frontend-presentation-and-webview.md): shell boundary и presentation ownership.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для WebView shell smoke и action feedback.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../runbooks/telegram-mini-app-verification.md): runtime/client-matrix verify ownership.

## Verify ownership boundary

- `FT-009` владеет shell bootstrap, runtime adapter events, safe-area/theme/viewport/lifecycle behavior, centralized swipe/back policy, and real Telegram runtime evidence for customer-facing catalog/checkout UI.
- `FT-009` также владеет shell-level capability/degradation policy, keyboard-safe bottom action primitives и runtime-to-UI propagation rules для customer-facing WebView UX.
- Current checked-in capability policy intentionally stays minimal: it distinguishes only between an enhanced Telegram runtime path and a reduced fallback path based on centralized runtime capability derivation, without introducing a broader device-profiler subsystem.
- Current hardening status: repo-local policy semantics are now reconciled so degraded Telegram runtime keeps a conservative shell-owned `keyboard-safe` bottom CTA path; substantive closure still requires fresh real Android Telegram notes confirming keyboard-open reachability on that corrected path.
- `FT-002` сохраняет ownership над Telegram auth/session transport, trusted payment confirmation, and transport/source verification.
- `FT-003` сохраняет ownership над first-run language overlay, explicit language persistence, fallback-to-`ru`, and post-auth profile sync.

## Test strategy pointers

- e2e: Telegram WebView shell smoke, theme/safe-area rendering, action feedback.
- unit: shell state helpers and theme/shared-persistence glue.
- contract tests: runtime adapter for theme/viewport/safe-area/lifecycle events, shell capability/degradation policy and keyboard-safe bottom-action primitives.
- repo-local closure: deterministic Jest coverage for shell state, adapter events, bottom action/page policy wiring, catalog shell markers, and checkout visual feedback before real-client verify.
- verify: Telegram test environment/manual run в `Android Telegram` для shell/runtime behavior, включая customer-facing checkout UI после интеграции shell/runtime baseline; operator-confirmed notes are sufficient for closure, while `iOS/Desktop` evidence and screenshots/videos remain optional hardening artifacts. `FT-002` transport checks and `FT-003` language-domain assertions stay outside this scope. Keyboard-open flows должны отдельно подтвердить, что bottom action zone остается reachable.
- verify: если change добавляет новые motion/effect-heavy UI paths или тяжелые runtime dependencies, operator notes должны отдельно подтвердить stable scroll, bottom action zones и отсутствие очевидного jank на weak Android Telegram.
