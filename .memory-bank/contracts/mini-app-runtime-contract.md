---
description: Контракт shell/runtime adapter для Telegram Mini App WebView, feature detection и client storage policy.
status: active
---
# Mini App Runtime Contract

## Ownership boundary

- Прямой доступ к `Telegram.WebApp.*` разрешен только shell/runtime adapter слою.
- Capability slices используют Telegram-specific behavior только через технические adapters/primitives.
- `FT-002` владеет auth/session transport, trusted payment verification и transport/source trust checks.
- `FT-010` владеет seller edit mode behavior на shared storefront и seller-side access gating semantics поверх `catalog`, но не владеет shell transport.
- `FT-003` владеет explicit language choice, fallback-to-`ru`, persistence resolution и post-auth profile sync.
- `FT-009` владеет shell bootstrap, runtime events, safe-area/theme/viewport/lifecycle policy, centralized back/swipe behavior и shared non-sensitive persistence boundary, нужной для WebView-safe UX.

## Bootstrap baseline

- `telegram-web-app.js` подключается в shell bootstrap как можно раньше.
- `Telegram.WebApp.ready()` вызывается после essential UI bootstrap.
- `expand()` и shell navigation/swipe policy централизуются в runtime shell.

## Runtime events baseline

- Shell владеет подписками на `themeChanged`, `viewportChanged`, `safeAreaChanged`, `contentSafeAreaChanged`, `activated`, `deactivated`.
- Feature usage проверяется через `isVersionAtLeast()` и graceful fallback.
- `viewportStableHeight` является layout source of truth для pin-to-bottom UI; `viewportHeight` не используется как основной anchor.
- Сырые high-churn runtime events нормализуются один раз в shell/runtime adapter и не должны фан-аутиться как прямые slice-level подписки по всему приложению.
- Feature-код получает runtime state через derived stable values, CSS variables или narrow shell-owned primitives; frequent viewport/theme/safe-area updates не должны требовать broad multi-slice recomputation.

## Layout and action-zone policy

- Shell владеет общими primitives для keyboard-safe page layout и bottom action zones на customer-facing CTA/input surfaces.
- Input-heavy страницы и fixed bottom controls интегрируются через shell policy/primitives, а не через ad hoc page-local `position: fixed` baseline.
- Bottom action zone должна учитывать `viewportStableHeight`, safe-area и keyboard-open behavior так, чтобы critical action оставался reachable.

## Safe-area baseline

- Основной механизм safe-area: Telegram fields/CSS variables `--tg-safe-area-inset-*` и `--tg-content-safe-area-inset-*`.
- `env(safe-area-inset-*)` не считается надежным baseline внутри Telegram WebView.

## Persistence policy

- Session identifiers не хранятся в `localStorage` или другом JS-readable persistent storage как baseline.
- HttpOnly cookie contour для Mini App session остается outside shell ownership и следует auth boundary из `FT-002`.
- Shell/runtime слой MUST NOT сам решать, что пользователь является seller-ом, по untrusted client-side данным; seller mode активируется только из slice-provided server-validated access state.
- Non-sensitive preferences (например язык) используют explicit fallback policy: `DeviceStorage -> CloudStorage -> localStorage`.
- Default app language baseline: `ru`; Telegram `user.language_code` может использоваться только как runtime hint для initial UI preselection и не считается trusted persisted preference без validated auth context.
- Unsupported, empty или поврежденное persisted language value не считается валидным explicit preference: runtime fallback идет на `ru`, а invalid state не маскируется под подтвержденный пользовательский выбор.
- Явный выбор пользователя имеет приоритет над Telegram hint и pre-auth fallback storage.
- После появления auth-контекста backend profile становится source of truth для user-level language/session metadata, где это применимо.
- Shell/runtime слой может читать только non-sensitive shell preferences и MUST NOT вводить отдельный JS-readable persistence contour для session identifiers или trusted payment/auth metadata.

## Runtime budget baseline

- Baseline device class для customer-facing shell — weak/mid Android inside Telegram WebView, а не desktop browser.
- Responsive tap feedback, stable scroll, predictable bottom action zones и controlled keyboard behavior имеют приоритет над ornamental heavy effects.
- Default motion path — CSS `transform/opacity` и WAAPI; per-frame React-state animation и постоянные background render loops не входят в baseline contract.
- Expensive visual layers требуют explicit justification, lazy loading и graceful fallback/disable path; они не должны быть обязательной основой catalog/checkout shell.
- Weak-device/old-client degradation policy определяется централизованно shell-level capability layer; optional motion/effects и decorative enhancements обязаны уважать этот policy.

## Verification ownership

- Repo-local/runtime contract checks для auth/payment transport остаются в `FT-002`.
- Repo-local/runtime contract checks для language fallback/persistence остаются в `FT-003`.
- Real Telegram runtime evidence для customer-facing catalog/checkout UI, safe-area/theme/viewport/lifecycle и centralized swipe/back behavior закрывается в `FT-009`; обязательный blocking baseline сейчас ограничен `Android Telegram`, а `iOS/Desktop` остаются non-blocking hardening evidence.

## UX policy baseline

- Critical actions должны иметь visual confirmation: loader, disabled state и controlled success/error feedback.
- Для WebView-fragile сценариев допускаются Telegram-native `showPopup/showAlert/showConfirm`.
- Lifecycle restore не должен приводить к silent double-submit или stale order status.

## Source artifacts

- [doc/FRONTEND_COMPONENT_GUIDE.md](../../doc/FRONTEND_COMPONENT_GUIDE.md): frontend shell layout и component boundaries.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): shared/runtime boundary rules.
