# TASK-FT010-21 Final Report

## Summary
- Replaced the shared storefront route's synthetic fallback so `/shops/:shopId` now resolves only from canonical seller data or real public shop data.
- Missing storefronts now return an explicit controlled not-found state, failing loads return a controlled error state, and valid public storefront browse still works even when seller access fails.

## Files
- `frontend/src/slices/catalog/routes/catalog-route.tsx`
- `frontend/src/tests/slices/catalog/catalog-route.spec.tsx`
- `.protocols/TASK-FT010-21/*`

## Verification
- `npx jest --config jest.config.cjs --runInBand frontend/src/tests/slices/catalog/catalog-route.spec.tsx`
- `npx jest --config jest.config.cjs --runInBand frontend/src/tests/slices/catalog/catalog-page.spec.tsx`
- `npm run lint`
- `npm run build:frontend`
