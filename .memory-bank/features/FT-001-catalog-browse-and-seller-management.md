---
description: Feature C4 L3 для публичной витрины и seller-side управления магазинами/товарами.
status: active
---
# FT-001 Catalog Browse And Seller Management

## REQs

- `REQ-001`, `REQ-002`, `REQ-020`

## Current implementation state

- `TASK-FT001-01` completed the docs-first freeze for public browse and seller write boundaries.
- `TASK-FT001-02` completed the backend `catalog` scaffold, Prisma baseline, and backend test skeleton.
- `TASK-FT001-03` completed the frontend `catalog` scaffold and public route shell.
- `TASK-FT001-04` completed and verified the backend public browse read path for `shops/products`.
- `TASK-FT001-05` completed and verified seller-scoped shop writes and rename marker logic.
- `TASK-FT001-06` completed and verified seller-scoped product writes with shop linkage validation.
- `TASK-FT001-07` completed and verified the frontend public catalog wiring to backend browse reads, including route/page smoke coverage for loading, empty, error, and ready states.
- `TASK-FT001-09` added the minimal repo-local backend Jest runner for catalog unit/integration specs.
- `TASK-FT001-08` completed the final verification/docs sync for `REQ-001`, `REQ-002`, and `REQ-020`, including route/page smoke coverage and RTM updates.
- Advanced seller surfaces are now split into `FT-010`: shared storefront edit mode, admin-provisioned skeleton shops, media-rich catalog editing, explicit `WORKING/NOT_WORKING` visibility, and narrow store-admin controls.
- Durable DB-backed catalog runtime baseline for provisioning and canonical storefront resolution is now tracked in `FT-011`.
- Customer product selection and cart/order composition on top of public storefront data are tracked in `FT-012`; `FT-001` remains the public browse baseline and does not own checkout payload orchestration.
- Checked-in repo code still contains legacy soft-delete fields/filters from the older catalog baseline; that is now explicit implementation drift relative to the normative no-delete catalog direction.

## Use cases

- Клиент просматривает витрину магазинов и товаров без авторизации.
- Продавец меняет только свои shops/products в пределах baseline ownership boundary.
- Система сохраняет `shop_name_snapshot` в уже созданных заказах при rename магазина.

## Acceptance criteria

- `shops` и `products` читаются без auth в customer-facing режиме.
- Seller write-операции ограничены собственными сущностями.
- Переименование магазина учитывает 1 бесплатную попытку, далее требует ручного учета платности.
- `shop_name` в уже созданных заказах не обновляется.

## Edge cases & failure modes

- Seller не может изменять чужие сущности.
- Повторное переименование после бесплатной попытки должно явно маркироваться как платное.
- Rename не должен приводить к cross-slice изменению snapshot-полей заказов.

## Constraints / invariants

- Seller management остается частью `catalog`, а не отдельной capability.
- `shop_name_snapshot` в заказе неизменяем для уже созданных заказов.
- Shared storefront seller edit mode и узкая админка магазина определяются в `FT-010` и не должны выносить seller management из `catalog`.

## Normative inputs

- [.memory-bank/contracts/catalog-public-api.md](../contracts/catalog-public-api.md): public browse boundary and storefront visibility baseline.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../contracts/seller-catalog-write-policy.md): seller ownership and rename policy boundary.
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](FT-010-seller-storefront-editing-and-store-admin.md): расширение seller contour поверх baseline ownership.
- [.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md](FT-012-customer-product-selection-and-cart-composition.md): customer-facing selection/cart state on top of public browse data.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для public catalog, seller ownership и rename policy.

## Test strategy pointers

- e2e: public catalog browse without login.
- integration: seller ownership checks.
- unit: rename pricing rule and snapshot preservation.

## Verification closure

- `REQ-001` is covered by public browse route/page smoke plus backend public read tests.
- `REQ-002` is covered by backend integration/unit checks for seller ownership guards.
- `REQ-020` is covered by rename policy unit/integration checks and by persistence scoping evidence that rename mutates only `catalog` shop data without cross-slice snapshot writes.
