---
description: Feature C4 L3 для shared storefront seller edit mode, admin-provisioned skeleton shops и узкой админки магазина.
status: active
---
# FT-010 Seller Storefront Editing And Store Admin

## REQs

- `REQ-024`, `REQ-025`, `REQ-026`

## Current implementation state

- Checked-in repo currently covers only the earlier `FT-001` baseline: public browse plus partial backend seller write logic for shop rename and product create/update.
- `TASK-FT010-01` added backend scaffold only: Prisma/catalog baseline now includes `ShopStatus`, rich shop/product fields, `MenuPage`, `SellerShopBinding`, provisioning-ready repository methods, and a starter provisioning blueprint.
- `TASK-FT010-03` now implements the backend provisioning command path: admin-triggered provisioning atomically creates the shop, Telegram-linked seller binding, starter menu pages, and starter products, and the checked-in dev runtime mounts a repo-local command endpoint for later UI wiring.
- `TASK-FT010-05` now extends backend seller catalog writes to owned shop metadata updates, menu page add/rename flows, and stronger product-to-menu-page ownership validation while preserving the existing rename/snapshot and no-delete policy.
- Post-change `red-verify` for `TASK-FT010-05` did not find an ownership or snapshot break, but it did open `TASK-FT010-13` because seller catalog writes still have no explicit event/audit semantics despite the project-wide observability invariant for significant writes.
- `TASK-FT010-13` closes that follow-up with explicit `catalog`-owned persisted events for seller shop/menu/product writes and freezes the MVP observability policy as event-backed inside `catalog` without adding a separate catalog audit table.
- `TASK-FT010-14` closes the remaining adapter drift by making seller write observability explicit at the `CatalogRepository` boundary itself and aligning the checked-in in-memory/runtime adapter with the same seller write event semantics.
- `TASK-FT010-15` closes the remaining sink-level asymmetry from the `TASK-FT010-14` red-verify follow-up: the checked-in in-memory/runtime adapter now records seller write artifacts into a shared runtime `events`-store analogue instead of a private seller-only sink, so non-persistent adapter behavior stays aligned with the project-wide event model.
- Post-change `red-verify` for `TASK-FT010-15` did not find a new semantic concern: for the checked-in repo-local runtime scope, seller write observability parity is now closed both at the repository artifact boundary and at the adapter sink semantics level.
- `TASK-FT010-02` added the checked-in frontend contour scaffold: `/shops/:shopId` now resolves through the same `CatalogRoute` tree as public browse, `/seller/shops/status` exists as a narrow `seller-web` shell, and `/admin/catalog/shops/provision` exists as an admin-side page shell for later runtime wiring.
- `TASK-FT010-06` now wires seller-owned edit affordances into that same shared storefront tree: `/shops/:shopId` stays on `CatalogRoute`/`CatalogPage`, owner-only click/long-press activation opens inline editors for shop/menu/product flows, non-seller users remain browse-only, and no second seller storefront tree is introduced.
- The checked-in save path for `TASK-FT010-06` is still repo-local frontend state/UX wiring rather than a mounted backend persistence runtime, while narrow `seller-web` status-toggle behavior remains for later UI/runtime closure.
- Post-change `red-verify` for `TASK-FT010-06` returned `semantic-concern`: the current shared-storefront seller edit mode still reconstructs menu/product content from public browse plus synthetic fallback data and reports frontend-local save success without the canonical seller storefront read/write boundary, so follow-up `TASK-FT010-18` is now `ready`.
- `TASK-FT010-18` closes that semantic/runtime gap: protected seller storefront reads now return canonical owner-visible `menuPages/products`, shared storefront submits call the checked-in seller write boundary and reload canonical data, and owner-visible `NOT_WORKING` storefront content no longer depends on public browse derivation or frontend-local success simulation.
- Post-change `red-verify` for `TASK-FT010-18` returned `semantic-concern`: the canonical seller storefront path is substantively correct for provisioned skeleton shops, but the checked-in runtime still contains older/unpaged product shapes, so follow-up `TASK-FT010-19` is now `ready` to prevent real seller-owned products from disappearing on owner storefront reads.
- `TASK-FT010-19` closes that compatibility gap: canonical seller storefront reads now preserve legacy owner-visible products without explicit menu-page linkage through an explicit `unpagedProducts` payload, and the shared storefront keeps those items editable without inventing a fake menu page.
- Post-change `red-verify` for `TASK-FT010-19` returned `semantic-pass`: for the checked-in mounted seller runtime, the explicit `unpagedProducts` compatibility path fixes the real owner-visibility gap without expanding public browse semantics or creating a second/synthetic storefront model.
- `TASK-FT010-16` closes that route-boundary follow-up: root contour selection now uses slash-bounded `/admin` and `/seller` families instead of broad string prefixes, hostile adjacent prefixes like `/admin-help` and `/seller-guide` stay on the customer app contour, and unknown `/seller/*` paths no longer silently render the status scaffold.
- `TASK-FT010-17` closes the remaining frontend route-boundary concern from `TASK-FT010-16`: unknown `/admin/*` paths now stay inside `admin-web` but render explicit not-found feedback instead of silently resolving to assignment or login fallbacks.
- `TASK-FT010-07` now closes the checked-in UI/runtime wiring gap for the remaining narrow seller/admin surfaces: `/admin/catalog/shops/provision` submits through the mounted protected provisioning command with controlled feedback, and `/seller/shops/status` loads owned shops plus persists `WORKING/NOT_WORKING` through the shared Telegram-linked seller runtime instead of a scaffold-only placeholder.
- Post-change `red-verify` for `TASK-FT010-07` returned `semantic-concern`: the new seller-web status flow is mounted and access-controlled, but it currently submits a broad cached shop payload through the generic seller update path, so a status toggle can silently overwrite stale shared-storefront metadata; follow-up `TASK-FT010-20` is now `ready`.
- `TASK-FT010-20` closes that seller-web follow-up without widening scope: the narrow status route now submits status-only intent, and the mounted seller runtime preserves omitted shop metadata instead of coercing absent fields into stale/null overwrites when status toggles happen after shared-storefront edits.
- Post-change `red-verify` for `TASK-FT010-20` returned `semantic-pass`: for the checked-in mounted seller runtime scope, the narrow status-only hardening fixes the real stale-overwrite risk without re-expanding `seller-web` into a second broad storefront editor or introducing a new cross-boundary drift.
- `TASK-FT010-08` closes final verification/docs sync for the checked-in feature scope: repo-local backend/runtime and frontend smoke coverage now explicitly prove shared storefront edit-mode reuse, admin-provisioned skeleton bootstrap, Telegram-linked seller access reuse, `WORKING/NOT_WORKING` owner/public visibility gating, and the baseline absence of delete UI on shared storefront plus narrow `seller-web` surfaces.
- Post-change `red-verify` for `TASK-FT010-08` returned `semantic-pass`: the final docs/RTM closure remains substantively aligned for the checked-in repo scope and does not hide a remaining `FT-010` semantic gap.
- Post-closure `/review` found one remaining checked-in repo follow-up outside the red-verify chain: `/shops/:shopId` still swallows missing/error cases into a synthetic fallback storefront, so `TASK-FT010-21` is now `ready` to replace fake browseable content with controlled missing/error states.
- `TASK-FT010-21` closes that remaining repo-local follow-up: the shared storefront route now prefers canonical seller data, falls back only to real public shop data, and renders controlled not-found/error states instead of fabricating a fake shop shell or starter product when both sources are absent or failing.
- Seller-aware session/access resolution is now formalized in the checked-in repo-local runtime: `POST /api/v1/auth/telegram` issues the existing Mini App cookie session family and protected seller reads resolve ownership from Telegram-linked bindings plus canonical `shop.sellerId` alignment.
- `TASK-FT010-11` closed the remaining runtime drift from `TASK-FT010-04`: repo-local `POST /api/v1/auth/telegram` and seller-protected catalog reads now share the checked-in `checkout-payment` auth/session module boundary and one Mini App user/session state instead of a route-local clone.
- `TASK-FT010-12` closed the remaining transport-level seam from that `red-verify`: repo-local Mini App cookie issuance now comes from the shared `checkout-payment` auth result itself, so mounted runtime auth no longer predicts or reconstructs the session token through `dev-runtime`-local state.
- Post-change `red-verify` for `TASK-FT010-12` did not open a new follow-up: the checked-in fix is substantively aligned with the shared Mini App auth transport intent, with only a maintenance note to keep raw cookie values server-only.
- Catalog runtime behavior still does not expose full `FT-010` flows, but the checked-in repo now includes the provisioning write path, mounted admin/seller UI wiring for provisioning and status control, plus the persistence baseline for shop descriptions, media assets, menu pages, product descriptions/images, and `WORKING/NOT_WORKING` visibility.
- Older checked-in catalog code still carries legacy soft-delete fields, but `TASK-FT010-01` moved public visibility baseline toward explicit `WORKING/NOT_WORKING` filtering.
- `red-verify` for `TASK-FT010-01` found a semantic concern to absorb in follow-up tasks: canonical seller ownership between legacy `Shop.sellerId` and Telegram-linked `SellerShopBinding` must be made explicit in provisioning and seller access resolution.

