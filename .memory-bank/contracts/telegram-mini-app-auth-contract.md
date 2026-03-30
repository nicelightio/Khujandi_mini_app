---
description: Контракт Telegram Mini App auth для `POST /auth/telegram` и server-side validation `initData`.
status: active
---
# Telegram Mini App Auth Contract

## Endpoint

- `POST /auth/telegram`

## Request boundary

- Клиент передает `initData` от Telegram WebApp.
- `initDataUnsafe` не считается trusted input и не используется для auth decisions.

## Server-side validation rules

- Backend валидирует подпись `initData` через HMAC SHA-256.
- `data_check_string` собирается из полей по алфавиту с `\n` separator.
- Derivation secret задается недвусмысленно: `secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)`.
- Проверочный hash считается как `HMAC_SHA256(key=secret_key, message=data_check_string)`.
- `auth_date` проверяется на актуальность; max age policy для MVP: `10 minutes`.

## Successful outcome

- Backend создает или обновляет пользователя.
- Выдается JWT для Mini App user contour.

## Failure rules

- Invalid signature -> `401 AUTH_REQUIRED`.
- Expired `auth_date` -> `401 AUTH_REQUIRED`.
- Missing/invalid payload -> `400 VALIDATION_ERROR`.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): Mini App auth как обязательный MVP контур.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): endpoint и error baseline.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): HMAC validation details.
