# TASK-FT010-01 Verification

## Basis
- Backlog verify field for `TASK-FT010-01`.
- `FT-010` feature acceptance for persistence/test readiness.
- `IMPL-FT-010` verification targets and constraints, interpreted in this task's scaffold-only scope.

## Planned checks
- `npm run test:catalog:unit`
- `npm run test:catalog:integration`

## Executed checks
- `npm run test:catalog:unit` -> PASS
- `npm run test:catalog:integration` -> PASS
- `npx eslint "backend/src/shared/db/prisma-client.ts" "backend/src/slices/catalog/**/*.ts" "tests/slices/catalog/*.ts"` -> PASS

## Acceptance assessment
- Task verify target `execution-ready catalog persistence/test baseline for WORKING/NOT_WORKING, shop/product descriptions/media, menu pages, and skeleton provisioning without moving business logic to shared` -> PASS.
  Evidence:
  - `backend/prisma/schema.prisma` adds `ShopStatus`, `MenuPage`, `SellerShopBinding`, and richer `Shop`/`Product` persistence fields.
  - `backend/src/slices/catalog/domain/catalog.types.ts` keeps provisioning blueprint and seller baseline logic inside `catalog`.
  - `backend/src/shared/db/prisma-client.ts` contains only typed DB contract expansion, not domain rules.
  - `tests/slices/catalog/catalog.unit.spec.ts` and `tests/slices/catalog/catalog.integration.spec.ts` cover status-filtered public reads, menu pages, seller binding, provisioning-ready repository methods, and starter blueprint behavior.
- Constraint `legacy soft-delete cannot remain the new product boundary` -> PASS for this task scope.
  Evidence:
  - public repository reads now require explicit `status: "WORKING"` in addition to legacy `isDeleted: false`, so visibility baseline no longer depends only on soft-delete.
- Constraint `ownership remains in catalog` -> PASS.
  Evidence:
  - seller binding/provisioning blueprint/menu page baseline lives in `backend/src/slices/catalog/**/*`; `shared` only exposes Prisma-like DTO shapes.

## Out-of-scope but intentionally not verified here
- Shared storefront seller edit mode on the existing component tree.
- Real admin provisioning command/runtime path.
- Telegram-linked seller capability/session resolution.
- Narrow `/seller/*` status toggle runtime/UI.

## Verdict
- PASS

## Evidence summary
- Public catalog repository baseline now filters public shop/menu/product reads through explicit `WORKING` visibility.
- Catalog persistence contract now includes shop description/media, product description/image, menu pages, and seller binding records.
- Skeleton provisioning baseline is represented by a slice-owned blueprint helper plus repository methods needed by later provisioning/runtime tasks.
