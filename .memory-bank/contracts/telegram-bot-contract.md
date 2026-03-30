---
description: Контракт Telegram-бота как обязательного runtime contour для уведомлений и review flows.
status: active
---
# Telegram Bot Contract

## Bot roles in MVP

- outbound notifications: новый заказ, назначение курьера, смена статуса, негативный отзыв;
- inbound actions: courier status progression where bot is the interaction channel;
- review flows: клиентский и курьерский отзывы через bot-guided steps.

## Outbound delivery rules

- `order.created`: уведомление активным администраторам.
- `order.assigned`: уведомление назначенному курьеру.
- `order.status_changed`: уведомление релевантным участникам процесса по текущему state/role mapping реализации.
- `review.negative`: fan-out активным администраторам как явное исключение к default actor-targeted policy.

## Inbound review payload baseline

- `rating` required, `1..5`
- `reason_code` enum required for structured review flow
- `comment` optional

## Inbound courier action baseline

- Bot commands/steps не обходят серверную state machine.
- Любая bot-driven write-operation должна проходить auth/actor validation и порождать доменное событие.

## Ingress security baseline

- Inbound updates принимаются только от trusted Telegram transport boundary (webhook secret / source verification по deploy policy).
- Duplicate delivery не должна приводить к повторной write-operation без idempotency/replay check.
- Suspicious, spoofed или noisy bot traffic должен логироваться с `trace_id` и обрабатываться как security/operational signal.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): обязательные bot notifications и review flows.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): bot channel behavior и courier/status interaction.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): auth/error baseline для API-границы.
