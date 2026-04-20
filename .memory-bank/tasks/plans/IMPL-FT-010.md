---
description: Implementation plan для FT-010 seller shared storefront editing, skeleton provisioning и узкой seller-web админки магазина.
status: active
---
# IMPL-FT-010

## Goal

Доставить `FT-010` как `catalog`-owned seller capability expansion: admin-side provisioning создает skeleton shop со стартовыми страницами и товарами, seller получает edit mode в том же storefront contour и на тех же базовых компонентах, а отдельный `/seller/*` contour остается узкой store-admin поверхностью для `WORKING/NOT_WORKING` без второго builder-а и без delete UI.

## Current state

- `backend/prisma/schema.prisma` пока содержит только `Shop` и `Product` с legacy `isDeleted` baseline; полей для `WORKING/NOT_WORKING`, shop/product descriptions/media, menu pages и explicit seller-binding/provisioning artifacts нет.
- `backend/src/shared/db/prisma-client.ts` и `backend/src/slices/catalog/**/*` покрывают только public `shops/products`, seller rename и seller product create/update; admin provisioning, menu page writes, seller capability resolution и status-based visibility там отсутствуют.
- `backend/src/dev-runtime/dev-api-server.ts` сейчас монтирует только demo public catalog reads и admin auth runtime; seller/admin catalog runtime paths для `FT-010` еще не присутствуют.
- `TASK-FT010-02` added checked-in route/page scaffolding for `/shops/:publicPath`, `/seller/shops/status`, and `/admin/catalog/shops/provision`; the shared storefront boundary still points to the same `CatalogRoute` tree instead of a second seller storefront implementation.
- `frontend/src/slices/catalog/components/catalog-page.tsx` все еще рендерит browse-only список shops/products без menu page model, edit affordances и seller-aware storefront state.
- `frontend/src/seller/**/*` and seller-specific frontend smoke coverage now exist only as contour scaffolding; real auth/runtime wiring and status toggle behavior remain for later tasks.

## REQs

- `REQ-024`
- `REQ-025`
- `REQ-026`

## Verification targets

- shared storefront seller edit mode на том же component tree, что и customer browse
- admin provisioning с автоматическим skeleton shop bootstrap
- Telegram-linked seller capability resolution для `mini-app` и `/seller/*`
- public visibility gating для `WORKING/NOT_WORKING`
- narrow `seller-web` status toggle без destructive seller UI

## Normative inputs

- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../../features/FT-010-seller-storefront-editing-and-store-admin.md): feature acceptance, failure modes и verification targets.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../../epics/EP-001-customer-ordering-experience.md): parent epic success criteria.
- [.memory-bank/requirements.md](../../requirements.md): `REQ-024`, `REQ-025`, `REQ-026` и RTM.
- [.memory-bank/contracts/catalog-public-api.md](../../contracts/catalog-public-api.md): public browse boundary и status-based visibility.
- [.memory-bank/contracts/seller-catalog-write-policy.md](../../contracts/seller-catalog-write-policy.md): ownership, no-delete и rename policy.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](../../contracts/catalog-seller-provisioning-and-visibility.md): admin provisioning, seller binding и `WORKING/NOT_WORKING` rules.
- [.memory-bank/contracts/catalog-seller-access-and-session.md](../../contracts/catalog-seller-access-and-session.md): shared session family, `/seller/*` boundary и access failure posture.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](../../contracts/telegram-mini-app-auth-contract.md): Telegram-linked session bootstrap reused by seller capability resolution.
- [.memory-bank/contracts/mini-app-runtime-contract.md](../../contracts/mini-app-runtime-contract.md): seller mode activation only from server-validated access state.
- [.memory-bank/architecture/system-contours-and-slices.md](../../architecture/system-contours-and-slices.md): contour split и owner-slice rules.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../../architecture/data-boundaries-and-persistence.md): shop status, media, menu page and snapshot boundaries.
- [.memory-bank/testing/index.md](../../testing/index.md): seller contour verification basis и anti-cheat rules.

## Constraints

- Owning slice остается `catalog`, даже если реализация затрагивает одновременно `mini-app`, `seller-web` и admin-side provisioning surface.
- Shared storefront edit mode MUST переиспользовать существующий storefront contour и базовый component tree; второй seller-only storefront tree не вводится.
- `/seller/*` baseline MUST оставаться узкой store-admin поверхностью для легких catalog-owned controls и не втягивать reporting/analytics.
- Seller access MUST переиспользовать Telegram-linked identity и существующую session family; отдельный seller password или standalone credential store не вводятся.
- Legacy soft-delete assumptions должны быть удалены или подчинены explicit visibility policy; public storefront visibility определяется `WORKING/NOT_WORKING`, а не скрытым delete flag.
- MVP seller direction MUST NOT добавлять destructive `delete` actions для shops, menu pages и products.
- `REQ-020` rename/snapshot policy остается обязательным ограничением для `shop.name` edits.

