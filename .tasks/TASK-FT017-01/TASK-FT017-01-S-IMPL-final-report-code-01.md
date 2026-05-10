---
description: Final implementation report for TASK-FT017-01 guarded mock provider config/boundary.
status: active
---
# TASK-FT017-01 Final Report

## Scope

- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Touched layers: backend dev-runtime/config, checkout-payment runtime boundary tests, minimal Memory Bank evidence.
- Shared extraction: not justified and not added.

## Implementation Summary

- Added a dev-runtime payment provider resolver that disables checkout payment provider by default.
- Explicit server-side `PAYMENT_PROVIDER=mock` now maps to provider name `mock` only when `NODE_ENV !== "production"`.
- Production-like `NODE_ENV=production` rejects `PAYMENT_PROVIDER=mock` during runtime startup, before any trusted payment confirmation can be built.
- Mounted checkout runtime now refuses checkout with controlled `PAYMENT_PROVIDER_UNAVAILABLE` and `orderCreated=false` when no provider is configured.
- `DEBUG=true` / `isDebugEnabled=true` does not enable the payment provider and cannot create a trusted paid order by itself.
- The old `local-runtime-provider` runtime identity was replaced with explicit `mock` provider identity and `mock-runtime-checkout-*` transaction ids.

## Changed Files

- `backend/src/dev-runtime/payment-provider-runtime.ts`
- `backend/src/dev-runtime/dev-api-server.types.ts`
- `backend/src/dev-runtime/modules/dev-api-runtime.ts`
- `backend/src/dev-runtime/routes/mini-app.routes.ts`
- `backend/src/dev-runtime/utils/payment-transaction-id.ts`
- `scripts/dev-api.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime.spec.ts`
- `.protocols/TASK-FT017-01/context.md`
- `.protocols/TASK-FT017-01/plan.md`
- `.protocols/TASK-FT017-01/progress.md`
- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/index.md`

## Checks

- `npx jest --config jest.config.cjs tests/slices/checkout-payment/checkout-payment.runtime.spec.ts --runInBand` - PASS.
- `npx jest --config jest.config.cjs tests/slices/checkout-payment --runInBand` - PASS.
- `git diff --check` - PASS.

## Out Of Scope Preserved

- No checkout UI affordance.
- No catalog/cart behavior changes.
- No shared payment abstraction.
- No delivery lifecycle changes.
- No task closure or verifier status update.

## Worktree Note

- The worktree already contained unrelated/preceding Memory Bank, protocol and AGENTS edits before this implementation. They were not reverted.
