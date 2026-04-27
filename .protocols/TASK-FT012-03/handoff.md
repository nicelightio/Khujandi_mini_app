---
description: Handoff notes for TASK-FT012-03.
status: active
---
# TASK-FT012-03 Handoff

## Summary

- Wired `frontend/src/slices/catalog/components/catalog-page.tsx` and `storefront-menu-sections.tsx` to use the existing slice-local composition model for public customer cart interactions.
- Extended storefront view-model product shape with `priceMinor` so the UI can build display snapshots from canonical public storefront data instead of parsing labels.
- Added storefront cart styling in `catalog-storefront.css` and focused smoke coverage in `catalog-page.spec.tsx`.

## Next Task

- `TASK-FT012-04`: explicit single-shop replace/clear behavior remains the next planned FT-012 step.
