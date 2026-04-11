---
description: Handoff notes for TASK-FT010-18.
status: active
---
# TASK-FT010-18 Handoff

- Shared storefront seller mode on `/shops/:shopId` now loads canonical owner-visible `menuPages/products` from the protected seller shop runtime boundary instead of reconstructing content from public browse plus synthetic placeholders.
- Seller submits now go through real checked-in backend endpoints in `dev-runtime` (`PUT /api/v1/seller/shops/:shopId`, `POST/PUT /api/v1/seller/menu-pages*`, `POST/PUT /api/v1/seller/products*`) and the route reloads canonical data after success.
- Focused frontend and runtime regressions cover canonical owner-visible `NOT_WORKING` data, protected seller write behavior, and shared-tree route continuity.
