---
description: WHAT/WHY для shared event transport, polling и Telegram-бота как runtime contour MVP.
status: active
---
# Events Polling And Bot Runtime

## Purpose

Зафиксировать единый runtime baseline для событий, polling и Telegram-бота, чтобы slices использовали общий transport без semantic drift.

## Architectural decisions

- `events` является shared transport для domain changes, но семантика события принадлежит owning slice.
- Polling `GET /events?since=<cursor>` является MVP delivery mechanism для read-side sync.
- Telegram-бот выступает отдельным presentation contour: получает inbound actions и отправляет outbound notifications, не обходя серверные инварианты.
- `review.negative` является явным fan-out exception: это единственный зафиксированный case, где notify target шире actor-targeted default.

## Boundary rules

- Слайс публикует события только после успешной write-operation.
- Bot-driven commands должны проходить те же auth/RBAC/state checks, что и REST flows.
- Event transport должен сохранять stable shape для future migration на SSE/WS.
- Duplicate bot/polling deliveries не должны приводить к повторным domain side effects.

## Runtime ownership

- `delivery-tracking` владеет semantics статусных событий.
- `delivery-assignment` владеет semantics `order.assigned`.
- `reviews-feedback` владеет semantics `review.created` и `review.negative`.
- `telegram-bot` и `events` shared layers не владеют бизнес-правилами, только transport/runtime delivery.

## Related guide

- [.memory-bank/guides/events-polling-and-bot-integration.md](../guides/events-polling-and-bot-integration.md): HOW-правила реализации polling consumers, event publication и bot integrations.

## Normative inputs

- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md): event polling contract и error shape.
- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md): bot ingress/egress contract.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): status transition ownership.

## Source artifacts

- [doc/API_GUIDELINES.md](../../doc/API_GUIDELINES.md): REST/events baseline.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): command/read flows и system contours.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): event examples и bot runtime behavior.
