---
description: Backend/API verification report for FT-015 / REQ-034 start showcase curation.
status: passed
---
# TASK-FT015-VERIFY backend/domain/persistence/API

Дата: 2026-05-09

Scope: `FT-015` / `REQ-034`, verify #2 focus `backend/domain/persistence/API`.

Owning slice: `catalog`.
Contour: public `mini-app` read + admin-session curation route in dev runtime.
Touched layers inspected: domain, application, infrastructure/persistence, dev-runtime presentation routes.
Shared extraction: not justified; verified implementation remains catalog-owned.

## Acceptance Basis

- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/contracts/catalog-start-showcase-contract.md`
- `.memory-bank/requirements.md` `REQ-034`
- `.memory-bank/testing/index.md` FT-015 anti-cheat rule

Backend-focused acceptance checked:

1. Prisma schema + migration store showcase/favorite rows as references only, not snapshots.
2. Public `GET /api/v1/showcase` resolves live Product/Shop data.
3. Public reads hide deleted / `NOT_WORKING` shop and product references.
4. Admin curation routes require valid `BOSS`/`ADMIN` admin session; seller/customer/anonymous cannot curate.
5. Favorite shops expose max 3 public `WORKING` shops.
6. Hidden `NOT_WORKING`/deleted favorite refs do not occupy public slots.
7. Add/favorite is idempotent for existing active refs.
8. Unlink/unfavorite deactivates refs only and does not delete or mutate underlying Product/Shop.

## Commands

```powershell
npx prisma validate --schema backend/prisma/schema.prisma
```

Result: PASS.
Evidence excerpt: `The schema at backend\prisma\schema.prisma is valid`.
Note: Prisma emitted a non-blocking deprecation warning for `package.json#prisma`.

```powershell
npm run test:catalog:runtime -- --runTestsByPath tests/slices/catalog/catalog.runtime.integration.spec.ts
```

Result: PASS on initial verify run.
Evidence excerpt: `PASS tests/slices/catalog/catalog.runtime.integration.spec.ts`, `28 passed`.
Relevant FT-015 cases passed:
- public showcase resolves live references and hides `NOT_WORKING` shop refs;
- 3 active favorite shops cap;
- `BOSS`/`ADMIN` admin session required before showcase writes;
- product unlink keeps underlying product undeleted.

```powershell
npm run test:catalog:runtime -- --runInBand
```

Result: PASS on 2026-05-09 re-verify after favorite-cap blocker fix.
Evidence excerpt: `PASS tests/slices/catalog/catalog.runtime.integration.spec.ts`, `29 passed`.
New regression evidence: `does not let hidden favorite shops consume the public favorite cap` passed.

```powershell
npm run test:catalog:unit -- --runInBand
```

Result: PASS.
Evidence excerpt: `PASS tests/slices/catalog/catalog.unit.spec.ts`, `26 passed`.

```powershell
npm run test:catalog:integration
```

Result: PASS.
Evidence excerpt: `PASS tests/slices/catalog/catalog.integration.spec.ts`, `22 passed`.

```powershell
git diff --check -- backend tests
```

Result: PASS.
Evidence excerpt: no whitespace errors; only Windows line-ending warnings were emitted.

```powershell
node --experimental-strip-types --experimental-transform-types --loader ./scripts/ts-extension-loader.mjs --input-type=module -e "<runtime probe with unique suffix>"
```

Probe scenario:
- create 4 `WORKING` shops;
- favorite first 3;
- change first 3 to `NOT_WORKING`;
- read public showcase;
- try to favorite 4th `WORKING` shop.

Result: PASS evidence after blocker fix.

```json
{
  "visibleFavoritesBefore": 0,
  "favoriteFourthOutcome": "pass",
  "visibleFavoritesAfter": [
    {
      "id": "shop-runtime-10",
      "name": "Probe Shop moxa8uvp 4",
      "status": "WORKING"
    }
  ],
  "activeReferenceCountForProbe": 4
}
```

This confirms hidden `NOT_WORKING` favorite refs no longer consume the public favorite cap. Active hidden refs may remain stored as references, but cap enforcement now counts visible `WORKING` refs.

## Evidence

### Persistence

PASS. `backend/prisma/schema.prisma:127` and `backend/prisma/schema.prisma:139` define `CatalogShowcaseProduct` and `CatalogFavoriteShop` with only `productId` / `shopId`, `sortOrder`, `isActive`, timestamps and relations. No product/shop presentation snapshots are stored.

PASS. `backend/prisma/migrations/20260508190000_add_catalog_start_showcase_references/migration.sql:2` and `:13` create reference tables only. `:24` and `:27` add unique indexes on `productId` / `shopId`, supporting idempotent single active/inactive ref records. `:32` and `:36` use foreign keys to `Product` and `Shop`.

