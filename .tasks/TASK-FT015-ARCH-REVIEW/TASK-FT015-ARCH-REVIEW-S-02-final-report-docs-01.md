---
description: S-02 Slice/Contour Drift review for current FT-015 showcase changes.
status: final
---
# TASK-FT015-ARCH-REVIEW S-02 Slice/Contour Drift

## Verdict

VERDICT: APPROVE

## Findings

Blocking findings: none.

Я не нашел drift, где `FT-015` смешивает platform admin, seller edit mode, customer Mini App, admin-web auth или ownership `catalog` так, чтобы это нарушало текущие specs/contracts.

## Boundary Assessment

Owning capability slice: `catalog`.

Owning contours:
- `mini-app`: public read для root `/`, generic browse `/shops`, storefront `/shops/:publicPath`.
- `admin-web` session boundary: только проверка валидной admin cookie-session и curation commands для `BOSS`/`ADMIN`.
- `seller-web` / seller edit mode: не получает showcase curation permissions.

Touched layers:
- frontend presentation/routes;
- backend dev-runtime presentation routes;
- catalog application/domain repository boundary;
- Prisma/runtime persistence.

Shared extraction: не требуется и не появляется; showcase остается `catalog`-owned reference list, а не shared recommendation/admin primitive.

## Scope Checks

### Routes `/`, `/shops`, `/shops/:publicPath`

PASS.

- `frontend/src/app/router.tsx` добавляет отдельный `/shops` route, while `/shops/:publicPath` остается storefront route через `isStorefrontPathname`.
- `frontend/src/slices/catalog/routes/catalog-route.tsx:72` сначала отделяет `/shops/:publicPath`.
- `frontend/src/slices/catalog/routes/catalog-route.tsx:84` рендерит стартовую Витрину только для `/`.
- `frontend/src/slices/catalog/routes/catalog-route.tsx:88` оставляет `/shops` и прочий non-storefront catalog path как generic browse.
- `frontend/src/slices/catalog/model/showcase-view-model.ts` строит `весь Худжанд` как `/shops`.

Это совпадает с `FT-015`: root после language overlay становится showcase, а generic shop list остается доступным через `/shops`.

### Catalog Ownership

PASS.

- Public showcase read смонтирован как `GET /api/v1/showcase` в catalog runtime: `backend/src/dev-runtime/routes/catalog.routes.ts:27`.
- Curation routes остаются под catalog API family: `backend/src/dev-runtime/routes/catalog.routes.ts:405` и `:434`.
- Application logic добавляет только catalog reference operations: `backend/src/slices/catalog/application/catalog.service.ts:320`.
- Persistence хранит `CatalogShowcaseProduct` / `CatalogFavoriteShop` references, not product/shop snapshots: `backend/prisma/schema.prisma`.

Нет признака нового recommendation/analytics/checkout/order ownership.

### Platform Admin vs Seller Edit Mode

PASS.

- Storefront admin affordance появляется только из `canCurateShowcaseFromStorefront`: `frontend/src/slices/catalog/components/catalog-page.tsx:514`.
- Это состояние берется из admin session probe: `frontend/src/slices/catalog/routes/catalog-storefront-route.tsx:35`.
- Seller edit mode продолжает жить в `storefront.access.canEdit`; product context/click editor path остается seller-owned: `frontend/src/slices/catalog/components/storefront-menu-sections.tsx:104`.
- Backend curation writes не используют seller session; они требуют `resolveCatalogCurationAdminSession`: `backend/src/dev-runtime/routes/catalog.routes.ts:407` и `:436`.

Итог: seller ownership alone не становится curator. Если пользователь одновременно seller и platform admin, curator capability исходит из admin session, не из seller edit mode.

### Admin Session Probe

PASS with note.

- Probe route `GET /api/v1/admin/catalog/showcase` возвращает только `{ canCurate: true }` после валидной admin session: `backend/src/dev-runtime/routes/catalog.routes.ts:39`.
- Missing/invalid/non-admin frontend states fail closed to `{ canCurate: false }`: `frontend/src/slices/catalog/api/catalog-api.ts:642`.
- Role gate допускает только `admin` / `boss`: `backend/src/dev-runtime/admin-access-runtime.ts:346`.
- Admin auth resolver still uses the existing protected admin route session boundary and origin/referer validation.

Non-blocking note: probe is intentionally called from customer storefront/root UI to decide whether to render admin affordances. That is allowed by the FT-015 contract wording ("admin session affordances на storefront"), but keep it narrow: it should not grow into a broader admin-web bootstrap inside Mini App.

### "меню админов" in Storefront

PASS.

- Root showcase menu renders only when `showcase.admin.canCurate`: `frontend/src/slices/catalog/components/catalog-page.tsx:368`.
- Storefront menu renders only when `canCurateShowcaseFromStorefront`: `frontend/src/slices/catalog/components/catalog-page.tsx:514`.
- Product add-to-showcase affordance is also gated by `canCurateShowcase`: `frontend/src/slices/catalog/components/storefront-menu-sections.tsx:177`.

Это не leak в customer/seller UI by default. It is an admin-session affordance layered onto the existing storefront, as specified.

## Evidence

Specs/contracts inspected:
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/contracts/catalog-start-showcase-contract.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `doc/ARCHITECTURE.md`

Code areas inspected:
- `frontend/src/app/router.tsx`
- `frontend/src/shared/lib/routes.ts`
- `frontend/src/slices/catalog/routes/catalog-route.tsx`
- `frontend/src/slices/catalog/routes/catalog-storefront-route.tsx`
- `frontend/src/slices/catalog/components/catalog-page.tsx`
- `frontend/src/slices/catalog/components/storefront-menu-sections.tsx`
- `frontend/src/slices/catalog/api/catalog-api.ts`
- `backend/src/dev-runtime/routes/catalog.routes.ts`
- `backend/src/dev-runtime/admin-access-runtime.ts`
- `backend/src/slices/catalog/application/catalog.service.ts`
- `backend/src/slices/catalog/presentation/catalog.controller.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.reader.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts`
- `backend/prisma/schema.prisma`

Commands run:
- `npm run test:catalog:runtime -- --runInBand`
  - PASS: `29 passed`.
- `npx jest --config jest.config.cjs frontend/src/tests/app/root-router.spec.tsx frontend/src/tests/slices/catalog/catalog-route.spec.tsx frontend/src/tests/slices/catalog/catalog-api.spec.ts --runInBand`
  - PASS: `3 suites passed`, `29 tests passed`.

## Residual Risks

- There is no blocker, but the frontend evidence is stronger for default hidden admin controls than for a full positive admin-curation UI interaction in a browser/Telegram WebView.
- Existing working tree has many FT-015 changes and line-ending warnings from Git on Windows; I did not change implementation/spec files and did not normalize files.

## Decision

APPROVE for S-02 Slice/Contour Drift.

FT-015 keeps the start showcase and curation inside `catalog`, preserves the route split `/` vs `/shops` vs `/shops/:publicPath`, uses `admin-access` only as an auth/RBAC boundary for platform-admin curation, and does not grant seller edit mode showcase curation rights.
