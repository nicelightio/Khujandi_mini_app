---
description: Verification report for TASK-FT010-07.
status: active
---
# TASK-FT010-07 Verify Report

## Basis
- Backlog verify target: admin can provision/bind a shop from `admin-web`, seller can toggle status only for an owned shop in `/seller/*`, and `seller-web` stays a narrow store-admin surface.
- FT-010 acceptance subset: admin-provisioned skeleton shop, Telegram-linked seller access reuse, explicit `WORKING/NOT_WORKING` visibility, and no reporting/stats expansion in baseline `seller-web`.

## Evidence
- `.protocols/TASK-FT010-07/verification.md`
- `.tasks/TASK-FT010-07/TASK-FT010-07-S-IMPL-final-report-code-01.md`
- `frontend/src/tests/admin/admin-catalog-provisioning-route.spec.tsx`
- `frontend/src/tests/admin/admin-router.spec.tsx`
- `frontend/src/tests/seller/seller-shop-status-route.spec.tsx`
- `frontend/src/tests/seller/seller-router.spec.tsx`
- `tests/slices/catalog/catalog.runtime.integration.spec.ts`

## Commands
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-router.spec.tsx frontend/src/tests/admin/admin-catalog-provisioning-route.spec.tsx`
- `npx jest --config jest.config.cjs frontend/src/tests/seller/seller-router.spec.tsx frontend/src/tests/seller/seller-shop-status-route.spec.tsx`
- `npx jest --config jest.config.cjs tests/slices/catalog/catalog.unit.spec.ts tests/slices/catalog/catalog.integration.spec.ts tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npm run test:catalog`
- `npm run build:frontend`

## Verdict
- VERDICT: PASS