PASS. `npx prisma validate --schema backend/prisma/schema.prisma` passed.

### Public Read / Live Resolution

PASS. `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.reader.ts:61` reads active refs, selects current Product/Shop fields, and maps live fields into the public payload.

PASS. Product payload includes current `name`, `description`, `imageUrl`, `priceMinor`, `shopName`, and `shopPublicPath` from joined product/shop records at `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.reader.ts:97-113`.

PASS. The route is mounted as public `GET /api/v1/showcase` at `backend/src/dev-runtime/routes/catalog.routes.ts:27`.

### Visibility Filtering

PASS. Favorite shops are filtered to non-deleted `WORKING` shops and sliced to max 3 in `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.reader.ts:79-85`.

PASS. Showcase products are filtered to non-deleted products whose parent shop is non-deleted and `WORKING` in `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.reader.ts:97-102`.

PASS. Runtime test `serves public showcase from live catalog references and hides not-working shop refs` passed.

### Curation RBAC / API Mount

PASS. Admin curation probe route and write routes call `resolveCatalogCurationAdminSession` before curation writes at `backend/src/dev-runtime/routes/catalog.routes.ts:39`, `:407`, and `:436`.

PASS. `resolveCatalogCurationAdminSession` allows only `admin` / `boss` roles and throws `FORBIDDEN` otherwise at `backend/src/dev-runtime/admin-access-runtime.ts:346`.

PASS. Runtime test `requires BOSS or ADMIN admin session before showcase writes` passed for anonymous 401, manager 403, admin 200.

### Domain / Service Guards

PASS. `CatalogService.addShowcaseProduct` checks product exists, product is not deleted, parent shop exists, parent shop is not deleted, and parent shop status is `WORKING` before persisting a showcase product ref at `backend/src/slices/catalog/application/catalog.service.ts:323-346`.

PASS. `CatalogService.favoriteShop` checks shop exists, is not deleted, and status is `WORKING` before persisting favorite shop ref at `backend/src/slices/catalog/application/catalog.service.ts:353-364`.

PASS. `unlinkShowcaseProduct` and `unfavoriteShop` delegate to reference-only repository operations, not product/shop delete operations, at `backend/src/slices/catalog/application/catalog.service.ts:349-368`.

### Idempotency / Unlink Only

PASS. `CatalogStartShowcaseWriter.addShowcaseProduct` returns without duplicate mutation when an existing ref is already active, and reactivates inactive refs instead of creating duplicates at `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:27-55`.

PASS. `unlinkShowcaseProduct` returns on missing/inactive refs and only sets `isActive: false` at `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:58-74`.

PASS. `favoriteShop` returns when the ref is already active and reactivates inactive refs instead of creating duplicates at `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:79-123`.

PASS. `unfavoriteShop` only sets `isActive: false` at `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:127-143`.

PASS. Runtime test `unlinks showcase products without deleting the underlying product` passed.

### Favorite Cap Edge Case

PASS. The Prisma favorite cap now counts only active refs whose joined shop is public-visible. `CatalogStartShowcaseWriter.favoriteShop` calls `catalogFavoriteShop.count` with `isActive: true` plus `shop: { isDeleted: false, status: "WORKING" }` at `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:90-101`.

PASS. The dev-runtime in-memory repository mirrors the same behavior by computing `visibleFavoriteCount` from active refs whose shop exists, is not deleted, and has `status === "WORKING"` at `backend/src/dev-runtime/catalog-runtime-repository.ts:611-615`.

PASS. The Prisma fixture supports this relation-filter behavior for runtime tests via `where.shop.isDeleted` and `where.shop.status` in `backend/src/slices/catalog/infrastructure/prisma/catalog-runtime-prisma.fixture.ts:639-660`.

PASS. Runtime regression `does not let hidden favorite shops consume the public favorite cap` passed in `npm run test:catalog:runtime -- --runInBand`.

PASS. Manual runtime probe repeated the previously failing scenario and produced `favoriteFourthOutcome: "pass"` with the new `WORKING` shop visible in public showcase while the three hidden active refs remained stored.

## Verdict

VERDICT: PASS

Reason: backend/domain/persistence/API now satisfies the FT-015 / REQ-034 backend acceptance set for reference-only storage, live Product/Shop resolution, public hiding of `NOT_WORKING`/deleted refs, admin-only curation, max 3 visible favorite shops, idempotent add/favorite, and unlink/unfavorite without underlying Product/Shop deletion.

Residual risk: full end-to-end frontend long-press affordance was outside this backend/domain/API verify scope and is covered by the separate FT-015 frontend/integration evidence.
