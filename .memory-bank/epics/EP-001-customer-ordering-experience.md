---
description: Epic C4 L2 для клиентского пути: public catalog, локализация и checkout/payment.
status: active
---
# EP-001 Customer Ordering Experience

## Value

Дать клиенту законченный и понятный путь от первого открытия Mini App до создания оплаченного заказа внутри Telegram, а seller-у дать каноничный catalog-owned способ запускать и поддерживать storefront без отдельного тяжелого builder-а.

## Included features

- `FT-001` catalog browse and seller management baseline
- `FT-010` seller storefront editing and store admin
- `FT-011` DB-backed catalog runtime baseline
- `FT-002` checkout payment and paid order creation
- `FT-003` language selection and localization baseline
- `FT-009` mini app shell and Telegram WebView UX baseline

## Success metrics

- Клиент может просматривать витрину без авторизации.
- Seller получает admin-provisioned skeleton shop и редактирует owned storefront на тех же компонентах, что и customer view.
- Admin-provisioned и seller-edited catalog data переживают runtime restart/reset благодаря DB-backed catalog runtime.
- Public browse видит только `WORKING` магазины, а `NOT_WORKING` остаются видимыми только owning seller-у.
- Заказ появляется только после успешной оплаты.
- При payment error/timeout запись заказа отсутствует и доступен retry.
- Первый запуск с language overlay не блокирует дальнейшее использование продукта после выбора языка.
- Mini App стабильно работает в Telegram WebView без UX-деградации из-за viewport/safe-area.

## Acceptance criteria

- Public catalog доступен без JWT.
- Seller управляет только своими магазинами и товарами внутри `catalog` scope.
- Seller edit mode использует тот же storefront contour и те же базовые storefront-компоненты, что и customer browse.
- Первый skeleton shop создается admin provisioning flow, а не пустым self-service builder-ом seller-а.
- Catalog provisioning и storefront resolution опираются на durable DB-backed runtime, а не на process-local in-memory state.
- Public visibility магазина определяется явным статусом `WORKING/NOT_WORKING`.
- При checkout Telegram auth и payment flow завершаются созданием заказа со статусом `CREATED` только после подтвержденного успеха провайдера.
- Ошибка оплаты возвращает controlled error и повторную попытку без побочного создания заказа.
- Язык `ru/en/tj` выбирается на первом запуске и сохраняется для последующих сессий.
- UI корректно работает в Telegram WebView: safe-area учитывается, viewport не "прыгает", действия дают явную визуальную обратную связь.

## Constraints / invariants

- Нет заказа без `PAID`.
- Нет отдельной seller capability вне `catalog` для MVP.
- Seller contour может иметь несколько presentation surfaces, но owner slice для seller management остается `catalog`.
- В `catalog` MVP нет UI-функционала `delete` для shops, menu pages и products.
- Локализация входит в MVP scope, но не должна дробить capability model на отдельный слайс.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): customer-facing MVP scope.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): slice and contour boundaries.
- [doc/PROJECT_SPECIFICATION.md](../../doc/PROJECT_SPECIFICATION.md): narrative user flows and frontend scope.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): localization, WebView UX and transport details.