## Use cases

- Администратор provision-ит новый магазин, задает имя и привязывает Telegram account seller-а.
- Система автоматически создает skeleton storefront с несколькими стартовыми страницами меню и стартовыми товарами.
- Seller открывает тот же storefront contour, что и customer, и редактирует owned shop/menu/product контент на тех же компонентах.
- Seller использует узкую админку магазина для легких catalog-owned функций, начиная с переключения статуса `WORKING/NOT_WORKING`.
- Клиент видит только `WORKING` магазины и их публичный storefront-контент.

## Acceptance criteria

- Seller storefront edit mode использует тот же storefront contour и те же базовые storefront-компоненты, что и customer browse.
- Edit affordances активируются contextual `long press`/`click` на существующих storefront-компонентах; отдельный heavy seller builder/editor не вводится.
- Seller может редактировать `shop.name`, `shop.description`, `shop.header_image`, `shop.background_image` в пределах owned shop.
- Seller может редактировать имена страниц меню и добавлять новые страницы меню в пределах owned shop.
- Seller может добавлять и редактировать продукты в пределах owned shop, включая `product.name`, `product.description`, `product.price`, `product.image`.
- MVP не содержит UI-функционала `delete` для shops, menu pages и products.
- Первый skeleton shop не создается seller-ом с нуля; он автоматически появляется после admin-side provisioning и содержит стартовые страницы меню и стартовые товары, пригодные для дальнейшего редактирования.
- Seller access по shared storefront и `seller-web` store-admin contour должен резолвиться из Telegram-linked identity; отдельный независимый seller password baseline не вводится.
- Магазин имеет статусы `WORKING` и `NOT_WORKING`.
- `WORKING` магазин виден клиентам и owning seller-у; `NOT_WORKING` магазин скрыт из public browse и остается видимым только owning seller-у.
- Отдельная `seller-web` админка магазина в первой версии включает только легкие catalog-owned функции и не включает sales stats или другой cross-slice reporting.

