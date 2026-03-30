---
description: Контракт trusted payment confirmation для MVP checkout/payment flow.
status: active
---
# Payment Confirmation Contract

## Decision boundary

Успешная оплата считается trusted только после server-side подтверждения от платежного провайдера.

## Required checks

- Проверка подлинности provider callback или server-to-server status confirmation.
- Проверка статуса операции как `success/paid` по каноническому полю провайдера.
- Anti-replay / idempotency check по `payment_provider_tx_id` или эквивалентному provider idempotency key.
- Заказ создается один раз на один trusted successful payment.

## Forbidden

- Нельзя создавать заказ на основании client-only сигнала об оплате.
- Нельзя повторным callback-ом создать второй заказ.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): order creation only after successful payment.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): checkout/payment API boundary.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): transport-level baseline around checkout/payment flow.
