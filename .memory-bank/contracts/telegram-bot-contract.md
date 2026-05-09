---
description: Контракт Telegram-бота как обязательного runtime contour для уведомлений, courier actions, operator chat redirects и review flows.
status: active
---
# Telegram Bot Contract

## Bot roles in MVP

- outbound notifications: новый заказ, courier offer, assignment claim, delayed/unassigned alert, смена статуса, негативный отзыв;
- inbound actions: courier availability, courier claim, courier status progression where bot is the interaction channel;
- operator chat redirect: order-bound menu for contacting customer/courier/shop owner;
- review flows: клиентский и курьерский отзывы через bot-guided steps.

## Outbound delivery rules

- `order.created`: уведомление operator/admin по настройкам панели и/или operational defaults.
- `order.offer_created`: explicit auto-offer fan-out активным свободным курьерам или targeted delivery конкретному courier for manual offer.
- `order.offer_repeated`: повторное уведомление через 3 минуты без claim.
- `order.assigned`: уведомление successful claimant courier and relevant operator/admin surfaces; событие означает successful claim, not pending offer.
- `order.delayed`: urgent alert selected operators/admins; panel also shows blinking red alert.
- `order.status_changed`: уведомление релевантным участникам процесса по текущему state/role mapping реализации.
- `review.negative`: fan-out активным администраторам как явное исключение к default actor-targeted policy.

## Courier menu baseline

Bot has `Курьер` menu:

- `Выйти на работу` / `Завершить прием заказов через 5 минут`.
- `Автоматически принимать заказы: ON/OFF` — in MVP this opts into auto-offer participation; courier still confirms/claims each order.

State fields behind the menu are KISS:

- `is_active`;
- `accepting_orders_until`;
- `auto_offer_enabled`;
- `rating_score`.

## Assignment offer / claim notes

- Pending offer is not `ASSIGNED`.
- Courier accepts offer through bot callback/action.
- Bot shows `пытаемся получить заказ...` while server claim is in flight.
- Server-side claim must be atomic and must validate order active/unassigned + courier active/free.
- Successful claim writes `order.assigned` and returns success only to the winning courier.
- Losing concurrent claim attempts get already-taken/expired feedback without domain side effects.
- Retry/duplicate delivery in bot transport must not create repeated assignment, history, rating or delayed side effects.

## Operator chat redirect

- Panel may deep-link/open bot with `orderId` context.
- Bot opens inline menu bound to the order:
  - написать клиенту;
  - написать курьеру;
  - написать хозяину магазина.
- After recipient selection, operator writes through bot; message should be persisted enough for order latest-message/comment previews.

## Inbound review payload baseline

- `rating` required, `1..5`
- `reason_code` enum required for structured review flow
- `comment` optional
- review direction обязан быть однозначно определен как `client -> courier` или `courier -> client`
- review flow допускается только для заказа в status `COMPLETED`; bot transport не активирует review write для незавершенных заказов
- duplicate Telegram update/callback для уже обработанного review payload должен short-circuit'иться без второго review write и без повторного `review.negative` fan-out
- callback payload review stepper-а должен нести prompt revision identity; stale callback от superseded prompt MUST short-circuit'иться как ignored outcome до mutation текущего draft state
- active review draft MUST храниться вне process-local memory: slice-owned durable draft state keyed by `actor + order + direction`, restart/redeploy-safe, shared-DB multi-instance-safe, and bounded by explicit TTL `1 hour`
- после истечения TTL runtime MAY fail closed как `missing_draft`, но этот fallback не должен быть implicit и требует нового `startFlow`

## Negative review fan-out contract

- low rating (`<= 2`) публикует канонический domain event `review.negative` после успешного review write
- notify target для `review.negative` ограничен активными администраторами и не переносит ownership admin auth/session в runtime слой бота
- transport retry допускается только как duplicate-safe redelivery и не создает повторную manual escalation или broadened fan-out

## Inbound courier action baseline

- Bot commands/steps не обходят серверную state machine.
- Любая bot-driven write-operation должна проходить auth/actor validation и порождать доменное событие.
- Courier status progression after claim follows [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md).

## Ingress security baseline

- Inbound updates принимаются только от trusted Telegram transport boundary (webhook secret / source verification по deploy policy).
- Duplicate delivery не должна приводить к повторной write-operation без idempotency/replay check.
- Suspicious, spoofed или noisy bot traffic должен логироваться с `trace_id` и обрабатываться как security/operational signal.
- Payment-related bot updates и `successful_payment`-подобные сигналы не обходят общий trusted payment confirmation contract.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): обязательные bot notifications и review flows.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): bot channel behavior и courier/status interaction.
- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): auth/error baseline для API-границы.
- [.memory-bank/contracts/operator-delivery-ops-contract.md](operator-delivery-ops-contract.md): operator delivery ops and chat redirect contract.
