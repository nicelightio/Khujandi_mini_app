---
description: S-03 Backend Code Deep Review report for FT-015 start showcase implementation.
status: final
---
# TASK-FT015-ARCH-REVIEW S-03 Backend Code Deep Review

## Verdict

VERDICT: REJECT

## Findings

### P1 - Favorite shop cap is not atomic in the Prisma-backed writer

References:
- `.memory-bank/contracts/catalog-start-showcase-contract.md`: active favorite shops are capped at 3.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:79` starts `favoriteShop`.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:90` counts active visible favorite refs.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:109` creates a new favorite ref after that separate count.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:120` reactivates an existing ref after that separate count.
- `backend/prisma/schema.prisma:139` defines `CatalogFavoriteShop` with uniqueness only on `shopId`, not on any capped slot/invariant.

Problem:
The cap check and mutation are separate Prisma operations and are not inside a transaction or DB-enforced slot model. Two concurrent valid admin requests can both observe `activeCount < 3` and both create/reactivate refs, leaving more than 3 active visible favorites. The public reader later slices output to 3 at `catalog-start-showcase.reader.ts:85`, but that hides the data-integrity violation instead of enforcing the curation invariant.

Hidden refs note:
The implementation intentionally does not count active refs whose shop is currently `NOT_WORKING`, which matches the "hidden refs do not consume public slot" edge case. The gap is what happens when hidden active refs later become `WORKING`, or when concurrent curation writes race: active visible refs can exceed the intended cap and public ordering becomes implicit truncation rather than controlled curation state.

Expected correction:
Make favorite mutation atomic. Practical options: transactional lock/serializable section around count+write, or a 3-slot model with DB uniqueness. Add a focused concurrency/regression test for `favoriteShop`.

### P1 - Showcase curation writes bypass catalog write event/audit posture

References:
- `doc/ARCHITECTURE.md` requires significant write operations to emit events.
- `.memory-bank/features/FT-015-start-showcase-and-curation.md` requires showcase write commands to follow project-wide audit/error conventions for admin writes.
- `backend/src/slices/catalog/domain/catalog.types.ts:145` keeps catalog write event entities limited to `shop | menu_page | product`.
- `backend/src/slices/catalog/application/catalog.service.ts:323` through `backend/src/slices/catalog/application/catalog.service.ts:368` expose curation commands as `Promise<void>`.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:27` through `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:150` mutate refs without event/audit write and without a transaction pairing mutation with observability.
- `backend/src/dev-runtime/routes/catalog.routes.ts:405` and `backend/src/dev-runtime/routes/catalog.routes.ts:434` return only `{ ok: true }` after admin curation writes.

Problem:
FT-015 curation changes a public customer entry surface and is performed by platform admins. Current backend persistence mutates reference rows but leaves no durable catalog event or admin audit trail for add/unlink/favorite/unfavorite. This is inconsistent with existing catalog write style, where shop/menu/product writes return `CatalogWriteResult` and persist events transactionally.

Expected correction:
Add slice-local curation event/audit records, or explicitly route these writes through an approved admin audit path. Persist the reference mutation and event/audit atomically in the DB-backed path.

### P2 - Global OPTIONS response does not advertise DELETE for curation routes

References:
- `backend/src/dev-runtime/routes/catalog.routes.ts:405` mounts `POST`/`DELETE` for showcase product curation.
- `backend/src/dev-runtime/routes/catalog.routes.ts:434` mounts `POST`/`DELETE` for favorite shop curation.
- `backend/src/dev-runtime/dev-api-server.ts:26` handles every `OPTIONS` request before route dispatch.
- `backend/src/dev-runtime/dev-api-server.ts:27` calls `json(204, null)` with default methods.
- `backend/src/dev-runtime/http-runtime.ts:35` defaults allowed methods to `GET,POST,OPTIONS`.

Problem:
The actual DELETE handlers return `DELETE,OPTIONS`, but browser preflight never reaches those handlers because `OPTIONS` is short-circuited globally. A cross-origin browser request for unlink/unfavorite can fail preflight because `Access-Control-Allow-Methods` omits `DELETE`. Current runtime tests call the helper client directly and do not exercise browser CORS preflight.

Expected correction:
Either include `DELETE` in the global dev-runtime OPTIONS allow-methods or route OPTIONS through route handlers so each endpoint advertises its actual methods. Add a focused preflight test for the admin curation DELETE endpoints.

## Non-blocking Observations

- Public read filtering is mostly aligned: Prisma reader excludes inactive refs, deleted products/shops, and `NOT_WORKING` shops before returning showcase products/favorites (`catalog-start-showcase.reader.ts:79` and `:97`).
- Reference-only persistence is aligned: Prisma schema stores `productId`/`shopId`, `sortOrder`, `isActive`, and timestamps without product/shop snapshots (`backend/prisma/schema.prisma:127` and `:139`; migration lines `2` through `36`).
- Runtime fixture and persistence include showcase/favorite refs and pass current happy-path coverage, but they do not prove the DB-backed concurrency invariant.
- `unlinkShowcaseProduct` and `unfavoriteShop` are idempotent no-ops for absent refs. This may be acceptable as idempotency, but it is looser than the contract's possible `NOT_FOUND` posture; decide explicitly during the fix.

## Checks Run

- `npm run test:catalog:unit` - PASS, 26 tests.
- `npm run test:catalog:integration` - PASS, 22 tests.
- `npm run test:catalog:runtime` - PASS, 29 tests.

## Scope Notes

Owning slice: `catalog`.

Contours reviewed:
- `mini-app` public read via `GET /api/v1/showcase`;
- `admin-web` admin-session curation writes via `/api/v1/admin/catalog/showcase/*`.

Touched layers reviewed:
- domain types;
- application service;
- Prisma schema/migration;
- Prisma showcase reader/writer;
- dev-runtime catalog routes;
- in-memory/runtime fixture and SQLite persistence;
- focused backend catalog tests.

Shared extraction: not justified and not needed for FT-015; showcase remains catalog-owned reference curation.
