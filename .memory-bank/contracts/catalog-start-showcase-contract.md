---
description: Контракт catalog-owned стартовой Витрины: public reads, admin curation writes, RBAC и reference persistence.
status: active
---
# Catalog Start Showcase Contract

## Purpose

- Зафиксировать boundary стартовой Витрины для `FT-015` до реализации.
- Сохранить Витрину как catalog-owned reference persistence, а не storage snapshot-ов product/shop.

## Owner

- Owning slice: `catalog`.
- Read contour: `mini-app` public customer read.
- Write contour: admin session affordances из storefront/admin-web context.

## Scope

- Public start showcase read после выбора языка.
- Product reference curation для "Сегодня популярны".
- Favorite shop reference curation с максимум 3 public favorite shops.
- Переход с Витрины к generic browse/list shops через "весь Худжанд".

## Read contract

- Public read возвращает стартовую Витрину без customer auth.
- Public read включает:
  - `favoriteShops`: до 3 visible `WORKING` shops.
  - `allKhujandLink`: navigation target для generic browse/list shops.
  - `popularTodayProducts`: ordered products, curated для Витрины.
- Каждый product item резолвит текущие product/shop facts из live `catalog` state: product identity, public shop path, display name, current price, description, media и browse-safe presentation fields, уже разрешенные catalog public API.
- Каждый favorite shop резолвит текущие shop facts из live `catalog` state: public path, name, status и browse-safe media/description fields.
- Public read MUST скрывать references, когда referenced product/shop больше не существует, deleted, not public или parent shop имеет статус `NOT_WORKING`.
- Public read MUST NOT раскрывать admin-only curation metadata сверх browse-safe ordering, нужного для rendering.

## Write contract

- Add product to showcase:
  - Input указывает existing product в текущем active `WORKING` shop context.
  - Command создает или активирует showcase product reference и optional ordering metadata.
- Unlink product from showcase:
  - Input указывает showcase product reference или product identity.
  - Command только removes/deactivates showcase reference.
  - Command MUST NOT удалять, скрывать, мутировать или detach underlying product from its shop/menu.
- Favorite shop:
  - Input указывает current shop.
  - Command создает или активирует favorite shop reference, когда shop eligible for public browse.
  - Active favorite shops MUST быть capped at 3.
- Unfavorite shop:
  - Command только removes/deactivates favorite shop reference.
  - Command MUST NOT удалять, скрывать или мутировать underlying shop.

## Auth / RBAC

- Write commands требуют валидную admin session из `admin-web` auth boundary.
- Разрешенные роли: `BOSS`, `ADMIN`.
- Явно запрещены: seller session, owner seller edit mode, customer/anonymous session, expired admin session.
- Storefront может показывать "меню админов" только при наличии валидной admin session; seller ownership alone MUST NOT показывать этот affordance.
- RBAC failure возвращает project-wide controlled error contract и оставляет showcase references без изменений.

## Invariants

- Showcase persistence хранит только references плюс curation/order metadata; без snapshots цены, описания или медиа product/shop.
- Product/shop display data на Витрине всегда резолвится из текущего `Product`/`Shop` state.
- `NOT_WORKING`/deleted shops/products не видны публично через Витрину.
- Public output избранных магазинов содержит максимум 3 items.
- Product unlink from showcase не является product delete.
- Showcase curation остается внутри `catalog` и не создает checkout/payment/order side effects.

## Payload outline

```text
StartShowcaseRead {
  favoriteShops: ShopSummary[0..3]
  allKhujandLink: { label: "весь Худжанд", target: BrowseShopsRoute }
  popularTodayProducts: ShowcaseProduct[]
}

ShowcaseProduct {
  productId
  shopId
  shopPublicPath
  name
  price
  currency
  description?
  media?
  sortOrder?
}

ShowcaseCurationCommand {
  action: add_product | unlink_product | favorite_shop | unfavorite_shop
  productId?
  shopId?
  referenceId?
}
```

## Errors

- `AUTH_REQUIRED`: missing или expired admin session для write.
- `FORBIDDEN`: actor не является `BOSS`/`ADMIN`, включая seller-only sessions.
- `NOT_FOUND`: referenced product/shop/showcase reference не существует.
- `SHOP_NOT_WORKING`: curation target не является active `WORKING` shop, когда command требует public eligibility.
- `SHOWCASE_FAVORITE_LIMIT`: cap 3 избранных магазинов будет превышен.
- `CONFLICT`: duplicate/non-idempotent reference conflict, если реализация не может трактовать command как idempotent.
- Все ошибки следуют `{ error: { code, message, details }, trace_id }`.

## Related docs

- [.memory-bank/features/FT-015-start-showcase-and-curation.md](../features/FT-015-start-showcase-and-curation.md): feature scope и acceptance.
- [.memory-bank/contracts/catalog-public-api.md](catalog-public-api.md): public browse-safe fields и visibility rules.
- [.memory-bank/contracts/admin-auth-contract.md](admin-auth-contract.md): admin session и role semantics.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): reference persistence boundary.
- [.memory-bank/testing/index.md](../testing/index.md): verification targets.
