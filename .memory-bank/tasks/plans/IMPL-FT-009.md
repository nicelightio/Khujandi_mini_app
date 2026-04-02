---
description: Implementation plan для FT-009 Telegram Mini App shell and WebView UX baseline.
status: active
---
# IMPL-FT-009

## Goal

Доставить `FT-009` как обязательный Telegram Mini App shell/runtime baseline MVP: ранний `ready()` bootstrap, centralized runtime adapter для theme/safe-area/stable viewport/lifecycle/back-swipe, visual feedback baseline и Telegram-specific verification с обязательным real `Android Telegram` evidence для customer-facing catalog/checkout flows.

## Current state

- Docs-first boundary freeze is now in place for shell/runtime ownership, shared storage policy, and verify routing between `FT-002`, `FT-003`, and `FT-009`.
- `catalog` и `checkout-payment` уже дают customer-facing route/page baseline, а `FT-003` закрыла first-run localization flow, но app-level shell/runtime orchestration поверх этих маршрутов пока отсутствует.
- `frontend/src/shared/telegram/webapp.ts` покрывает только storage wrappers, `ready()`, `expand()` и `getInitData()`, поэтому Telegram runtime event layer и feature detection все еще не централизованы.
- `frontend/src/shared/state/ui-shell.ts` и `frontend/src/shared/styles/webview-shell.css` пока слишком тонкие: shell state не отражает theme/viewport/lifecycle, а CSS baseline опирается на `env(safe-area-inset-*)` вместо Telegram CSS variables.
- Route/page UX уже использует базовые loaders и page shell, но общая WebView policy для safe-area, pin-to-bottom, back/swipe и Telegram-native confirmations еще не оформлена как единый shell baseline.

## REQs

- `REQ-019`
- `REQ-022`
- `REQ-023`

## Normative inputs

- [.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md](../../features/FT-009-mini-app-shell-and-webview-ux.md): acceptance criteria, failure modes и test pointers.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../epics/EP-001-customer-ordering-experience.md): parent epic success criteria.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../../contracts/mini-app-runtime-contract.md): runtime adapter boundary, storage policy и WebView behavior contract.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-019`, `REQ-022`, `REQ-023` и RTM.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../../architecture/frontend-presentation-and-webview.md): shell/runtime ownership и anti-leak rules.
- [.memory-bank/guides/frontend-slices-and-webview.md](../../guides/frontend-slices-and-webview.md): placement rules для frontend shell files.
- [.memory-bank/testing/index.md](../../testing/index.md): quality gates и Telegram-sensitive anti-cheat baseline.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../../runbooks/telegram-mini-app-verification.md): runtime/client-matrix verify scope.

## Constraints

- Shell baseline MUST оставаться technical enabling layer и не втягивать business logic из `catalog`, `checkout-payment` или localization внутрь `shared/ui`.
- Прямой доступ к `Telegram.WebApp.*` вне runtime adapter слоя MUST NOT появляться.
- `viewportStableHeight` и stable viewport events MUST стать layout source of truth для bottom CTA и page sizing.
- Telegram safe-area CSS variables MUST стать основным safe-area baseline вместо `env(safe-area-inset-*)`.
- Critical actions MUST иметь loader/disabled state и, где это оправдано, Telegram-native popup/confirm fallback.
- Final verification MUST включать не только repo-local tests, но и documented real Telegram Android evidence; `iOS/Desktop` evidence сейчас желательно, но не является blocking gate без отдельного explicit request.

## Steps

1. Freeze docs-first shell/runtime policy, storage boundary split и verify ownership между `FT-002`, `FT-003` и `FT-009`.
   - Output: feature/contract/runbook/testing docs однозначно разделяют auth/session, language persistence и shell/runtime ownership.
2. Scaffold app-level shell provider/boundary, shared shell state, runtime adapter extension и frontend test skeleton.
3. Реализовать runtime adapter для `ready()/expand()`, feature detection, theme, safe-area, stable viewport, lifecycle и centralized swipe/back policy.
4. Подключить shell baseline к customer-facing routes/components так, чтобы catalog и checkout наследовали WebView-safe layout и visual feedback policy.
5. Добавить repo-local runtime contract tests, route/page smoke и deterministic shell verification для theme/viewport/safe-area/lifecycle/action feedback.
6. Собрать real Telegram Android evidence, синхронизировать `FT-009` docs, RTM и Memory Bank navigation для финального closure shared shell/runtime требований.

## Expected touched files

- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-009.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`
- `.memory-bank/testing/index.md`
- `frontend/src/app/**/*`
- `frontend/src/shared/telegram/**/*`
- `frontend/src/shared/state/**/*`
- `frontend/src/shared/styles/**/*`
- `frontend/src/shared/ui/**/*`
- `frontend/src/slices/catalog/**/*`
- `frontend/src/slices/checkout-payment/**/*`
- `frontend/src/tests/app/**/*`
- `frontend/src/tests/shared/**/*`
- `frontend/src/tests/slices/catalog/**/*`
- `frontend/src/tests/slices/checkout-payment/**/*`
- `.tasks/TASK-FT009-06/**/*`

## Tests

- frontend unit/contract: runtime adapter helpers для `themeChanged`, `viewportChanged`, `safeAreaChanged`, `activated/deactivated`, `isVersionAtLeast()`, `ready()/expand()`.
- frontend shell state tests: theme, stable height, safe-area и lifecycle transitions.
- frontend route/page smoke: catalog и checkout внутри shell boundary, visual feedback states и no-direct-Telegram-access policy.
- repo-local verification: deterministic shell/runtime Jest smoke plus TypeScript check.
- verify: real Telegram Android evidence для customer-facing checkout UI после shell integration; `iOS/Desktop` evidence optional.

## Quality gates

- lint / typecheck
- unit tests
- integration or contract tests for runtime adapter/shell state
- route/page smoke for catalog and checkout inside shell boundary
- Telegram runtime verification + Android real-client evidence for `FT-009`

## UAT steps

1. Открыть Mini App в Telegram client и убедиться, что shell вызывает `ready()` рано, без затянутого placeholder.
2. Проверить safe-area и bottom CTA в catalog и checkout на мобильных клиентах без layout jumps.
3. Открыть keyboard/изменить viewport и подтвердить, что shell опирается на stable viewport behavior.
4. Переключить Telegram theme и подтвердить, что UI обновляет theme variables без ручного reload.
5. Проверить `activated/deactivated` resume behavior и отсутствие silent double-submit на critical actions.
6. Сохранить real Telegram Android evidence bundle и синхронизировать RTM/docs summary без дублирования heavy artifacts в Memory Bank.
