---
description: Epic C4 L2 для клиентского пути: public catalog, cart/order composition, checkout/payment и customer status visibility.
status: active
---
# EP-001 Customer Ordering Experience

## Value

Дать клиенту законченный и понятный путь от первого открытия Mini App до выбора товаров, cart/order composition, checkout, оплаты, создания заказа и customer-facing мониторинга доставки внутри Telegram, а seller-у дать каноничный catalog-owned способ запускать и поддерживать storefront без отдельного тяжелого builder-а.

## Included features

- `FT-001` catalog browse and seller management baseline
- `FT-015` стартовая Витрина и admin-only curation
- `FT-010` seller storefront editing and store admin
- `FT-011` DB-backed catalog runtime baseline
- `FT-012` customer product selection and cart/order composition
- `FT-002` checkout payment and paid order creation
- `FT-013` customer checkout handoff and paid order creation flow
- `FT-017` guarded e2e mock payment mode
- `FT-014` customer order status visibility and delivery tracking integration
- `FT-003` language selection and localization baseline
- `FT-009` mini app shell and Telegram WebView UX baseline

## Success metrics

- Клиент может просматривать витрину без авторизации.
- После выбора языка клиент попадает на стартовую Витрину с "Сегодня популярны", избранными магазинами и переходом к общему browse/list магазинов.
- Seller получает admin-provisioned skeleton shop и редактирует owned storefront на тех же компонентах, что и customer view.
- Admin-provisioned и seller-edited catalog data переживают runtime restart/reset благодаря DB-backed catalog runtime.
- Public browse видит только `WORKING` магазины, а `NOT_WORKING` остаются видимыми только owning seller-у.
- Клиент может выбрать товары из `WORKING` storefront и явно увидеть cart/order composition перед checkout.
- Checkout стартует из валидного composition payload, а не из isolated route без выбранных товаров.
- Заказ появляется только после успешной оплаты.
- При payment error/timeout запись заказа отсутствует и доступен retry.
- После оплаты клиент видит созданный заказ и customer-safe delivery status до `COMPLETED`.
- Первый запуск с language overlay не блокирует дальнейшее использование продукта после выбора языка.
- Mini App стабильно работает в Telegram WebView без UX-деградации из-за viewport/safe-area.

## Acceptance criteria

- Public catalog доступен без JWT.
- Стартовая Витрина становится customer-facing entry point после language overlay и не подменяет общий список магазинов: ссылка "весь Худжанд" ведет к browse/list.
- Товары и избранные магазины на стартовой Витрине публично резолвятся из актуального `catalog` state, а не из snapshot-копий.
- Curation Витрины доступна только platform admin с валидной admin session и ролью `BOSS`/`ADMIN`; seller не может добавлять товары на Витрину или управлять избранностью магазинов.
- Seller управляет только своими магазинами и товарами внутри `catalog` scope.
- Seller edit mode использует тот же storefront contour и те же базовые storefront-компоненты, что и customer browse.
- Первый skeleton shop создается admin provisioning flow, а не пустым self-service builder-ом seller-а.
- Catalog provisioning и storefront resolution опираются на durable DB-backed runtime, а не на process-local in-memory state.
- Public visibility магазина определяется явным статусом `WORKING/NOT_WORKING`.
- Customer cart/order composition является явным состоянием до checkout и не создает заказ, резерв или payment side effect.
- Переход из catalog/cart в checkout использует осмысленный payload с выбранным shop, line items, quantities и preview snapshots; backend revalidation обязательна до оплаты.
- При checkout Telegram auth и payment flow завершаются созданием заказа со статусом `CREATED` только после подтвержденного успеха провайдера.
- Ошибка оплаты возвращает controlled error и повторную попытку без побочного создания заказа.
- После создания заказа customer-facing статус использует `FT-005` polling/event contract и не дублирует ownership delivery operations.
- Язык `ru/en/tj` выбирается на первом запуске и сохраняется для последующих сессий.
- UI корректно работает в Telegram WebView: safe-area учитывается, viewport не "прыгает", действия дают явную визуальную обратную связь.

## Constraints / invariants

- Нет заказа без `PAID`.
- Нет отдельной seller capability вне `catalog` для MVP.
- Seller contour может иметь несколько presentation surfaces, но owner slice для seller management остается `catalog`.
- В `catalog` MVP нет UI-функционала `delete` для shops, menu pages и products.
- Локализация входит в MVP scope, но не должна дробить capability model на отдельный слайс.
- Customer status visibility в рамках EP-001 является read-only consumer flow; lifecycle operations остаются в `FT-004`, `FT-005` и `FT-006`.
- Стартовая Витрина хранит только catalog references; `NOT_WORKING`/deleted shops/products MUST NOT быть публично видимыми, а удаление товара с Витрины является unlink, не product delete.

## Customer workflow boundary

- Каноничный customer E2E flow для EP-001: `language selection -> start showcase -> catalog product selection -> cart/order composition -> checkout handoff -> Telegram auth/payment -> paid order CREATED -> customer status visibility via events/polling`.
- `FT-001/FT-010/FT-011` дают catalog/storefront source of truth; `FT-012` превращает browse в customer order intent.
- `FT-015` меняет стартовую точку browse: customer entry после выбора языка ведет на showcase, а общий список магазинов остается доступен через "весь Худжанд".
- `FT-002` остается owner для auth/payment/order-creation semantics; `FT-013` закрывает реальный mounted customer workflow вокруг него.
- `FT-005` остается owner для delivery tracking state/event semantics; `FT-014` закрывает customer-facing visibility without delivery operations ownership.

## Source artifacts

- [doc/PRD.md](../../doc/PRD.md): customer-facing MVP scope.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): slice and contour boundaries.
- [doc/PROJECT_SPECIFICATION.md](../../doc/PROJECT_SPECIFICATION.md): narrative user flows and frontend scope.
- [doc/BRIEF_EXT.md](../../doc/BRIEF_EXT.md): localization, WebView UX and transport details.
