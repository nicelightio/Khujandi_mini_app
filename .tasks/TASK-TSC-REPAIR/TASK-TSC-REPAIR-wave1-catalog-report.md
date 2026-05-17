---
task: TASK-TSC-REPAIR
wave: 1
role: subagent-implementer
scope: catalog
date: 2026-05-14
---

# TASK-TSC-REPAIR Wave 1 Catalog Report

## Result

PASS for catalog-owned TypeScript drift.

Catalog diagnostics from `.tasks/TASK-TSC-REPAIR/tsc-before.log` are resolved. Full repository Jest TypeScript check now passes:

```bash
npx tsc --noEmit -p tsconfig.jest.json
```

## Micro-check

- Owning slice: `catalog`.
- Contours touched: `mini-app` public storefront/showcase reads, `seller-web` seller storefront/store-admin runtime, `admin-web` catalog provisioning runtime.
- Layers touched: domain contract boundary, application/repository boundary types, dev-runtime route/repository adapter, Prisma infrastructure mappers/readers, catalog tests.
- Shared extraction: not justified. The changes are catalog-owned provisioning/public-path/fixture alignment and narrow catalog runtime mapping. No reusable cross-slice primitive was introduced.

## Files inspected

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/features/FT-015-start-showcase-and-curation.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-start-showcase-contract.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/testing/index.md`
- `.tasks/TASK-TSC-REPAIR/plan.md`
- `.tasks/TASK-TSC-REPAIR/triage-summary.md`
- `.tasks/TASK-TSC-REPAIR/tsc-before.log`
- Catalog source/test files changed below.

## Files changed

- `backend/src/slices/catalog/domain/catalog.types.ts`
- `backend/src/slices/catalog/infrastructure/prisma-catalog.repository.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-provisioning.writer.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-public.reader.ts`
- `backend/src/slices/catalog/infrastructure/prisma/catalog-prisma-events.ts`
- `backend/src/dev-runtime/catalog-runtime-repository.ts`
- `backend/src/dev-runtime/routes/catalog.routes.ts`
- `tests/slices/catalog/catalog.unit.spec.ts`
- `frontend/src/tests/slices/catalog/catalog-page.storefront-events.spec.tsx`
- `frontend/src/tests/slices/catalog/catalog-route.storefront.spec.tsx`
- `.tasks/TASK-TSC-REPAIR/TASK-TSC-REPAIR-wave1-catalog-report.md`

## Implementation notes

- Split caller-level provisioning input from repository persistence input: external/admin provisioning no longer supplies public paths, while repository-level provisioning still receives generated immutable `primaryPublicPath` and `secondaryPublicPath`.
- Preserved persisted shop public path requirement; `SellerCatalogShop` still requires both public paths.
- Kept direct runtime `createShop` safe by generating public paths when bounded tests/tooling omit them.
- Reworked in-memory showcase favorite mapping without an invalid nullable type predicate.
- Normalized public product optional Prisma fields to contract `null` values.
- Kept Prisma event date mappers compatible with existing test doubles while still selecting dates on the real write path.
- Updated catalog fixtures and frontend storefront fixtures to current public-path/access/debug-log shapes.

## Checks run

- PASS: `npx tsc --noEmit -p tsconfig.jest.json`
- PASS: `npm run test:catalog:unit -- --runInBand`
- PASS: `npm run test:catalog:integration -- --runInBand`
- PASS: `npm run test:catalog:runtime -- --runInBand`
- FAIL with non-catalog failures only: `npm run test:catalog -- --runInBand`
  - Catalog suites passed on the final run.
  - Remaining failures were outside Wave 1 scope:
    - `tests/slices/checkout-payment/checkout-payment.runtime-test-session.spec.ts`: expects array `rejectedFields`, runtime returns comma-separated string.
    - `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts`: checkout helper receives `503` instead of expected `200`.
- PASS: `git diff --check`

## Diagnostics remaining in scope

None known. Current `npx tsc --noEmit -p tsconfig.jest.json` is green.

## Code/test/spec drift discovered

- Stale catalog tests modeled persisted shops without immutable public paths. Updated tests to match `REQ-029` and catalog provisioning/public-path contracts.
- Stale frontend catalog tests imported `CatalogStorefrontData` from the route module and omitted current storefront access/debug fields. Updated tests to consume the current model export and shape.
- `npm run test:catalog` is broader than catalog and runs unrelated checkout/delivery/staging suites through root Jest config; final failure is not catalog-owned.

## Blockers/risks

- No catalog blocker remains.
- Working tree contains concurrent out-of-scope Wave 2/Wave 3 edits in delivery/runtime/checkout/shared test files. They were not modified by this wave and were left intact.

## Recommendation

- Wave 1 can be accepted.
- Continue Wave 2/Wave 3 owners on the remaining non-catalog Jest failures and any out-of-scope runtime behavior checks.
