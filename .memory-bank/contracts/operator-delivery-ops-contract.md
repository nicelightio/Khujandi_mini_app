---
description: Boundary contract для operator delivery operations: panel read model, courier offers, status controls and chat redirects.
status: planned
---
# Operator Delivery Ops Contract

## Purpose

Закрепить KISS-boundary для operator/admin панели доставки без введения Redis, очередей, GPS tracking или CRM-чата в web panel.

## Roles

- `operator`: менеджер delivery operations.
- `admin`: includes `operator` capabilities.
- `courier`: принимает offers и ведет delivery statuses.
- `seller`/shop owner, customer: участники коммуникации по заказу.

## Operator panel read model

Default query returns orders for today + previous 3 calendar days.

Each row exposes:

- public order number;
- order summary/name;
- `created_at`;
- current `status`;
- computed `severity`;
- current courier display data or no-courier marker;
- assigned/claimed timestamp when present;
- latest message preview and sender role;
- status revision/cursor metadata for polling.

Expandable details expose:

- full `order_status_history`;
- actor role/name per status;
- time in status and time since order creation;
- last message/comment per role for that status, assigned by timestamp window.

## Severity baseline

- `DELAYED`: blinking red.
- cancelled/not fulfilled: purple.
- `COMPLETED`: neutral/gray.
- no accepted courier: light blue while fresh; escalates by age in panel UX.
- active delivery under 30 min: yellow.
- active delivery 30-60 min: orange.
- active delivery 60+ min: red.
- `DELIVERED`: still operator-attention state until `COMPLETED`.

## Commands

### Manual offer

Operator/admin selects a courier. The system creates a pending assignment offer and notifies the courier. Order status remains `CREATED`/`DELAYED` until courier claim succeeds.

### Auto-offer

When enabled, new unassigned orders are offered to all active free couriers.

Active/free MVP definition:

- active: courier explicitly started work and has not reached stop-after-5-min cutoff;
- free: no active order in `ASSIGNED`, `PICKED_UP`, `IN_PROGRESS`, `DELIVERED`.

### Claim

Claim must be atomic. The winning write requires:

- order status is `CREATED` or `DELAYED`;
- `courier_id` is empty;
- courier is active/free;
- offer is still claimable.

Success sets `courier_id`, `assigned_at`, status `ASSIGNED`, history/audit/event and returns updated state with string `revision`.

Already-taken/expired claim returns controlled failure without history/event side effects.

### Status change

Operator/admin status change requires confirmation and must write actor data to history/audit. Invalid transition returns `409 CONFLICT`.

### Chat redirect

Panel redirects to Telegram bot with order context. Bot shows recipient menu for customer/courier/shop owner.

## Events

Suggested event types:

- `order.offer_created`
- `order.offer_repeated`
- `order.assigned`
- `order.assignment_timeout`
- `order.delayed`
- `order.status_changed`
- `order.message_received`
- `order.message_sent`

All events use [.memory-bank/contracts/api-events-baseline.md](api-events-baseline.md): `type`, `entity`, `entity_id`, `payload`, `revision`, `created_at`.

## Timeout baseline

- After 3 minutes without claim: repeat notification.
- After another 3 minutes: order is `DELAYED`, operators get urgent notification.
- Personal offer second timeout: target courier `rating_score -= 1`.
- Broadcast offer timeout: no specific courier penalty.

## Source artifacts

- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md): feature scope and acceptance.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): lifecycle and transition ownership.
- [.memory-bank/contracts/telegram-bot-contract.md](telegram-bot-contract.md): bot runtime behavior.
