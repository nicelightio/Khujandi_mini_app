# TASK-FT011-07 Implementation Report

## Scope
- Close the `TASK-FT011-03` red-verify follow-up by moving provisioning conflict handling onto a race-safe persistence boundary for `REQ-028`.

## Delivered
- Added durable `Shop(sellerId, name)` uniqueness in `backend/prisma/schema.prisma` plus a matching Prisma migration.
- Kept the existing service-layer duplicate precheck as an early fast-fail, but made the repository/DB path authoritative for identical provisioning conflicts.
- Aligned `InMemoryCatalogRepository.createShop(...)` with the same uniqueness rule so mounted/runtime behavior stays consistent with the canonical persistence boundary.
- Added hostile integration coverage that forces two identical provisioning requests through concurrent transaction drafts and proves the loser maps to `SHOP_PROVISIONING_CONFLICT` without leaving duplicate starter rows.
- Added mounted runtime coverage proving identical provisioning requests yield one success, one conflict, and exactly one persisted starter bundle.

## Verification
- `npm run test:catalog:integration -- --runInBand tests/slices/catalog/catalog.provisioning.integration.spec.ts`
- `npm run test:catalog:integration -- --runInBand --testNamePattern "keeps identical mounted provisioning requests fail-closed with one durable starter bundle" tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npx eslint "backend/src/dev-runtime/dev-api-server.ts" "tests/slices/catalog/catalog.provisioning.integration.spec.ts" "tests/slices/catalog/catalog.runtime.integration.spec.ts"`
- `npm run test:catalog`

## Outcome
- `PASS`: duplicate/conflicting provisioning is now enforced at the persistence boundary rather than only by a race-prone service precheck, and hostile repeated/concurrent evidence leaves exactly one starter bundle.