## Invariants

- Edit/store-admin access появляется только после positive server-side ownership resolution.
- `NOT_WORKING` shop никогда не попадает в public browse, но остается видимым owning seller-у.
- Первый shop создается только admin provisioning flow; seller не стартует с пустого builder canvas.
- `shop_name_snapshot` в уже созданных orders не меняется при seller rename.
- Create/add flows могут расширять storefront data model, но не должны ломать существующую storefront layout model для customer browse.

## Steps

1. Расширить `catalog` persistence/test baseline под shop status, descriptions/media, menu pages, seller bindings и skeleton template data.
2. Подготовить frontend route/presentation boundaries для shared storefront edit mode, `/seller/*` store-admin и admin provisioning flow, не создавая отдельный seller storefront.
3. Реализовать admin provisioning command/runtime path с atomically создаваемым skeleton shop, starter pages/products и Telegram-linked seller binding.
4. Реализовать server-side seller capability resolution и status-based catalog visibility для public/customer и owner/seller reads.
5. Расширить seller write surface на shop/menu page/product editable fields, сохранив ownership, rename policy и no-delete baseline.
6. Подключить seller edit mode к существующему catalog storefront tree через contextual `click`/`long press` affordances и controlled save UX.
7. Подключить `/seller/*` status toggle и admin provisioning UI к backend runtime без отдельного seller auth model.
8. Собрать repo-local verification, UAT evidence и финальный docs/RTM sync по acceptance criteria `FT-010`.

## Expected touched files

- `.protocols/FT-010/plan.md`
- `.protocols/FT-010/decision-log.md`
- `.memory-bank/index.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/requirements.md`
- `.memory-bank/changelog.md`
- `backend/prisma/schema.prisma`
- `backend/src/shared/db/prisma-client.ts`
- `backend/src/dev-runtime/**/*`
- `backend/src/slices/catalog/**/*`
- `backend/src/slices/checkout-payment/**/*` при необходимости для shared seller capability/session reuse wiring
- `tests/slices/catalog/**/*`
- `frontend/src/app/**/*`
- `frontend/src/shared/lib/routes.ts`
- `frontend/src/shared/i18n/**/*`
- `frontend/src/shared/ui/**/*`
- `frontend/src/slices/catalog/**/*`
- `frontend/src/admin/**/*`
- `frontend/src/seller/**/*`
- `frontend/src/tests/app/**/*`
- `frontend/src/tests/admin/**/*`
- `frontend/src/tests/seller/**/*`
- `frontend/src/tests/slices/catalog/**/*`
- `.tasks/TASK-FT010-08/**/*`

## Tests

- `npm run test:catalog:unit`
- `npm run test:catalog:integration`
- `jest --config jest.config.cjs frontend/src/tests/slices/catalog`
- `jest --config jest.config.cjs frontend/src/tests/admin`
- `jest --config jest.config.cjs frontend/src/tests/seller`
- targeted runtime/dev integration coverage for seller capability resolution, provisioning flow and public visibility gating

## Quality gates

- `npm run lint`
- `npm run test:catalog`
- `jest --config jest.config.cjs frontend/src/tests/admin`
- `jest --config jest.config.cjs frontend/src/tests/seller`
- `npm run build:frontend`
- final acceptance/UAT evidence for shared storefront edit mode, skeleton provisioning and `WORKING/NOT_WORKING` visibility

## UAT steps

1. В `admin-web` создать магазин с названием и seller Telegram binding и подтвердить, что сразу появляются starter pages/products.
2. Открыть тот же shop под owning seller и убедиться, что edit affordances активируются на том же storefront tree, а для чужого или anonymous пользователя они отсутствуют.
3. Изменить `shop.name/description/media`, добавить menu page и обновить product fields; проверить controlled save feedback и отсутствие второй seller-only storefront UI.
4. Переключить магазин в `NOT_WORKING` через `/seller/*` и подтвердить, что public browse его скрывает, а owning seller продолжает видеть магазин.
5. Вернуть магазин в `WORKING` и убедиться, что public browse снова показывает storefront без delete affordances.
6. Проверить, что `/seller/*` остается narrow store-admin surface без sales stats/reporting, а RTM/docs фиксируют closure только по `REQ-024/025/026`.
