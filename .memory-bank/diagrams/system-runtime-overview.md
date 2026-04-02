---
description: ASCII-схема системных контуров и основных runtime-потоков MVP между интерфейсами, backend, event transport и PostgreSQL.
status: active
---
# System Runtime Overview

## Why this matters

- Схема помогает агенту быстро понять, какие контуры являются presentation channels, где проходит trust boundary и как изменения доходят до клиентов.

## Diagram

```text
                           +----------------------+
                           |   Telegram platform  |
                           |  WebApp + Bot API    |
                           +----------+-----------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
      +---------------------+                   +---------------------+
      | Mini App WebView    |                   | Telegram bot        |
      | client-facing UX    |                   | notifications/review|
      +----------+----------+                   +----------+----------+
                 |                                         |
                 | REST/auth/checkout/events              | webhook/update + outbound bot calls
                 v                                         v
             +-----------------------------------------------------------+
             |                    Backend monolith                        |
             |-----------------------------------------------------------|
             | slices: catalog, checkout-payment, delivery-*, reviews,   |
             |         admin-access                                       |
             | shared: auth, errors, event transport, bot/runtime glue   |
             +----------------------+----------------------+--------------+
                                    |                      |
                                    | writes domain data   | publishes after successful writes
                                    v                      v
                          +-------------------+    +-------------------+
                          | PostgreSQL        |    | events transport  |
                          | orders, shops,    |    | ordered changes   |
                          | products, reviews,|    | stable polling    |
                          | sessions, audit   |    | shape             |
                          +---------+---------+    +---------+---------+
                                    ^                      |
                                    |                      |
                                    +----------+-----------+
                                               |
                                               v
                              GET /events?since=<cursor>
                                               |
                              +----------------+----------------+
                              |                                 |
                              v                                 v
                    +-------------------+             +-------------------+
                    | Mini App refresh  |             | Admin web refresh |
                    | user-facing state |             | operations state  |
                    +-------------------+             +-------------------+
```

## Detailed system view

```text
Khujandi Mini App
layered monolith + vertical slices

+----------------------------------------------------------------------------------+
|                                   SYSTEM                                         |
+----------------------------------------------------------------------------------+
|                                                                                  |
|  +-------------------------+      HTTP / REST / Events      +------------------+ |
|  |  Mini App Frontend      | <----------------------------> |  Backend         | |
|  |  React + Vite           |                                |  NestJS + Prisma | |
|  +-------------------------+                                +------------------+ |
|  |                         |                                |                  | |
|  |  app/                   |                                |  shared/         | |
|  |    bootstrap            |                                |    auth          | |
|  |    router               |                                |    errors        | |
|  |    providers            |                                |    events        | |
|  |                         |                                |    db            | |
|  |  shared/                |                                |                  | |
|  |    ui/                  |                                |  slices/         | |
|  |    state/               |                                |    catalog       | |
|  |    lib/                 |                                |    checkout-pay  | |
|  |    i18n/                |                                |    delivery-*    | |
|  |    telegram/            |                                |    reviews       | |
|  |      mini-app-runtime   |                                |    admin-access  | |
|  |      adapter            |                                |                  | |
|  |      ----------------   |                                |                  | |
|  |      ready/expand       |                                |                  | |
|  |      theme adapter      |                                |                  | |
|  |      viewport adapter   |                                |                  | |
|  |      safe-area adapter  |                                |                  | |
|  |      lifecycle adapter  |                                |                  | |
|  |      back/swipe policy  |                                |                  | |
|  |      feature detect     |                                |                  | |
|  |      popup/confirm API  |                                |                  | |
|  |      storage policy     |                                |                  | |
|  |                         |                                |                  | |
|  |  slices/                |                                |                  | |
|  |    catalog              |                                |                  | |
|  |    checkout-payment     |                                |                  | |
|  |    delivery-tracking    |                                |                  | |
|  |    reviews-feedback     |                                |                  | |
|  |                         |                                |                  | |
|  +-----------+-------------+                                +--------+---------+ |
|              |                                                       |           |
|              | uses primitives only                                  |           |
|              v                                                       v           |
|    +------------------------+                           +----------------------+ |
|    | runtime state exposed  |                           | business invariants  | |
|    | to frontend slices     |                           | auth/payment/order   | |
|    |                        |                           | created only server  | |
|    | theme                  |                           | side trust decisions | |
|    | stable viewport        |                           |                      | |
|    | safe-area              |                           |                      | |
|    | lifecycle              |                           |                      | |
|    | popup helpers          |                           |                      | |
|    | storage helpers        |                           |                      | |
|    +------------------------+                           +----------------------+ |
|                                                                                  |
|  +-------------------------+                                                     |
|  | Telegram WebApp API     |                                                     |
|  | window.Telegram.WebApp  |                                                     |
|  +-----------+-------------+                                                     |
|              ^                                                                   |
|              | ONLY THIS LAYER TALKS DIRECTLY                                    |
|              +---------------- mini-app runtime adapter -------------------------+|
|                                                                                  |
+----------------------------------------------------------------------------------+
```

## Runtime rules in one screen

- Ни bot, ни Mini App не обходят серверные инварианты.
- Событие публикуется только после успешной write-операции.
- Polling shape должен оставаться совместимым с будущим переходом на SSE/WS.
- Telegram ingress считается недоверенным transport, пока не пройдены verification и idempotency checks.
- `shared/telegram/mini-app-runtime-adapter` является единственной прямой точкой доступа к `window.Telegram.WebApp`.

## Normative sources

- [.memory-bank/product.md](../product.md)
- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md)
- [.memory-bank/architecture/events-polling-and-bot-runtime.md](../architecture/events-polling-and-bot-runtime.md)
- [.memory-bank/contracts/api-events-baseline.md](../contracts/api-events-baseline.md)
- [.memory-bank/contracts/telegram-bot-contract.md](../contracts/telegram-bot-contract.md)
