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
- Если payment flow идет через Telegram/Bot transport, inbound webhook/update проходит source verification (`secret_token` или эквивалент) до domain processing.
- Payment identity должна иметь DB-level uniqueness по trusted transaction identifiers, чтобы duplicate delivery не создавала второй заказ.
- Payment finalization, order creation и публикация события выполняются в одной транзакционной boundary или эквивалентном atomic flow.
- Monitoring/alerting для provider callback/status contour обязателен как deploy gate: non-2xx responses и latency spikes должны быть наблюдаемы.
- Manual recovery path для stuck/ambiguous payment confirmation должен быть документирован до go-live, даже если provider-specific runbook появится позже.

## Forbidden

- Нельзя создавать заказ на основании client-only сигнала об оплате.
- Нельзя повторным callback-ом создать второй заказ.
- Нельзя считать `invoiceClosed` или другой client-only payment UX event trusted business confirmation.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): order creation only after successful payment.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): checkout/payment API boundary.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): transport-level baseline around checkout/payment flow.
