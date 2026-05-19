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
- Public storefront visibility опирается на явный shop status boundary (`WORKING` / `NOT_WORKING`), а не на скрытые removal flags.
- Catalog MVP не вводит destructive removal semantics как продуктовую норму для shops, menu pages и products.
- Catalog runtime baseline для admin provisioning, seller catalog writes, seller-protected reads и public storefront resolution является durable DB-backed storage; route-local in-memory catalog state не является нормативным runtime source of truth.
- `shops` имеют три разные identity roles: technical PK `shop.id`, durable provisioning identity `sellerId + shop name`, и public routing identity (`primaryPublicPath`, `secondaryPublicPath`). Эти роли MUST NOT сливаться молча в один field.
- Public routing identity immutable across rename; history/redirect layer for older paths is not part of the current baseline.
- Starter menu pages/products, созданные provisioning flow, являются обычными durable `catalog` записями, а не скрытым demo bootstrap state.
- Payment identity и anti-replay markers (`payment_provider_tx_id`, `telegram_payment_charge_id`, `provider_payment_charge_id`, invoice/payment reference) должны иметь явную persistence policy и DB-level uniqueness там, где это применимо.
- Session/security persistence отделяется по чувствительности данных: session identifiers не попадают в JS-readable persistent storage baseline, а non-sensitive client preferences имеют explicit fallback policy.
- Non-production `dev-runtime` server profiles persist runtime checkout/payment state and operational delivery state through isolated SQLite JSON-state files when explicit runtime paths are configured. This durability is for staging/local/test server profiles and does not replace the target production Prisma/PostgreSQL persistence model.

## Catalog start showcase reference persistence

- Persistence стартовой Витрины принадлежит `catalog` и хранит только references на products/shops плюс curation metadata вроде active flag и ordering.
- Витрина MUST NOT snapshot цену, описание, медиа или public routing fields product/shop; public reads резолвят эти поля из текущего `Product`/`Shop` state.
- Product showcase unlink удаляет только showcase reference и MUST NOT удалять или мутировать underlying product.
- Favorite shop references ограничены 3 active public items; public reads скрывают references, у которых shop/product deleted, missing или not publicly visible (`NOT_WORKING`).

## Staff panel persistence boundaries

- `Staff panel` является admin-web surface над двумя разными identity sources, а не новым shared user abstraction.
- Courier staff profile опирается на `User` с ролью `COURIER`, `telegram_user_id`, nickname/display name and delivery-assignment state fields.
- Operator staff profile опирается на `AdminAccount` с ролью `OPERATOR`, email/login, `password_hash`, session policy and staff metadata.
- Admin/boss accounts остаются bootstrap/env-managed и не создаются через Staff panel.
- Soft delete/deactivate не удаляет historical order/review/audit references; `admin` не видит archived staff, `boss` видит archive and can reactivate.
- Staff rating adjustments and staff lifecycle commands require explicit actor/timestamp metadata; они не должны записываться как неструктурированные comments only.
- Staff panel metrics are read models over source-of-truth data:
  - courier delivered order count derives from assigned orders reaching `DELIVERED`;
  - courier average review rating derives from `reviews-feedback`;
  - operator processed order count derives from unique order write-actions by the operator.
- `FAILED` остается future lifecycle decision; Staff panel may name the business bucket, but must not introduce `OrderStatus.FAILED` without updating [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md).

## Slice to data ownership

- `catalog`: `shops`, shop description/media/status, immutable public routing paths, menu pages, products, product description/media, seller ownership rules, seller Telegram binding read-model needs, public visibility rules, start showcase references/favorite shop references, and the durable runtime persistence boundary for provisioning/storefront resolution.
- `checkout-payment`: paid order creation, payment transaction identity, order snapshots.
- `delivery-assignment`: `orders` read/update touchpoints for `CREATED -> ASSIGNED`, courier roster fields (`isActive`, `acceptingOrdersUntil`, `autoOfferEnabled`, rating penalty baseline), `order_status_history`, slice-owned `delivery_assignment_audit`, `events`.
- `delivery-tracking`: post-assignment order lifecycle, operator/courier status write evidence and its `order_status_history`/`events` writes.
- `order-cancellation`: cancellation reason, actor, refund state.
- `reviews-feedback`: `reviews` model, courier average review rating source data и negative alert semantics.
- `admin-access`: credentials, sessions, auth audit, operator `AdminAccount` auth semantics and password hash baseline consumed by Staff panel.

## Related guide

- [.memory-bank/guides/storage-and-state-implementation.md](../guides/storage-and-state-implementation.md): HOW-правила раскладки persistence logic, state journals и frontend/client state boundaries.

## Normative inputs

- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment boundary.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../contracts/catalog-seller-provisioning-and-visibility.md): seller provisioning and public visibility.
- [.memory-bank/contracts/catalog-start-showcase-contract.md](../contracts/catalog-start-showcase-contract.md): reference persistence стартовой Витрины и admin-only curation.
- [.memory-bank/states/order-lifecycle.md](../states/order-lifecycle.md): order/refund lifecycle rules.

## Source artifacts

- [doc/DATA_MODEL.md](../../doc/DATA_MODEL.md): таблицы, поля и slice coverage.
- [doc/PRD.md](../../doc/PRD.md): snapshot, refund и lifecycle business rules.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): shared database without shared business logic.
