---
description: WHAT/WHY для data ownership, persistence boundaries и shared database model MVP.
status: active
---
# Data Boundaries And Persistence

## Purpose

Зафиксировать, как общая PostgreSQL модель сочетается с vertical slices, чтобы shared DB не превращалась в shared business logic.

## Architectural decisions

- Проект использует общую БД, но ownership бизнес-правил остается у соответствующего slice.
- Доменные данные хранятся в явных колонках/таблицах; JSONB ограничен `events.payload`.
- Cross-slice reads допустимы по необходимости, но не дают права изменять чужие invariants.
- Snapshot-поля и explicit state-поля используются там, где это стабилизирует продуктовые правила MVP.

## Boundary rules

- `shop_name_snapshot` в `orders` фиксирует имя магазина на момент заказа и не обновляется при rename.
- `refund_status` и `refund_note` обязательны как explicit persistence boundary для ручного refund workflow.
- `order_status_history` является audit/state journal, а не derived convenience table.
- Soft-delete применяется к shops/products/orders и требует явного учета в query policy.
- Payment identity и anti-replay markers (`payment_provider_tx_id`, `telegram_payment_charge_id`, `provider_payment_charge_id`, invoice/payment reference) должны иметь явную persistence policy и DB-level uniqueness там, где это применимо.
- Session/security persistence отделяется по чувствительности данных: session identifiers не попадают в JS-readable persistent storage baseline, а non-sensitive client preferences имеют explicit fallback policy.

## Slice to data ownership

- `catalog`: `shops`, `products`, seller ownership rules.
- `checkout-payment`: paid order creation, payment transaction identity, order snapshots.
- `delivery-tracking`: order lifecycle and `order_status_history`.
- `order-cancellation`: cancellation reason, actor, refund state.
- `reviews-feedback`: `reviews` model и negative alert semantics.
- `admin-access`: credentials, sessions, auth audit.

## Related guide

- [.memory-bank/guides/storage-and-state-implementation.md](../guides/storage-and-state-implementation.md): HOW-правила раскладки persistence logic, state journals и frontend/client state boundaries.

## Normative inputs

- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment boundary.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): order/refund lifecycle rules.

## Source artifacts

- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): таблицы, поля и slice coverage.
- [doc/PRD.md](../../doc/PRD.md): snapshot, refund и lifecycle business rules.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): shared database without shared business logic.
