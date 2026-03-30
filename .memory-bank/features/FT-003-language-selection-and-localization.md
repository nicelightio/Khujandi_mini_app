---
description: Feature C4 L3 для обязательного выбора языка и базовой локализации MVP.
status: active
---
# FT-003 Language Selection And Localization

## REQs

- `REQ-003`

## Use cases

- Пользователь при первом запуске выбирает язык `ru`, `en` или `tj`.
- Приложение запоминает выбор и использует его в последующих сессиях.

## Acceptance criteria

- First-run language overlay обязателен для MVP acceptance.
- Поддерживаются языки `ru`, `en`, `tj` с fallback на `ru`.
- Язык сохраняется в пользовательском профиле или клиентском persisted state по фактическому auth-контексту.

## Edge cases & failure modes

- При отсутствии сохраненного выбора интерфейс должен потребовать выбор языка до дальнейшего использования.
- При отсутствии перевода используется fallback на `ru`.

## Constraints / invariants

- Это продуктовое требование MVP, а не только frontend detail.
- Локализация не меняет capability boundaries core domain flows.

## Normative inputs

- [.memory-bank/testing/index.md](../testing/index.md): verification basis для language overlay, persistence и fallback behavior.

## Test strategy pointers

- e2e: first-run language overlay and persistence.
- unit: fallback language resolution.
