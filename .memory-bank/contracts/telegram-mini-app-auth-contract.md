---
description: Контракт Telegram Mini App auth для `POST /auth/telegram`, server-side validation `initData` и session issuance policy.
status: active
---
# Telegram Mini App Auth Contract

## Endpoint

- `POST /auth/telegram`

## Request boundary

- Клиент передает raw `initData` string от Telegram WebApp.
- `initDataUnsafe` не считается trusted input и не используется для auth decisions.
- Empty/missing `initData` в unsupported launch modes не создает trusted auth context и должен вести в controlled recovery path.
- Парсер обязан безопасно обрабатывать дополнительные поля Telegram payload, не ломая hash validation.

## Server-side validation rules

- Backend валидирует подпись `initData` через HMAC SHA-256.
- `data_check_string` собирается из полей по алфавиту с `\n` separator.
- Derivation secret задается недвусмысленно: `secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)`.
- Проверочный hash считается как `HMAC_SHA256(key=secret_key, message=data_check_string)`.
- `auth_date` проверяется на актуальность; max age policy для MVP: `10 minutes`.
- Replay того же `initData` в пределах TTL должен блокироваться server-side idempotency/replay guard.

## Successful outcome

- Backend создает или обновляет Telegram-linked пользователя.
- Backend резолвит capability/ownership metadata из provisioned bindings; отдельный seller auth endpoint для shared storefront не вводится.
- Backend выдает Mini App session согласно выбранному session transport policy; production-preferred baseline для чувствительного контура: HttpOnly cookie session. Если используется bearer/JWT, это должно быть явно обосновано.
- Смонтированный HTTP runtime MUST потреблять cookie transport descriptor напрямую из shared auth boundary и MUST NOT предсказывать или реконструировать session cookie token через route-local соглашения.
- Для cookie-based Mini App session minimal MVP CSRF baseline: `SameSite` cookie + server-side `Origin/Referer` validation.
- Одна и та же Telegram-linked session family может давать только customer capabilities или customer + seller capabilities в зависимости от server-side ownership resolution.
- Для auth/session surface должен быть зафиксирован явный CSP/XSS-hardening baseline; session identifiers не попадают в JS-readable persistent storage.

## Failure rules

- Invalid signature -> `401 AUTH_REQUIRED`.
- Expired `auth_date` -> `401 AUTH_REQUIRED`.
- Missing/invalid payload -> `400 VALIDATION_ERROR`.
- Replay-detected `initData` -> controlled security rejection по deploy policy.

## Staging test auth exception

`FT-018` may add a staging-only fixed-persona session bootstrap for UI QA. This is not a replacement for `POST /auth/telegram` and must obey [.memory-bank/contracts/staging-test-auth-harness-contract.md](staging-test-auth-harness-contract.md):

- only when `E2E_TEST_MODE=TRUE` and `NODE_ENV !== "production"`;
- absent or `404` in production;
- fixed personas only, no arbitrary Telegram identities;
- same Mini App HttpOnly cookie/session primitives where applicable;
- UI QA evidence remains separate from raw `initData` validation, replay and expired `auth_date` tests.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): Mini App auth как обязательный MVP контур.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): endpoint и error baseline.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): HMAC validation details.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](catalog-seller-access-and-session.md): seller capability resolution on top of Telegram-linked auth.
- [.memory-bank/contracts/staging-test-auth-harness-contract.md](staging-test-auth-harness-contract.md): staging-only test session exception.
