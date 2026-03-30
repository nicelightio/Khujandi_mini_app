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
- Runtime behavior for browse and seller writes remains pending in follow-up tasks, so RTM lifecycle stays `planned` until code and tests land.

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
