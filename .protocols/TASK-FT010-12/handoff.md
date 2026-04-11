---
description: Handoff по TASK-FT010-12.
---
# TASK-FT010-12 Handoff

## Summary
- Completed.

## Expected outcome
- Repo-local Mini App auth/runtime mounting now uses the shared `checkout-payment` cookie transport boundary directly, with no local token side channel left in `dev-runtime`.

## Verification
- `npx jest --config jest.config.cjs --runInBand tests/slices/checkout-payment/checkout-payment.unit.spec.ts tests/slices/checkout-payment/checkout-payment.integration.spec.ts tests/slices/catalog/catalog.runtime.integration.spec.ts`
- `npm run lint`
