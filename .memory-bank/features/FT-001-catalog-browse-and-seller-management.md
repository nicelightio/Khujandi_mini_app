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
- `TASK-FT001-04` completed and verified the backend public browse read path for `shops/products` with soft-delete filtering.
- `TASK-FT001-05` completed and verified seller-scoped shop writes and rename marker logic.
- `TASK-FT001-06` completed and verified seller-scoped product writes with shop linkage validation.
- `TASK-FT001-07` completed the frontend public catalog wiring to backend browse reads, but formal verify failed because route/page rendering smoke coverage is still missing.
- `TASK-FT001-09` added the minimal repo-local backend Jest runner for catalog unit/integration specs.
- Final feature-wide acceptance and e2e closure remain pending; `TASK-FT001-08` is currently blocked by the `TASK-FT001-07` verification gap.

## Use cases

- Клиент просматривает витрину магазинов и товаров без авторизации.
- Продавец управляет только своими shops/products.
- Система скрывает soft-deleted сущности из customer-facing каталога.

## Acceptance criteria

- `shops` и `products` читаются без auth в customer-facing режиме.
- Seller write-операции ограничены собственными сущностями.
- Переименование магазина учитывает 1 бесплатную попытку, далее требует ручного учета платности.
- `shop_name` в уже созданных заказах не обновляется.

## Edge cases & failure modes

- Soft-deleted shop/product не должен появляться в витрине.
- Seller не может изменять чужие сущности.
- Повторное переименование после бесплатной попытки должно явно маркироваться как платное.

## Constraints / invariants

- Seller management остается частью `catalog`, а не отдельной capability.
- `shop_name_snapshot` в заказе неизменяем для уже созданных заказов.

## Normative inputs

- [.memory-bank/contracts/catalog-public-api.md](../contracts/catalog-public-api.md): public browse boundary and soft-delete expectations.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../contracts/seller-catalog-write-policy.md): seller ownership and rename policy boundary.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для public catalog, seller ownership и rename policy.

## Test strategy pointers

- e2e: public catalog browse without login.
- integration: seller ownership checks and soft-delete filtering.
- unit: rename pricing rule and snapshot preservation.
