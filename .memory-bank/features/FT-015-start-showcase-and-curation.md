---
description: Feature C4 L3 для стартовой Витрины после выбора языка и admin-only curation catalog references.
status: active
---
# FT-015 Стартовая Витрина и Курирование

## Требования

- `REQ-034`
- `REQ-001`, `REQ-003`, `REQ-026`, `REQ-027`, `REQ-029`

## Ownership

- Owning slice: `catalog`.
- Contours: `mini-app` public read; admin-web session affordances на storefront для валидных platform admin sessions.
- Touched layers для будущей реализации: presentation + application + domain + infrastructure.
- Shared extraction не оправдан: curation Витрины является catalog-owned списком references с правилами visibility/RBAC внутри `catalog`, а не reusable shared primitive.

## Execution boundary

- `FT-015` владеет customer entry после first-run language selection: клиент попадает на стартовую Витрину вместо generic shop list.
- Generic browse/list остается доступен через четвертую ссылку "весь Худжанд".
- Read data Витрины выводится из текущих `Product`/`Shop` записей через references; цена, описание и медиа не дублируются как showcase snapshots.
- Write-операции Витрины являются узкими curation commands: add/unlink product reference и favorite/unfavorite shop reference.
- Product unlink from showcase MUST NOT удалять, скрывать или мутировать underlying product.

## Текущее состояние реализации

- Repo-local implementation complete: root `/` теперь открывает стартовую Витрину после language overlay, generic browse/list доступен через "весь Худжанд" на `/shops`.
- Backend runtime монтирует public `GET /api/v1/showcase` и admin-only curation endpoints для product/shop references через валидную admin session `BOSS`/`ADMIN`.
- Prisma/runtime persistence хранит reference-only showcase product и favorite shop rows; public read резолвит live `Product`/`Shop` fields и скрывает `NOT_WORKING`/deleted references.
- Post-review repair closed the blocking repo-local curation usability gaps: storefront admin long-press/context-menu opens a stable add-to-showcase action, curation mutations expose controlled feedback and refresh/reconcile state, storefront admin menu supports favorite/unfavorite for the current shop, and dev-runtime `OPTIONS` preflight advertises `DELETE` for curation endpoints.
- Focused и общий catalog gates прошли; `REQ-034` переведен в `verified`.

## Use cases

- После выбора языка клиент видит стартовую Витрину с блоком избранных магазинов и списком товаров "Сегодня популярны".
- Клиент открывает товар с Витрины и продолжает обычный catalog/cart/checkout flow.
- Клиент нажимает "весь Худжанд" и попадает в общий browse/list магазинов.
- Platform admin, находясь в активном `WORKING` магазине, long-press на товар и добавляет его на Витрину.
- Platform admin на Витрине long-press на товар и убирает его с Витрины без удаления товара.
- Platform admin через "меню админов" делает магазин избранным или убирает из избранных.

## Acceptance criteria

- После first-run language selection customer navigation ведет на стартовую Витрину, а не напрямую на generic shop list.
- Стартовая Витрина показывает список товаров "Сегодня популярны" из catalog-owned showcase product references.
- Над списком товаров Витрина показывает до 3 избранных `WORKING` магазинов и четвертую ссылку "весь Худжанд" на generic browse/list shops screen.
- Product cards на Витрине резолвят текущее имя товара, цену, описание, медиа и shop identity из live catalog state, а не из stored snapshots.
- Public showcase read исключает references, у которых product или parent shop deleted, unavailable for public browse, либо shop имеет статус `NOT_WORKING`.
- Только platform admin с валидной admin session и ролью `BOSS`/`ADMIN` может add/unlink showcase products или favorite/unfavorite shops.
- Seller identity и seller edit mode не дают showcase curation permissions.
- Admin curation affordances видимы только когда active storefront context имеет валидную admin session; иначе customer/seller UI не должен показывать "меню админов".
- Favorite shops ограничены 3 active public references.
- Удаление товара с Витрины является unlink-only и MUST NOT удалять или мутировать underlying product.

## Edge cases & failure modes

- Если referenced product становится deleted/unavailable или его shop становится `NOT_WORKING`, public showcase read скрывает его без обязательной немедленной cleanup.
- Если favorite shop становится `NOT_WORKING` или deleted, он скрывается из public favorite list и не занимает public slot.
- Повторная попытка добавить уже showcased product должна быть idempotent или возвращать controlled conflict без duplicate public rows.
- Попытка сделать избранным четвертый shop возвращает controlled business error и не меняет существующие favorite references.
- Expired или invalid admin session должна скрывать/block curation controls и возвращать auth/RBAC errors на write commands.

## Constraints / invariants

- Стартовая Витрина является частью `catalog`; она не создает новый recommendation, analytics, checkout, payment или order slice.
- Showcase persistence хранит только references плюс ordering/curation metadata; она MUST NOT snapshot mutable product/shop presentation fields.
- `NOT_WORKING`/deleted shops/products никогда не видны публично через Витрину.
- Admin curation относится к platform-admin scope (`admin-web` роли `BOSS`/`ADMIN`), не к seller scope.
- Showcase write commands являются catalog curation actions и должны следовать project-wide audit/error conventions для admin writes.

## Normative inputs

- [.memory-bank/contracts/catalog-start-showcase-contract.md](../contracts/catalog-start-showcase-contract.md): read/write contract, RBAC, инварианты и error posture.
- [.memory-bank/contracts/catalog-public-api.md](../contracts/catalog-public-api.md): public storefront visibility и browse-safe fields.
- [.memory-bank/contracts/admin-auth-contract.md](../contracts/admin-auth-contract.md): admin session и role boundary.
- [.memory-bank/features/FT-003-language-selection-and-localization.md](FT-003-language-selection-and-localization.md): entry point выбора языка.
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](FT-010-seller-storefront-editing-and-store-admin.md): shared storefront и разделение seller/admin surfaces.
- [.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md](FT-011-db-backed-catalog-runtime-baseline.md): durable catalog runtime baseline.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): catalog-owned reference persistence.

## Verification targets

- Выбор языка -> стартовая Витрина.
- Public read Витрины резолвит live product/shop fields и скрывает `NOT_WORKING`/deleted references.
- "весь Худжанд" открывает generic browse/list shops.
- Admin-only long-press add/unlink product curation.
- Cap 3 избранных магазинов и admin-only favorite/unfavorite controls.

## Test strategy pointers

- e2e: first-run language selection ведет на Витрину, а browse/list reachable через "весь Худжанд".
- frontend/integration: Витрина рендерит live product/shop updates без stored snapshot drift.
- integration: public showcase исключает `NOT_WORKING`/deleted shop/product references.
- integration/RBAC: `BOSS`/`ADMIN` can curate; seller и anonymous/customer sessions не могут.
- integration: удаление товара с Витрины unlink-ит reference без удаления product.
