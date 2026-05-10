---
description: Implementation plan for FT-017 guarded e2e mock payment mode.
status: active
---
# IMPL-FT-017 Guarded E2E Mock Payment Mode

## Goals

- Replace or gate the old implicit repo-local local-runtime-provider with explicit `PAYMENT_PROVIDER=mock` provider selection.
- Enforce a non-production guard with baseline `NODE_ENV !== "production"`.
- Refuse mock provider usage in production before any paid confirmation is trusted.
- Support first-baseline mock `success/paid` only.
- Keep the checkout flow on the existing `FT-013` mounted runtime: valid composition, server-side revalidation, Mini App auth/session and idempotent paid order creation.
- Add only a checkout-local visible debug/e2e affordance after the backend guard exists.

## Source Artifacts

- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/requirements.md`
- `doc/ARCHITECTURE.md`

## Normative Inputs

- `PAYMENT_PROVIDER=mock` is the canonical server-side provider selector.
- `NODE_ENV !== "production"` is the baseline non-production guard.
- `DEBUG=true` / `__APP_DEBUG__` controls presentation affordance only and is not a trust gate.
- First baseline supports only `success/paid`; failed, timeout and pending are follow-up.
- Mock success must still pass through composition revalidation, valid Mini App auth/session and payment idempotency.

## Ownership And Boundaries

- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Touched layers: backend runtime/config and application/infrastructure payment finalization seam; frontend checkout presentation only for the visible affordance.
- `catalog` remains the composition producer and must not own payment controls.
- No shared extraction: this mode is not a general provider framework.

## Steps

1. Add explicit backend provider config/boundary for `PAYMENT_PROVIDER=mock` and production refusal.
2. Mount mock `success/paid` through the existing checkout payment finalization seam for composition-backed checkout.
3. Add checkout-only visible debug/e2e affordance that depends on backend mock availability and never becomes a trust source.
4. Run repo-local e2e verification and sync Memory Bank evidence.

## Expected Touched Files

- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/tasks/plans/IMPL-FT-017.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/index.md`
- `backend/src/slices/checkout-payment/**/*`
- `backend/src/dev-runtime/**/*`
- `tests/slices/checkout-payment/**/*`
- `frontend/src/slices/checkout-payment/**/*`
- `frontend/src/tests/slices/checkout-payment/**/*`

## Tests

- Backend/config: `PAYMENT_PROVIDER=mock` is accepted only outside production.
- Backend/config negative: production-like runtime rejects/refuses mock provider usage.
- Runtime/e2e: valid composition plus mock `success/paid` creates exactly one paid `CREATED` order with customer-safe cursor/revision.
- Negative: `DEBUG=true` without `PAYMENT_PROVIDER=mock` cannot produce trusted paid confirmation.
- Negative: direct checkout, stale composition and missing auth/session remain no-order.
- Idempotency: duplicate submit/confirmation does not create a second order.
- Frontend: checkout affordance is visible only for backend-available mock mode and only in checkout context.

## Quality Gates

- Focused `checkout-payment` backend/runtime tests.
- Focused checkout frontend tests for the affordance.
- E2E or mounted runtime smoke for composition-backed mock success.
- `git diff --check`.
- No production mock provider acceptance.

## UAT Steps

1. Start repo-local runtime with `PAYMENT_PROVIDER=mock` and non-production `NODE_ENV`.
2. Select a product from a `WORKING` storefront and enter checkout through a valid composition.
3. Use the checkout e2e affordance to complete mock `success/paid`.
4. Verify exactly one paid `CREATED` order is created and customer-safe tracking metadata is returned.
5. Repeat submit/confirmation and verify idempotency.
6. Start production-like runtime with `PAYMENT_PROVIDER=mock` and verify it rejects/refuses mock mode.

## Verification Targets

- Guarded provider config.
- Mounted checkout mock success integration.
- Checkout-only visible affordance.
- No-order forbidden cases and idempotency.
