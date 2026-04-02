---
description: Feature C4 L3 для обязательного выбора языка и базовой локализации MVP.
status: active
---
# FT-003 Language Selection And Localization

## REQs

- `REQ-003`
- `REQ-022`
- `REQ-023`

## Use cases

- Пользователь при первом запуске выбирает язык `ru`, `en` или `tj`.
- Приложение запоминает выбор и использует его в последующих сессиях.

## Acceptance criteria

- First-run language overlay обязателен для MVP acceptance.
- Поддерживаются языки `ru`, `en`, `tj` с fallback на `ru`.
- Язык сохраняется в пользовательском профиле или клиентском persisted state по фактическому auth-контексту.
- До auth используется explicit fallback policy `DeviceStorage -> CloudStorage -> localStorage`; после auth backend profile становится source of truth, если такой контур доступен.
- Default language policy (`ru` baseline vs Telegram `user.language_code` as hint) должна быть явно зафиксирована до реализации; Telegram hint не считается trusted app setting без server-side validated auth context.

## Edge cases & failure modes

- При отсутствии сохраненного выбора интерфейс должен потребовать выбор языка до дальнейшего использования.
- При отсутствии перевода используется fallback на `ru`.
- Unsupported, empty или поврежденное persisted language value считается невалидным explicit choice: runtime fallback идет на `ru`, а дальнейшая overlay gating не должна считать такой state подтвержденным выбором пользователя.

## Constraints / invariants

- Это продуктовое требование MVP, а не только frontend detail.
- Локализация не меняет capability boundaries core domain flows.

## Normative inputs

- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): runtime adapter boundary, storage fallback order, and post-auth profile source-of-truth.
- [.memory-bank/runbooks/telegram-mini-app-verification.md](../runbooks/telegram-mini-app-verification.md): Telegram-specific verify scope for localization.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для language overlay, persistence и fallback behavior.

## Test strategy pointers

- e2e: first-run language overlay and persistence.
- unit: fallback language resolution.
- contract/runtime: Telegram adapter wrappers and storage fallback order.
- verify: Telegram client matrix подтверждает корректную persistence/fallback работу в реальном WebView.

## Verify ownership boundary

- `FT-003` владеет overlay, language persistence и post-auth profile sync behavior.
- `FT-003` не закрывает safe-area, theme, viewport/lifecycle shell baseline; этот verify scope остается в `FT-009`.

## Implementation status

- `TASK-FT003-02`: shared localization scaffold added.
- `TASK-FT003-03`: deterministic fallback and Telegram storage wrappers added.
- `TASK-FT003-04`: first-run overlay now gates route rendering, and successful Telegram auth syncs explicit language choice into backend profile state.
- `TASK-FT003-05`: customer-facing overlay, catalog, and checkout baseline copy now follow the selected language via shared frontend i18n copy and are repo-locally verified.
- `TASK-FT003-06`: final repo-local localization verification is complete, including direct controller coverage for overlay visibility, deterministic persistence/runtime checks, and backend post-auth language sync evidence; shared shell/client-matrix closure for `REQ-022` and `REQ-023` still remains with `FT-009`.
