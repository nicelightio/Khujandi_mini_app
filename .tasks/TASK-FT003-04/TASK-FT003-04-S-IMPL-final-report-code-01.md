---
description: Implementation report for TASK-FT003-04 first-run overlay gating and authenticated language sync.
status: active
---
# TASK-FT003-04 Implementation Report

## Summary
- Tightened the app-level localization boundary so first-run language selection fully gates customer-facing routes until an explicit choice is available.
- Added a narrow post-auth language sync path through `checkout-payment` so the backend user profile now records the explicit client language choice over the Telegram hint.

## Touched code
- `frontend/src/app/language-context.tsx`
- `frontend/src/app/localization-boundary.tsx`
- `frontend/src/slices/checkout-payment/api/checkout-payment-api.ts`
- `frontend/src/slices/checkout-payment/hooks/use-checkout-payment-view-model.ts`
- `frontend/src/slices/checkout-payment/routes/checkout-payment-route.tsx`
- `backend/src/slices/checkout-payment/domain/checkout-payment.types.ts`
- `backend/src/slices/checkout-payment/application/checkout-payment.service.ts`
- `backend/src/slices/checkout-payment/infrastructure/prisma-checkout-payment.repository.ts`
- `backend/src/slices/checkout-payment/presentation/checkout-payment.controller.ts`
- `frontend/src/tests/app/localization-boundary.spec.tsx`
- `frontend/src/tests/slices/checkout-payment/checkout-payment-api.spec.ts`
- `frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- `tests/slices/checkout-payment/checkout-payment.unit.spec.ts`
- `tests/slices/checkout-payment/checkout-payment.integration.spec.ts`

## Verification
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/app/localization-boundary.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-api.spec.ts frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- Passed: `npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.unit.spec.ts tests/slices/checkout-payment/checkout-payment.integration.spec.ts`
- Passed: `npx jest --config jest.config.cjs frontend/src/tests/app frontend/src/tests/slices/checkout-payment tests/slices/checkout-payment`

## Notes
- The new app-level language context only exposes already-owned localization state; it does not introduce direct component access to storage or Telegram runtime APIs.
- Backend language sync remains intentionally narrow inside `checkout-payment`, matching the current auth/session contour without creating a separate profile slice.
