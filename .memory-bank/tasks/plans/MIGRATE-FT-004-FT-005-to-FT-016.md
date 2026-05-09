---
description: Staged migration plan from implemented FT-004/FT-005 v1 delivery operations to FT-016 operator/courier offer flow.
status: planned
---
# MIGRATE-FT-004-FT-005-to-FT-016

## Goal

Переехать от уже реализованной v1 delivery operations модели (`FT-004` direct assignment и `FT-005` old tracking chain) к целевой v2 модели `FT-016`: operator monitoring panel, offer/claim assignment, courier availability, `DELAYED`, `PICKED_UP` и operator-owned `DELIVERED -> COMPLETED`.

## Baseline assumption

- Старые `FT-004` и `FT-005` считаются implementation baseline, а не ошибкой.
- Admin panel уже реализована частично/полностью и должна быть сначала проинспектирована.
- Default strategy: repair/extend existing admin panel, not rebuild from scratch.
- Existing active orders must remain readable and operational during rollout.

## Normative inputs

- [.memory-bank/features/FT-004-courier-assignment.md](../../features/FT-004-courier-assignment.md)
- [.memory-bank/features/FT-005-order-tracking-and-events-polling.md](../../features/FT-005-order-tracking-and-events-polling.md)
- [.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md](../../features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md)
- [.memory-bank/contracts/operator-delivery-ops-contract.md](../../contracts/operator-delivery-ops-contract.md)
- [.memory-bank/contracts/telegram-bot-contract.md](../../contracts/telegram-bot-contract.md)
- [.memory-bank/states/order-lifecycle.md](../../states/order-lifecycle.md)
- [doc/ARCHITECTURE.md](../../../doc/ARCHITECTURE.md)

## Migration principles

1. Additive-first: add fields/tables/status support before changing behavior.
2. Keep `orders.courier_id`, `orders.status`, `assigned_at`, history and events compatible.
3. Do not bulk rewrite in-flight production orders to insert `PICKED_UP` or offers.
4. New v2 behavior applies to new orders/claims after the corresponding phase is enabled.
5. Keep legacy direct assignment isolated as explicit admin/operator override if it must remain temporarily.
6. Do not break admin panel features unrelated to delivery operations.
7. KISS: no Redis, queues, microservices, GPS, route optimization or complex dispatcher logic.

## Recommended phases

### Phase 0 — code baseline map

- Inspect current admin panel, delivery assignment, status machine, events/polling and Telegram bot runtime.
- Record actual v1 behavior and drift against `FT-004`, `FT-005`, `FT-016`.
- Identify smallest repair points in existing admin panel.

### Phase 1 — persistence/API compatibility

- Add/confirm statuses: `DELAYED`, `PICKED_UP`.
- Add/confirm role capability: `operator`; `admin` implies operator.
- Add courier availability fields: `is_active`, `accepting_orders_until`, `auto_offer_enabled`, `rating_score`.
- Add `assignment_offers` model/table without removing legacy assignment fields.
- Keep old order reads and status rendering valid.

### Phase 2 — operator panel read repair

- Adapt existing admin panel into desktop-first operator view.
- Show today + previous 3 days.
- Add severity colors and unassigned/`DELAYED` top alert.
- Add expandable status history and message/comment previews if data exists; otherwise scaffold read model cleanly.
- Preserve unrelated admin functionality.

### Phase 3 — courier availability and bot menu

- Add `Курьер` menu actions.
- Implement work availability and stop-after-5-min behavior.
- Implement `auto_offer_enabled` toggle as auto-offer participation, not true auto-accept.

### Phase 4 — assignment offers and atomic claim

- Manual assignment creates targeted offer, not `ASSIGNED`.
- Auto-offer creates/broadcasts offer only to active free couriers when enabled.
- Courier claim uses atomic conditional update/transaction.
- Normal v2 `order.assigned` event is published only after successful claim.
- Concurrent losers receive controlled already-taken result without side effects.

### Phase 5 — timeout and delayed escalation

- After 3 minutes without claim: repeat notification.
- After another 3 minutes: set/keep `DELAYED`, notify operators, show blinking red alert.
- Penalize `rating_score` only for timed-out personal offer.

### Phase 6 — lifecycle v2 commands

- Enable courier path: `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`.
- Enable operator/admin manual closure: `DELIVERED -> COMPLETED`.
- Keep legacy old-chain orders readable even if they skipped `PICKED_UP`.
- Validate invalid skip/replay/regression commands as `409 CONFLICT`.

### Phase 7 — cleanup legacy direct assignment

- Remove or clearly isolate legacy direct assignment path.
- If retained, name it as override and require explicit operator/admin intent.
- Verify docs, tests and admin UI no longer present normal direct assignment as the default flow.

## Rollback notes

- Auto-offer can be disabled without losing order list/admin panel read capability.
- If claim flow is unhealthy, keep legacy direct assignment override available temporarily.
- Do not rollback by deleting new columns/tables while application code may still read them.

## Verification gates

- Existing admin panel smoke still works.
- Old assigned/in-progress/delivered orders remain readable.
- Race test proves one successful claim.
- Duplicate Telegram callback test proves no duplicate assignment.
- Polling/event tests prove string `revision`/cursor compatibility.
- Operator panel test proves 4-day window, severity colors, `DELAYED` alert and `DELIVERED -> COMPLETED`.
- Bot menu test proves availability and auto-offer participation toggle.
