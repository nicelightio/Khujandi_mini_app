---
description: Verification notes for TASK-FT013-03.
status: active
---
# TASK-FT013-03 Verification

## Gates
- PASS: `npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.unit.spec.ts tests/slices/checkout-payment/checkout-payment.integration.spec.ts`
- PASS: `npm run lint`

## Evidence
- Verified implementation surface: `backend/src/slices/checkout-payment/application/checkout-payment.service.ts` calls `assertCompositionIsCurrent()` before `createPaidOrderIdempotently()` when the explicit `CheckoutPaymentCatalogCompositionReader` boundary is provided.
- Verified contract shape: `backend/src/slices/checkout-payment/domain/checkout-payment.types.ts` defines the composition draft and catalog snapshot reader without moving cart/catalog logic into `shared`.
- Verified tests: `tests/slices/checkout-payment/checkout-payment.unit.spec.ts` covers valid composition, missing composition, hidden/`NOT_WORKING` shop, missing product, unavailable product, invalid quantity, price drift and currency drift.
- Verified stale/invalid outcomes: stale composition cases return controlled `COMPOSITION_REPAIR_REQUIRED` with `repairAction: repair_composition` and `orderCreated: false` before order persistence.
- Evidence artifact: `.tasks/TASK-FT013-03/TASK-FT013-03-S-VERIFY-final-report-docs-01.md`.

## AC Mapping
- `REQ-032` scoped check: server-side catalog revalidation seam exists before checkout order persistence for the revalidated-composition path.
- `REQ-005` scoped check: valid composition proceeds only through existing trusted paid checkout service path; this task does not close mounted paid order creation.
- `REQ-006` scoped check: stale/invalid composition returns repair response and does not call order persistence.
- Task invariant: preview totals and display snapshots are compared against current catalog facts and are not treated as authoritative order/payment facts.

## Residual Scope
- Mounted Mini App auth/payment runtime remains with `TASK-FT013-04`.
- Paid `CREATED` order persistence from revalidated composition remains with `TASK-FT013-05`.
- Retry/idempotency hardening remains with `TASK-FT013-06`.

## Verdict
- PASS for scoped repo-local backend revalidation seam.
