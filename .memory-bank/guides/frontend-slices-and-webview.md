---
description: HOW-гайд по организации React/Vite frontend, shared state и Telegram WebView shell.
status: active
---
# Frontend Slices And WebView

## Related architecture

- [.memory-bank/architecture/frontend-presentation-and-webview.md](../architecture/frontend-presentation-and-webview.md): WHAT/WHY для frontend presentation boundary.

## Frontend priorities

1. Отзывчивость и плавность.
2. Стабильность в Telegram WebView.
3. Быстрый first render и быстрая загрузка.
4. Аккуратный современный визуал.
5. Анимации и эффекты только там, где они реально улучшают UX.

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

## Runtime state placement

- Raw Telegram runtime events (`viewport`, `theme`, `safe-area`, lifecycle) обрабатывайте один раз в shell adapter слое.
- Feature-код не должен подписываться на high-churn runtime signals напрямую; используйте derived stable state, CSS variables и shell-owned helpers/primitives.
- Не переносите repeated viewport/theme/safe-area updates в broad app-wide state, если тот же результат можно получить через CSS propagation или narrow shell-local state.

## Bottom actions and forms

- CTA-heavy и input-heavy страницы должны использовать shared shell primitive/policy для bottom action zone вместо page-local fixed footer baseline.
- Keyboard-open, safe-area и stable viewport должны учитываться shell-слоем, чтобы feature-код не пересобирал одни и те же WebView workarounds на каждой странице.
- Если page зависит от критичной bottom CTA, проверяйте reachable state при keyboard-open и при изменении viewport внутри Telegram.

## Styling defaults

- Mobile-first и Telegram WebView-first считаются frontend baseline.
- Design tokens держите централизованно; theme adaptation и shell values проводите через CSS variables.
- Предпочитайте static CSS и минимальную runtime styling logic вместо тяжелой styling system.
- UI-примитивы лучше собирать как thin project-owned слой в `shared/ui`, а не ввозить тяжелый framework как основу всего интерфейса.
- Иконки должны оставаться tree-shakable; избегайте blanket import больших icon packs.

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

## Motion defaults

- Default path для motion: CSS transitions/keyframes.
- Browser-native programmatic animation допускается только когда plain CSS уже неудобен.
- Отдельную animation dependency подключайте только при явном UX gain, который нельзя получить дешевле.
- По умолчанию анимируйте `transform` и `opacity`; layout property animation и animation-through-React-state не делайте без сильной причины.

## Performance guardrails

- Проверяйте bundle impact каждого нового frontend package.
- Route-level и expensive UI chunks должны поддерживать lazy loading там, где это реально уменьшает цену first render.
- Сохраняйте contour-level bundle isolation: `mini-app` initial path не должен тянуть `admin-web`, `seller-web` и optional heavy visual/runtime layers до фактического входа в эти flows.
- Profile re-renders до добавления memoization; blanket memoization не считается good default.
- Не размазывайте animation logic по дереву компонентов и не связывайте ее с частыми global store/context updates.
- Избегайте постоянных background render loops, indiscriminate `will-change`, массового blur/backdrop-filter и других дорогих visual defaults.
- Проверяйте fixed bottom UI, keyboard behavior и animation smoothness на weak Android Telegram, а не только на desktop browser.

## Degradation policy

- Optional motion/effects должны уважать centralized shell capability/degradation policy, а не включаться по ad hoc решению внутри каждого slice.
- Для weak Android или старых Telegram clients проектируйте simplified path заранее: меньше одновременных эффектов, меньше decorative layers, тот же доменный flow.
- Не делайте UX-критичный flow зависимым от одного тяжелого visual/runtime library без дешевого fallback path.

## Prefer to avoid

- тяжелые all-in-one UI libraries как baseline для Mini App;
- тяжелую runtime styling/animation system как основу интерфейса;
- дорогие 3D/canvas/rich-media эффекты для обычного продуктового UI;
- glassmorphism/blur-heavy surfaces по всему приложению;
- новую библиотеку ради одного мелкого эффекта, если CSS или WAAPI уже закрывают кейс.

## i18n and persistence

- first-run language overlay обязателен;
- выбор языка хранится по explicit fallback policy `DeviceStorage -> CloudStorage -> localStorage`, а после auth синхронизируется с backend profile при наличии такого контура;
- компоненты не пишут напрямую в `localStorage`; используйте helpers в `shared/lib`.
- session identifiers не хранятся в `localStorage`.

## Source artifacts

- [doc/FRONTEND_COMPONENT_GUIDE.md](../../doc/FRONTEND_COMPONENT_GUIDE.md): frontend structure и WebView specifics.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): language/theme/feedback baseline.
- [frontend/frontend_recomendations.md](../../frontend/frontend_recomendations.md): detailed frontend recommendations for motion, styling and performance trade-offs.
