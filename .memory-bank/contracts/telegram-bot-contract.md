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
- `order.assigned`: уведомление только назначенному курьеру; fan-out другим курьерам, администраторам или клиенту не является baseline-поведением этого события.
- `order.status_changed`: уведомление релевантным участникам процесса по текущему state/role mapping реализации.
- `review.negative`: fan-out активным администраторам как явное исключение к default actor-targeted policy.

## Assignment delivery notes

- `order.assigned` transport обязан сохранять actor-targeted semantics owning slice `delivery-assignment`.
- Retry/duplicate delivery в bot transport не должны приводить к повторному domain assignment side effect или расширению notify target.
- Если доставка сообщения курьеру временно недоступна, это operational/runtime проблема, а не причина менять доменную семантику assignment.

## Inbound review payload baseline

- `rating` required, `1..5`
- `reason_code` enum required for structured review flow
- `comment` optional
- review direction обязан быть однозначно определен как `client -> courier` или `courier -> client`
- review flow допускается только для заказа в status `COMPLETED`; bot transport не активирует review write для незавершенных заказов
- duplicate Telegram update/callback для уже обработанного review payload должен short-circuit'иться без второго review write и без повторного `review.negative` fan-out

## Negative review fan-out contract

- low rating (`<= 2`) публикует канонический domain event `review.negative` после успешного review write
- notify target для `review.negative` ограничен активными администраторами и не переносит ownership admin auth/session в runtime слой бота
- transport retry допускается только как duplicate-safe redelivery и не создает повторную manual escalation или broadened fan-out

## Inbound courier action baseline

- Bot commands/steps не обходят серверную state machine.
- Любая bot-driven write-operation должна проходить auth/actor validation и порождать доменное событие.

## Ingress security baseline

- Inbound updates принимаются только от trusted Telegram transport boundary (webhook secret / source verification по deploy policy).
- Duplicate delivery не должна приводить к повторной write-operation без idempotency/replay check.
- Suspicious, spoofed или noisy bot traffic должен логироваться с `trace_id` и обрабатываться как security/operational signal.
- Payment-related bot updates и `successful_payment`-подобные сигналы не обходят общий trusted payment confirmation contract.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): обязательные bot notifications и review flows.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): bot channel behavior и courier/status interaction.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): auth/error baseline для API-границы.
