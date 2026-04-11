---
description: Verification record for TASK-FT010-07.
status: active
---
# TASK-FT010-07 Verification

## Basis
- Task verification target from `.memory-bank/tasks/backlog.md`: admin can create/bind a shop from the admin contour, seller can toggle status only for owned shops in `/seller/*`, and store-admin remains a narrow surface without stats/reporting.
- Feature acceptance from `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`: admin provisioning creates skeleton shops, seller access reuses Telegram-linked identity/session, and `WORKING/NOT_WORKING` visibility stays explicit.
- Testing anti-cheat from `.memory-bank/testing/index.md`: keep explicit seller/admin UI coverage and preserve delete-free/narrow seller-web baseline.

## Checks

### 1. Admin provisioning UI uses the mounted protected provisioning path
- Method: reran focused admin route suites with route-level form submit coverage.
- Commands:
  - `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-router.spec.tsx frontend/src/tests/admin/admin-catalog-provisioning-route.spec.tsx`
- Evidence:
  - `admin-catalog-provisioning-route.spec.tsx` proves form submit payload, success feedback, and controlled API error handling.
  - `admin-router.spec.tsx` proves the provisioning route stays behind the shared admin auth boundary.
- Result: PASS

### 2. Seller-web status toggle reuses owned-shop runtime access and handles protected states explicitly
- Method: reran focused seller route suites and added backend runtime coverage for the mounted seller write path.
- Commands:
  - `npx jest --config jest.config.cjs frontend/src/tests/seller/seller-router.spec.tsx frontend/src/tests/seller/seller-shop-status-route.spec.tsx`
  - `npx jest --config jest.config.cjs tests/slices/catalog/catalog.unit.spec.ts tests/slices/catalog/catalog.integration.spec.ts tests/slices/catalog/catalog.runtime.integration.spec.ts`
- Evidence:
  - `seller-shop-status-route.spec.tsx` covers owned-shop load, successful toggle submit, `401 AUTH_REQUIRED`, and provision-missing `403 FORBIDDEN` outcomes.
  - `catalog.runtime.integration.spec.ts` now proves an owning seller can toggle a mounted runtime shop to `NOT_WORKING`, public browse hides it, and owner-only seller reads still see the shop.
- Result: PASS

### 3. Task scope remains build-safe and regression-safe across catalog/admin/seller surfaces
- Method: reran repo-local catalog suite, targeted lint, and production frontend build.
- Commands:
  - `npx eslint "frontend/src/admin/api/admin-catalog-provisioning-api.ts" "frontend/src/admin/components/admin-catalog-provisioning-page.tsx" "frontend/src/admin/routes/admin-catalog-provisioning-route.tsx" "frontend/src/seller/api/seller-shop-status-api.ts" "frontend/src/seller/components/seller-shop-status-page.tsx" "frontend/src/seller/routes/seller-shop-status-route.tsx" "frontend/src/tests/admin/admin-router.spec.tsx" "frontend/src/tests/admin/admin-catalog-provisioning-route.spec.tsx" "frontend/src/tests/seller/seller-router.spec.tsx" "frontend/src/tests/seller/seller-shop-status-route.spec.tsx"`
  - `npx eslint "backend/src/slices/catalog/domain/catalog.types.ts" "backend/src/slices/catalog/application/catalog.service.ts" "backend/src/shared/db/prisma-client.ts" "backend/src/slices/catalog/infrastructure/prisma-catalog.repository.ts" "backend/src/dev-runtime/dev-api-server.ts" "tests/slices/catalog/catalog.unit.spec.ts" "tests/slices/catalog/catalog.integration.spec.ts" "tests/slices/catalog/catalog.runtime.integration.spec.ts"`
  - `npm run test:catalog`
  - `npm run build:frontend`
- Evidence: all commands completed successfully.
- Result: PASS

## Scoped notes
- This verify pass closes the wiring scope for `TASK-FT010-07` only. Final `FT-010` RTM closure and broader acceptance sync remain with `TASK-FT010-08`.
- `seller-web` remains a narrow store-admin surface: the shipped UI exposes owned-shop status control only and does not add stats/reporting or delete actions.

## Verdict
- VERDICT: PASS
