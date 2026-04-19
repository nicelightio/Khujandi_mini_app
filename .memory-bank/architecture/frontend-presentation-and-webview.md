---
description: WHAT/WHY для frontend presentation boundary, Mini App shell и Telegram WebView UX baseline.
status: active
---
# Frontend Presentation And WebView

## Purpose

Зафиксировать архитектурную границу клиентского presentation-слоя, чтобы WebView shell, i18n, state и UI composition не размывали slice boundaries.

## Architectural decisions

- Frontend defaults follow priority order: responsiveness/smoothness -> Telegram WebView stability -> first render/load speed -> visual polish -> extra motion.
- Frontend организуется по capability slices, а не по набору страниц или технических папок.
- `FT-009` описывает shell baseline клиентского контура и не считается отдельным domain slice.
- Бизнес-логика checkout, tracking и review flows остается внутри owning slices; shell предоставляет только presentation/runtime primitives.
- Telegram WebApp integration, i18n, theme, safe-area, viewport stabilization, lifecycle handling и shell navigation policies живут в `shared` только как technical enabling layer.
- Customer-facing `mini-app` path сохраняет отдельную contour-level bundle boundary: first render MUST NOT платить за `admin-web`, `seller-web` или optional heavy visual/runtime layers, пока они реально не нужны.
- Визуальная выразительность строится static-first: typography, spacing, hierarchy, gradients и quality-of-state должны давать основной perceived quality еще до добавления сложного motion.
- Styling baseline опирается на static CSS, centralized design tokens и CSS variables; тяжелые runtime styling layers не считаются frontend default.
- Motion считается enhancement-слоем: baseline сначала закрывается через дешевые CSS/WebView-safe приемы, а более тяжелый animation/runtime слой допускается только как редкое обоснованное исключение.
- Graceful degradation для weak Android и старых Telegram clients централизуется в shell-level capability policy, а не разносится по slice-specific эвристикам.

## Boundary rules

- `shared/ui` хранит только реально переиспользуемые primitives без бизнес-смысла.
- `shared/state` содержит `session`, `ui` и другие truly cross-slice stores.
- `shared/styles` или эквивалентный shell-level слой владеет design tokens, theme variables и reusable visual primitives без slice-specific semantics.
- Slice-specific state, orchestration и API mapping остаются внутри `slices/*`.
- Компоненты не обращаются напрямую к persistence или Telegram API без соответствующих helpers/hooks.
- Один runtime adapter слой владеет подписками на `themeChanged`, `viewportChanged`, `safeAreaChanged`, `contentSafeAreaChanged`, `activated`, `deactivated`, BackButton/Close/swipes и feature detection через `isVersionAtLeast()`.
- High-churn runtime signals (`viewport`, `safe-area`, `theme`, lifecycle) нормализуются один раз в shell и должны доходить до feature-кода как derived stable state или CSS variables, а не как сырые многократные подписки в каждом slice.
- Shared shell владеет keyboard-safe page layout и reusable bottom action zone primitives для CTA/input-heavy surfaces; ad hoc `position: fixed` решения на уровне каждой feature-страницы не считаются baseline.
- UI layer должен оставаться thin/composable; тяжелые all-in-one UI frameworks не должны становиться default path.
- Baseline device class для customer-facing shell — weak/mid Android inside Telegram WebView, поэтому always-on render loops, массовый blur/backdrop-filter и другие expensive effects не должны становиться default path.

## Shell baseline

- Первый запуск требует language overlay `ru/en/tj`.
- Telegram WebView shell должен поддерживать safe-area, stable viewport, lifecycle restore и theme sync.
- Для pin-to-bottom layout shell использует `viewportStableHeight` и обновляется только по stable viewport signals; `viewportHeight` не считается layout source of truth.
- Safe-area baseline использует Telegram safe-area fields/CSS variables (`--tg-safe-area-inset-*`, `--tg-content-safe-area-inset-*`), а не `env(safe-area-inset-*)` как основной механизм.
- `Telegram.WebApp.ready()` вызывается как можно раньше после essential UI bootstrap; `expand()` и swipe/back policies централизуются в shell, а не в feature-коде.
- Fixed bottom CTA/input surfaces должны проходить через shell-owned keyboard-safe layout policy, чтобы keyboard-open, safe-area и stable viewport не ломали доступность критичных действий.
- Visual confirmations для critical UX допускают Telegram-native popup/confirm primitives там, где обычные web modals недостаточно надежны в WebView.
- Visual feedback (`toast`, `loader`, disabled action states) является baseline UX, а не optional polish.

## Runtime and visual budget

- Современный visual quality должен достигаться в первую очередь через композицию, типографику, spacing, gradients, contrast и quality states, а не через дорогие декоративные эффекты.
- Cheap-first order для выразительного UI: сначала статическая композиция и легкие CSS/WebView-safe эффекты; более тяжелые технологии должны быть lazy, optional и disable-able.
- Default animation targets — `transform` и `opacity`; layout-affecting animation, per-frame React `setState` и broad re-render chains выходят за baseline.
- Потенциально дорогие route surfaces должны учитывать lazy loading и упрощение DOM/visual layers там, где это оправдано реальным screen/interaction profile.
- Runtime updates не должны превращаться в broad app-wide React churn: shell обязан предпочитать CSS propagation, narrow stores или другие дешевые пути доставки frequent runtime changes.

## Related guide

- [.memory-bank/guides/frontend-slices-and-webview.md](../guides/frontend-slices-and-webview.md): HOW-правила структуры frontend, state, i18n и WebView integration.

## Source artifacts

- [doc/FRONTEND_COMPONENT_GUIDE.md](../../doc/FRONTEND_COMPONENT_GUIDE.md): структура React/Vite фронтенда и Telegram WebView UI rules.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): layered architecture и shared boundary rules.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): language overlay, theme и visual feedback baseline.
- [frontend/frontend_recomendations.md](../../frontend/frontend_recomendations.md): user-provided frontend engineering defaults for performance, motion and Telegram WebView quality.
