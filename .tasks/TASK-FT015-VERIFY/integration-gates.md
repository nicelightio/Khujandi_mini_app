---
description: Integration gates verification report for FT-015 / REQ-034.
status: final
---
# FT-015 / REQ-034 Integration Gates Verify

## Scope

- Task: `TASK-FT015-VERIFY`
- Focus: verify #5, integration / gates / regression evidence.
- Requirement: `REQ-034` стартовая Витрина и курирование.
- Owning slice: `catalog`.
- Contours checked: `mini-app` public read, admin-session curation boundary.
- Touched layers during verification: none in implementation; this report only.
- Shared extraction: not applicable; no shared code changed.

## Spec Basis

- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/contracts/catalog-start-showcase-contract.md`
- `.memory-bank/requirements.md` (`REQ-034`)
- `.memory-bank/testing/index.md`
- `doc/ARCHITECTURE.md`

## Commands

### `npm run test:catalog`

Result: PASS.

Evidence excerpt:

```text
Test Suites: 58 passed, 58 total
Tests:       1 todo, 417 passed, 418 total
Time:        13.169 s
Ran all test suites.
```

Relevant covered regression evidence in the catalog suite:

- `tests/slices/catalog/catalog.runtime.showcase.cases.ts` serves public showcase from live catalog references and hides `NOT_WORKING` shop refs.
- Same suite enforces 3 active favorite shops cap.
- Same suite requires authenticated `BOSS`/`ADMIN` admin session before showcase writes.
- Same suite verifies showcase product unlink keeps the underlying product present and not deleted.
- `frontend/src/tests/slices/catalog/catalog-api.spec.ts` verifies frontend calls:
  - `GET /api/v1/showcase`
  - `GET /api/v1/admin/catalog/showcase` with credentials
  - `POST/DELETE /api/v1/admin/catalog/showcase/products/:productId` with credentials
  - `POST/DELETE /api/v1/admin/catalog/showcase/shops/:shopId` with credentials

### `npm run build:frontend`

Result: PASS.

Evidence excerpt:

```text
vite v7.3.1 building client environment for production...
120 modules transformed.
dist/index.html                 5.58 kB
dist/assets/index-tcK4qfls.css  41.88 kB
dist/assets/index-DUPvpa-K.js   368.74 kB
built in 1.64s
```

### `git diff --check`

Result: PASS, exit code `0`.

Evidence note:

```text
warning: in the working copy of '<multiple changed files>', LF will be replaced by CRLF the next time Git touches it
```

No whitespace errors were reported. The output contains Git line-ending normalization warnings on the already dirty working tree.

## Migration Presence

Result: PASS.

Found migration:

```text
backend/prisma/migrations/20260508190000_add_catalog_start_showcase_references/migration.sql
```

Migration creates reference-only persistence tables:

- `CatalogShowcaseProduct`
- `CatalogFavoriteShop`

It adds unique indexes on `productId` / `shopId`, active ordering indexes, and FK references to `Product(id)` / `Shop(id)`.

Prisma schema alignment checked:

```text
backend/prisma/schema.prisma:
127:model CatalogShowcaseProduct
139:model CatalogFavoriteShop
```

## API Endpoint Alignment

Result: PASS.

Frontend checked in `frontend/src/slices/catalog/api/catalog-api.ts`:

- `GET /api/v1/showcase`
- `GET /api/v1/admin/catalog/showcase`
- `POST /api/v1/admin/catalog/showcase/products/:productId`
- `DELETE /api/v1/admin/catalog/showcase/products/:productId`
- `POST /api/v1/admin/catalog/showcase/shops/:shopId`
- `DELETE /api/v1/admin/catalog/showcase/shops/:shopId`

Backend checked in `backend/src/dev-runtime/routes/catalog.routes.ts`:

- `GET /api/v1/showcase`
- `GET /api/v1/admin/catalog/showcase`
- `POST/DELETE /api/v1/admin/catalog/showcase/products/:productId`
- `POST/DELETE /api/v1/admin/catalog/showcase/shops/:shopId`

Admin curation route protection checked in `backend/src/dev-runtime/admin-access-runtime.ts`:

- curation resolves a protected admin route session;
- only roles `admin` and `boss` are accepted;
- other roles return `FORBIDDEN`.

## Working Tree Note

Before verification, the working tree was already dirty with many FT-015-related code/spec changes and untracked files. I did not revert or modify them. This report is the only intended verification artifact created by this pass.

## Residual Risk

- `git diff --check` passed, but line-ending normalization warnings remain for the dirty working tree.
- I did not run `prisma migrate deploy` or apply the migration to a fresh database; this pass verified checked-in migration presence and schema alignment only.
- I did not run a live browser/Telegram manual smoke; this focus was integration/gates/regression per request.

## Verdict

VERDICT: PASS for requested integration / gates / regression scope.

The requested gates passed, the FT-015 migration artifact is present, and frontend/backend showcase endpoint alignment is consistent with the mounted repo-local runtime.
