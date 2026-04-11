---
description: Implementation report for TASK-FT010-07 code changes.
status: active
---
# TASK-FT010-07 Implementation Report

## Scope delivered
- Replaced the admin provisioning scaffold with a mounted form that submits to `POST /api/v1/admin/catalog/shops/provision` and renders controlled success/error feedback.
- Replaced the seller-web scaffold with owned-shop loading and `WORKING/NOT_WORKING` submit flow wired to the mounted seller runtime.
- Extended the backend seller shop update path so seller-owned status changes are persisted without consuming rename allowance.

## Changed areas
- `frontend/src/admin/**/*`: added `admin-catalog-provisioning-api`, real form UI, route submit state, and route tests.
- `frontend/src/seller/**/*`: added `seller-shop-status-api`, owned-shop/status UI, route state, and seller route tests.
- `backend/src/slices/catalog/**/*`, `backend/src/dev-runtime/dev-api-server.ts`, `backend/src/shared/db/prisma-client.ts`: accepted `status` in seller shop updates and preserved event/status semantics.
- `tests/slices/catalog/**/*`: added unit/integration/runtime regression coverage for status-only seller updates and mounted owner/public visibility behavior.

## Verification summary
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-router.spec.tsx frontend/src/tests/admin/admin-catalog-provisioning-route.spec.tsx`
- `npx jest --config jest.config.cjs frontend/src/tests/seller/seller-router.spec.tsx frontend/src/tests/seller/seller-shop-status-route.spec.tsx`
- `npx jest --config jest.config.cjs tests/slices/catalog/catalog.unit.spec.ts tests/slices/catalog/catalog.integration.spec.ts tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npx eslint ...` on changed frontend and backend files
- `npm run test:catalog`
- `npm run build:frontend`

All listed commands passed.
