---
description: Red-verification report for TASK-FT010-07.
status: active
---
# TASK-FT010-07 Red Verify Report

## Verdict
- `semantic-concern`

## Core concern
- Narrow `seller-web` status toggle currently submits the full cached shop snapshot through the broad seller shop update path, so a status change can silently overwrite stale shared-storefront metadata.

## Evidence pointers
- `frontend/src/seller/routes/seller-shop-status-route.tsx`
- `frontend/src/seller/api/seller-shop-status-api.ts`
- `backend/src/slices/catalog/application/catalog.service.ts`
- `.protocols/TASK-FT010-07/red-verification.md`

## Follow-up
- Added `TASK-FT010-20` to isolate seller-web status changes from broader storefront metadata writes.
