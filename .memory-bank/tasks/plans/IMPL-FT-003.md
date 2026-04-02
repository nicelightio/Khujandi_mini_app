---
description: Implementation plan для FT-003 language selection and localization.
status: active
---
# IMPL-FT-003

## Goal

Доставить `FT-003` как обязательный localization baseline Mini App: first-run language overlay, deterministic persistence fallback и post-auth sync выбранного языка с backend profile без выделения нового capability slice.

## Current state

- `catalog` и `checkout-payment` уже дают customer-facing baseline, но явного localization flow поверх этих маршрутов пока нет.
- В frontend присутствует только минимальный список поддерживаемых языков (`ru/en/tj`) и very thin Telegram bridge; storage fallback helpers и overlay orchestration отсутствуют.
- В backend уже есть `User.language`, а `checkout-payment` auth path умеет сохранить Telegram `language_code`, но explicit user choice еще не становится canonical preference.

## REQs

- `REQ-003`
- `REQ-022`
- `REQ-023`

## Normative inputs

- [.memory-bank/features/FT-003-language-selection-and-localization.md](../../features/FT-003-language-selection-and-localization.md): acceptance criteria, edge cases и verification pointers.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../epics/EP-001-customer-ordering-experience.md): parent epic success criteria.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../../contracts/mini-app-runtime-contract.md): runtime adapter boundary, storage policy и post-auth source-of-truth rules.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-003`, `REQ-022`, `REQ-023` и RTM.
- [.memory-bank/invariants.md](../../invariants.md): mandatory first-run language choice invariant.
- [.memory-bank/architecture/frontend-presentation-and-webview.md](../../architecture/frontend-presentation-and-webview.md): shared/runtime ownership и boundary rules.
- [.memory-bank/guides/frontend-slices-and-webview.md](../../guides/frontend-slices-and-webview.md): placement rules для `shared/i18n`, `shared/state`, `shared/telegram`.
- [.memory-bank/guides/storage-and-state-implementation.md](../../guides/storage-and-state-implementation.md): deterministic persistence fallback policy и state ownership.
- [.memory-bank/testing/index.md](../../testing/index.md): quality gates и Telegram-sensitive anti-cheat baseline.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../../runbooks/telegram-mini-app-verification.md): Telegram-specific verify scope для localization.

## Constraints

- Первый запуск Mini App MUST блокировать дальнейшее использование customer-facing UI до явного выбора `ru`, `en` или `tj`.
- Неподдерживаемые, пустые или поврежденные language values MUST fallback на `ru`.
- До auth выбранный язык хранится через `DeviceStorage -> CloudStorage -> localStorage` без прямых component-level обращений к storage/API.
- После появления validated auth context backend profile должен стать source of truth для language preference; Telegram `user.language_code` не считается trusted app setting сам по себе.
- Localization baseline не должен размывать `FT-009`: shell safe-area/theme/lifecycle работа остается в shell/runtime feature, а `FT-003` владеет language overlay/persistence/sync.

## Steps

1. Freeze docs-first default language policy, fallback ownership и verify scope, чтобы убрать ambiguity из feature acceptance.
2. Scaffold shared frontend pieces для language store, persistence helpers и overlay entrypoints без прямого доступа компонентов к `localStorage`/`Telegram.WebApp.*`.
3. Реализовать language normalization и deterministic read/write fallback policy с контрактными тестами для `DeviceStorage`, `CloudStorage` и `localStorage`.
4. Реализовать route/app-level first-run overlay gating и подключить language choice к customer-facing copy baseline.
5. Реализовать post-auth sync выбранного языка в backend profile через existing Mini App auth/session contour.
6. Добавить unit/integration/e2e coverage, runtime contract tests и Telegram client-matrix verify evidence для localization acceptance.

## Expected touched files

- `.memory-bank/features/FT-003-language-selection-and-localization.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-003.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`
- `frontend/src/app/**/*`
- `frontend/src/shared/i18n/**/*`
- `frontend/src/shared/lib/**/*`
- `frontend/src/shared/state/**/*`
- `frontend/src/shared/telegram/**/*`
- `frontend/src/shared/ui/**/*`
- `frontend/src/slices/catalog/**/*`
- `frontend/src/slices/checkout-payment/**/*`
- `frontend/src/tests/**/*`
- `backend/src/slices/checkout-payment/**/*`
- `tests/slices/checkout-payment/**/*`

## Tests

- frontend unit: language normalization, fallback-to-`ru`, deterministic storage read/write order.
- frontend contract tests: Telegram runtime adapter wrappers for `DeviceStorage`/`CloudStorage` fallback behavior.
- frontend UI/e2e: first-run overlay gating, subsequent launch persistence and language switch flow.
- backend integration: authenticated language preference sync persists explicit user choice over Telegram hint when appropriate.
- verify: Telegram client-matrix evidence for first-run overlay, persistence restore and post-auth source-of-truth behavior.

## Quality gates

- lint / typecheck
- unit tests
- integration tests
- e2e smoke for localization overlay and persistence
- Telegram runtime contract verification + client-matrix evidence for `FT-003`

## UAT steps

1. Открыть Mini App с чистым storage и убедиться, что до выбора языка customer-facing UI заблокирован overlay.
2. Выбрать `ru`, `en` и `tj` поочередно и проверить, что копирайт/лейблы переключаются без unsupported state.
3. Повторно открыть Mini App и убедиться, что язык восстанавливается через documented fallback policy без повторного mandatory overlay.
4. Получить auth context и проверить, что backend profile фиксирует выбранный язык как canonical preference.
5. Подставить unsupported/empty persisted value и убедиться, что runtime fallback возвращается к `ru`.
6. Проверить localization flow в Telegram client matrix и сохранить evidence; safe-area/theme/lifecycle coverage остается частью `FT-009`.
