---
description: План декомпозиции FT-003 в implementation plan и execution-ready backlog.
status: active
---
# FT-003 Decomposition Plan

## Goal

- Разложить `FT-003` на атомарные implementation tasks для first-run language overlay, deterministic persistence fallback и sync выбранного языка с backend profile после появления auth-контекста.

## Inputs used

- [.memory-bank/features/FT-003-language-selection-and-localization.md](../../.memory-bank/features/FT-003-language-selection-and-localization.md): owning feature spec и acceptance criteria.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../.memory-bank/epics/EP-001-customer-ordering-experience.md): parent epic и customer-facing outcome.
- [.memory-bank/requirements.md](../../.memory-bank/requirements.md): `REQ-003`, `REQ-022`, `REQ-023` и RTM.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../../.memory-bank/contracts/mini-app-runtime-contract.md): runtime/storage boundary и post-auth profile ownership.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../../.memory-bank/architecture/frontend-presentation-and-webview.md): shell/shared ownership и anti-leak rules для Telegram integration.
- [.memory-bank/guides/frontend-slices-and-webview.md](../../.memory-bank/guides/frontend-slices-and-webview.md): placement rules для `shared/i18n`, `shared/state`, `shared/telegram`.
- [.memory-bank/guides/storage-and-state-implementation.md](../../.memory-bank/guides/storage-and-state-implementation.md): persistence fallback order и state ownership.
- [.memory-bank/testing/index.md](../../.memory-bank/testing/index.md): verification baseline и anti-cheat rules.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../../.memory-bank/runbooks/telegram-mini-app-verification.md): Telegram-specific verify requirements для localization.

## Current repository state

- Во frontend уже есть baseline `frontend/src/shared/i18n/languages.ts`, но нет first-run overlay, persistence helpers и route-level gating для языка.
- `frontend/src/shared/telegram/webapp.ts` пока покрывает только `ready()/expand()/getInitData()` и не дает storage/runtime contract для `DeviceStorage`/`CloudStorage`.
- В backend уже существует `User.language`, а `checkout-payment` auth path сохраняет Telegram `language_code`, но выбранный пользователем язык пока не синхронизируется как explicit preference после validated auth context.

## Decomposition strategy

1. W1: зафиксировать default language policy, persistence ownership и поднять shared frontend skeleton для i18n/persistence.
2. W2: реализовать deterministic fallback policy, first-run gating и backend profile sync через существующий Mini App auth contour.
3. W3: подключить localization baseline к customer-facing маршрутам и собрать verify evidence без размытия shell/runtime scope `FT-009`.

## Constraints

- `FT-003` не создает отдельный business slice; это shared frontend/runtime enabling layer плюс минимальные touchpoints в already existing auth/profile contour.
- Default language policy нельзя оставлять неявной: до реализации нужно явно решить, остается ли `ru` базовым default, а Telegram `user.language_code` используется только как hint после validated auth context.
- Выбор языка до auth хранится по порядку `DeviceStorage -> CloudStorage -> localStorage`.
- После появления auth-контекста backend profile должен стать source of truth для выбранного языка.
- Session identifiers не попадают в `localStorage`; language persistence остается non-sensitive preference path.

## Expected outputs

- `.memory-bank/tasks/plans/IMPL-FT-003.md`
- backlog section с `TASK-FT003-*`
- execution-ready W1 task для старта docs/spec freeze по localization