## Edge cases & failure modes

- Seller MUST NOT видеть edit controls для чужого магазина.
- Отсутствие seller binding к Telegram identity MUST NOT выдавать edit mode или store-admin access.
- `NOT_WORKING` магазин MUST NOT появляться в public storefront browse.
- Shared storefront edit mode MUST NOT требовать второго, визуально отдельного storefront tree только ради seller UX.
- Create/add flows MAY вводить новые UI сущности, но они MUST NOT ломать существующую storefront layout model.

## Constraints / invariants

- Owning slice остается `catalog`.
- Shared storefront edit mode и узкая админка магазина являются presentation surfaces одного и того же owner slice, а не отдельной seller capability.
- `REQ-020` rename/snapshot policy остается в силе для shop name edits.
- MVP seller direction не вводит destructive removal semantics и не проектирует отдельный visual page builder.
- `seller-web` baseline ограничен только легкими catalog-owned controls; reporting/analytics требуют отдельного explicit scope change.

## Normative inputs

- [.memory-bank/contracts/catalog-public-api.md](../contracts/catalog-public-api.md): public browse boundary и visibility rules.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../contracts/seller-catalog-write-policy.md): seller edit ownership, no-delete и rename policy.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../contracts/catalog-seller-provisioning-and-visibility.md): admin provisioning, Telegram-linked ownership и `WORKING/NOT_WORKING` visibility.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](../contracts/catalog-seller-access-and-session.md): shared session family, `/seller/*` route boundary и seller access resolution.
- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md): contour split и owner-slice boundaries.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): catalog-owned entities, media и visibility persistence boundaries.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis для shared storefront edit mode и store-admin visibility.

## Verification targets

- shared storefront seller edit mode
- admin-provisioned skeleton shop bootstrap
- `seller-web` store-admin status toggle
- public visibility gating for `WORKING/NOT_WORKING`

## Test strategy pointers

- e2e: seller enters edit mode on owned storefront without switching to a second storefront UI.
- integration: Telegram-linked seller ownership resolution across shared storefront and store-admin requests.
- e2e/integration: admin provisioning creates skeleton shop with starter pages/products instead of an empty shop shell.
- e2e: `NOT_WORKING` shop is hidden from public browse while still visible to the owning seller.
- smoke: no destructive `delete` actions are exposed in seller storefront or store-admin baseline.

## Final verification status

- Checked-in `FT-010` scope is closed by `TASK-FT010-08` for the current repo reality.
- `REQ-024`, `REQ-025`, and `REQ-026` are now aligned to `done` in RTM.
