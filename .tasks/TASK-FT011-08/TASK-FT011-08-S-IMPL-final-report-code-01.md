# TASK-FT011-08 Implementation Report

## Scope
- Close the `TASK-FT011-07` follow-up by reconciling seller rename flows with the durable `Shop(sellerId, name)` identity invariant.

## Delivered
- Mapped seller rename-time uniqueness violations in `CatalogService.updateSellerShop(...)` to a controlled `SHOP_RENAME_CONFLICT` business error with HTTP `409` semantics.
- Aligned the repo-local in-memory/runtime helpers with the same rename-time uniqueness rule so mounted seller runtime behavior matches the canonical persistence boundary instead of silently allowing duplicate owned shop names.
- Added focused unit, integration, and mounted runtime regressions that prove seller rename collisions no longer leak raw persistence failures and do not mutate either shop name on conflict.

## Verification
- `npm run test:catalog:unit -- --runInBand --testNamePattern "rename uniqueness conflicts|marks repeated rename as manual paid review" tests/slices/catalog/catalog.unit.spec.ts`
- `npm run test:catalog:integration -- --runInBand --testNamePattern "durable rename uniqueness conflicts|allows seller to rename only own shop" tests/slices/catalog/catalog.integration.spec.ts`
- `npm run test:catalog:integration -- --runInBand --testNamePattern "seller rename collides with another owned shop" tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npx eslint "backend/src/slices/catalog/application/catalog.service.ts" "backend/src/dev-runtime/dev-api-server.ts" "tests/slices/catalog/catalog.unit.spec.ts" "tests/slices/catalog/catalog.integration.spec.ts" "tests/slices/catalog/catalog.runtime.integration.spec.ts"`
- `npm run test:catalog`
- `npm run lint`

## Outcome
- `PASS`: seller rename collisions now fail through a controlled contract across the checked-in catalog service and mounted runtime, preserving the durable provisioning uniqueness fix without leaving `FT-010` rename flows with opaque failures.
