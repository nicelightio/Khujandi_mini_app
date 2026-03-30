---
description: Feature C4 L3 для checkout, Telegram auth и paid-only order creation.
status: active
---
# FT-002 Checkout Payment And Order Creation

## REQs

- `REQ-004`, `REQ-005`, `REQ-006`, `REQ-021`

## Use cases

- Клиент проходит Telegram auth на границе checkout.
- Система инициирует оплату у локального провайдера.
- После подтвержденного success создается заказ со статусом `CREATED`.

## Acceptance criteria

- `POST /auth/telegram` валидирует `initData` и `auth_date` на backend, включая `secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)` и проверочный `HMAC_SHA256(key=secret_key, message=data_check_string)`; `auth_date` старше 10 минут отклоняется.
- Payment success становится trusted только после server-side проверки подлинности provider callback или эквивалентного provider status confirmation.
- Успешная оплата создает один заказ с `payment_status = PAID`.
- Payment error/timeout не создает запись в `orders`.
- Клиент получает retry UX при неуспешной оплате.

## Edge cases & failure modes

- Нельзя повторным callback-ом создать второй заказ для той же успешной оплаты.
- Callback/confirmation без trusted provider verification не должен создавать заказ.
- Просроченный или неверно подписанный `initData` должен отклоняться.
- Ошибка payment provider должна возвращать контролируемый error contract.

## Constraints / invariants

- Нет заказа без подтвержденной оплаты.
- `initDataUnsafe` не используется для доверенных решений.
- Payment callback требует authenticity verification и replay protection по `payment_provider_tx_id` или эквивалентному idempotency key.

## Normative inputs

- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../contracts/telegram-mini-app-auth-contract.md): Telegram auth boundary и `initData` validation.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment confirmation и anti-replay.
- [.memory-bank/testing/index.md](../testing/index.md): baseline quality gates для feature verification.

## Verification targets

- `POST /auth/telegram`
- `POST /orders/checkout`

## Test strategy pointers

- e2e: successful payment creates order.
- e2e: failed/timeout payment keeps order absent and offers retry.
- integration: idempotency and provider callback handling.
- unit: auth TTL/signature validation helpers.
- integration: command responses include `updated_at` and `revision` when needed for downstream polling.
