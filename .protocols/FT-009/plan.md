---
description: План декомпозиции FT-009 в implementation plan и execution-ready backlog.
status: active
---
# FT-009 Decomposition Plan

## Goal

- Разложить `FT-009` на атомарные implementation tasks для Telegram Mini App shell/runtime baseline: ранний `ready()` bootstrap, safe-area и stable viewport handling, theme/lifecycle integration, centralized swipe/back policy, visual feedback baseline и Telegram-specific client-matrix verification.

## Inputs used

- [.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md](../../.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md): owning feature spec и acceptance criteria.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../.memory-bank/epics/EP-001-customer-ordering-experience.md): parent epic и customer-facing outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-019`, shared `REQ-022`, `REQ-023` и RTM.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../../.memory-bank/contracts/mini-app-runtime-contract.md): runtime adapter, storage boundary, viewport/safe-area baseline.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../../.memory-bank/architecture/frontend-presentation-and-webview.md): shell/shared ownership и anti-leak rules для Telegram integration.
- [.memory-bank/guides/frontend-slices-and-webview.md](../../.memory-bank/guides/frontend-slices-and-webview.md): placement rules для `app`, `shared/telegram`, `shared/state`, `shared/ui`, `shared/styles`.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): verification baseline, anti-cheat rules и `FT-009` expectations.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../../.memory-bank/runbooks/telegram-mini-app-verification.md): Telegram-specific client-matrix и runtime evidence requirements.

## Current repository state

- `frontend/src/app/router.tsx` уже поднимает localization boundary и customer-facing routes, но app-level shell provider/runtime orchestration пока отсутствует.
- `frontend/src/shared/telegram/webapp.ts` сейчас покрывает только `ready()`, `expand()`, `getInitData()` и storage wrappers; theme, safe-area, viewport, lifecycle и navigation/swipe policy там не реализованы.
- `frontend/src/shared/state/ui-shell.ts` пока хранит только тривиальный `isReady` baseline и не отражает runtime shell state.
- `frontend/src/shared/styles/webview-shell.css` все еще опирается на `env(safe-area-inset-bottom)` как baseline, что расходится с Telegram-safe-area contract.
- `frontend/src/shared/ui/page-shell.tsx`, `catalog` и `checkout-payment` уже дают customer-facing route/page baseline, но еще не интегрированы с полноценным Telegram shell/runtime UX.
- `FT-002` и `FT-003` уже закрыли repo-local auth/payment и localization runtime scope; оставшиеся shared shell/runtime и client-matrix obligations теперь должны замкнуться в `FT-009`.

## Decomposition strategy

1. W1: зафиксировать shell/runtime policy и verify ownership, затем поднять app-level shell boundary и test skeleton без размытия slice boundaries.
2. W2: реализовать runtime adapter для theme/safe-area/stable viewport/lifecycle/back-swipe и подключить shell baseline к customer-facing catalog/checkout UX.
3. W3: собрать repo-local verification suite и затем синхронизировать Telegram client-matrix evidence с финальным RTM/docs closure для `REQ-019`, shared `REQ-022`, `REQ-023`.

## Constraints

- `FT-009` не создает новый domain slice; это shared frontend/runtime enabling layer.
- Все обращения к `Telegram.WebApp.*` MUST проходить через единый runtime adapter.
- Shell MUST использовать `viewportStableHeight` и stable viewport signals вместо `viewportHeight` как главного layout anchor.
- Safe-area baseline MUST опираться на Telegram fields/CSS variables, а не на `env(safe-area-inset-*)` как основной механизм.
- Shell baseline MUST давать visual confirmation для critical user actions и не допускать silent double-submit.
- Checkout/payment и localization domain logic остаются в owning slices; `FT-009` владеет только shell/runtime primitives и customer-facing WebView integration.

## Expected outputs

- `.protocols/FT-009/plan.md`
- `.protocols/FT-009/decision-log.md`
- `.memory-bank/tasks/plans/IMPL-FT-009.md`
- backlog section с `TASK-FT009-01` ... `TASK-FT009-06`
- execution-ready W1 task для docs-first shell/runtime freeze
