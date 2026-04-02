---
description: Implementation report for TASK-FT003-05 localized copy rollout in customer-facing routes.
status: active
---
# TASK-FT003-05 Implementation Report

## Summary
- Added a small shared localization dictionary and reused the existing app language context so the first-run overlay, catalog, and checkout render baseline copy in the selected language.
- Kept the change inside frontend shared/app/catalog/checkout boundaries without introducing new storage access, Telegram runtime access, or `FT-009` shell work.

## Touched code
- `frontend/src/shared/i18n/copy.ts`
- `frontend/src/app/localization-boundary.tsx`
- `frontend/src/slices/catalog/model/catalog-view-model.ts`
- `frontend/src/slices/catalog/hooks/use-catalog-view-model.ts`
- `frontend/src/slices/catalog/routes/catalog-route.tsx`
- `frontend/src/slices/catalog/components/catalog-page.tsx`
- `frontend/src/slices/checkout-payment/api/checkout-payment-api.ts`
- `frontend/src/slices/checkout-payment/model/checkout-payment-view-model.ts`
- `frontend/src/slices/checkout-payment/hooks/use-checkout-payment-view-model.ts`
- `frontend/src/slices/checkout-payment/components/checkout-payment-page.tsx`
- `frontend/src/tests/app/localization-boundary.spec.tsx`
- `frontend/src/tests/slices/catalog/*.spec.ts[x]`
- `frontend/src/tests/slices/checkout-payment/*.spec.ts[x]`

## Verification
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/app/localization-boundary.spec.tsx frontend/src/tests/slices/catalog frontend/src/tests/slices/checkout-payment`
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/app frontend/src/tests/slices/catalog frontend/src/tests/slices/checkout-payment`
- Passed: `npx tsc --noEmit -p tsconfig.jest.json`

## Notes
- Default baseline remains `ru` per spec, while route/page smoke now explicitly verifies localized rendering for `ru`, `en`, and `tj`.
- Domain data remains unchanged; this task localizes only the baseline customer-facing UI copy owned by the frontend.
