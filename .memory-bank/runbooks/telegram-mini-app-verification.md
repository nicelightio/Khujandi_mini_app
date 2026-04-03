---
description: Runbook для Telegram-specific verification auth, payment и WebView shell behavior.
status: active
---
# Telegram Mini App Verification

## Purpose

Зафиксировать минимальный verify baseline, который отличает browser-only smoke от реального Telegram Mini App evidence.

## Required scopes

### FT-002 checkout/payment

1. Проверить отрицательные auth cases: битая подпись, протухший `auth_date`, replay `initData`.
2. Проверить payment happy path и failed/cancelled/pending path.
3. Проверить, что duplicate webhook/update не создает второй order.
4. Если используется Telegram/Bot transport, проверить `secret_token`/source verification.
5. Real client-matrix evidence для customer-facing Mini App checkout UI не закрывается на уровне `FT-002`; оно переносится в `FT-009`, где готов shell/runtime baseline.

### FT-003 localization

1. Проверить first-run language overlay в реальном Telegram client.
2. Проверить repo-local/mock runtime contract tests для Telegram adapter wrappers и deterministic fallback order `DeviceStorage -> CloudStorage -> localStorage`.
3. Проверить fallback на `ru` для unsupported, empty или поврежденного persisted language value.
4. Проверить persistence fallback policy и восстановление языка после появления auth context.
5. Не считать safe-area/theme/viewport/lifecycle shell baseline частью `FT-003` verify; этот scope закрывается в `FT-009`.

### FT-009 shell/runtime

1. Проверить `ready()`/bootstrap без затянутого placeholder.
2. Проверить safe-area и bottom CTA на iOS/Android.
3. Проверить `viewportStableHeight`/keyboard behavior без layout jumps.
4. Проверить live theme change.
5. Проверить `activated/deactivated` resume behavior.
6. Проверить customer-facing checkout UI в реальном Telegram Android client после интеграции shell/runtime baseline.
7. Проверить centralized back/swipe policy и отсутствие direct `Telegram.WebApp.*` access из slice-level UI.
8. Не дублировать auth/session transport assertions из `FT-002` и language-domain assertions из `FT-003`; в `FT-009` подтверждается только shell/runtime baseline и shared WebView-safe storage boundary.

## Minimal real-client baseline

- Обязательный blocking baseline для текущего MVP: `Android Telegram`.
- `iOS Telegram` и `Telegram Desktop/macOS` сейчас считаются желательным hardening evidence, но не blocking quality gate для закрытия `FT-009`, если иное не запрошено явно.

## Evidence rules

- Browser-only Playwright traces недостаточны для Telegram-sensitive acceptance.
- Сохраняй operator notes в `.tasks/TASK-XXX/`; screenshots/videos/traces optional и не являются blocking artifact для текущего Android verify closure.
- В Memory Bank фиксируй только summary + ссылки на evidence.
- Для `FT-009` summary должен явно отделять shell/runtime evidence от уже закрытых `FT-002` auth/payment checks и `FT-003` localization checks.
- Для текущего closure достаточно real Android Telegram run c operator-confirmed notes; дополнительные `iOS/Desktop` материалы и screenshots/videos можно добавлять как non-blocking appendix.

## Source artifacts

- [.memory-bank/testing/index.md](../testing/index.md): quality gates и anti-cheat baseline.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../contracts/mini-app-runtime-contract.md): shell/runtime boundary.
