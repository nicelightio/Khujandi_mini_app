---
description: Feature C4 L3 для guarded repo-local/e2e mock payment mode в checkout-payment.
status: active
---
# FT-017 Guarded E2E Mock Payment Mode

## REQs

- `REQ-005`, `REQ-021`, `REQ-023`, `REQ-032`

## Ownership

- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Future implementation layers: backend runtime/config plus application/infrastructure payment finalization seam; frontend checkout presentation only for visible debug/e2e affordance.
- Shared extraction is not justified: this is a guarded payment-provider variant inside `checkout-payment`, not a shared payment business abstraction.

## Current Implementation State

- `TASK-FT017-01` verified `PASS` for the backend runtime/config guard baseline: repo-local checkout payment provider is disabled by default, explicit server-side `PAYMENT_PROVIDER=mock` selects the mock provider only behind a non-production guard, production-like startup rejects mock, and `DEBUG=true` alone returns controlled no-order checkout refusal.
- `TASK-FT017-02` verified `PASS`: mounted checkout mock `success/paid` requires valid Mini App session and valid `FT-012` composition, runs through server-side revalidation and the existing checkout payment finalization seam, creates exactly one paid `CREATED` order, and preserves no-order forbidden cases plus duplicate-submit idempotency.
- `TASK-FT017-03` verified `PASS`: checkout runtime exposes non-sensitive `mockPaymentAvailable` bootstrap metadata, and the checkout page shows a small e2e/mock note only in ready checkout context when that backend availability is true. The existing submit button remains backend-driven; `DEBUG=true` / `__APP_DEBUG__` alone does not make the UI claim mock mode is active.
- `TASK-FT017-04` verified `PASS` for final repo-local closure: backend checkout-payment suite, frontend checkout-payment suite, frontend build, lint and `git diff --check` passed. `FT-017` is closed for scoped repo-local guarded mock `success/paid`; mock failed/timeout/pending and real production provider design remain out of scope.

## Verification Closure

- Closure artifact: [.tasks/TASK-FT017-04/TASK-FT017-04-S-VERIFY-final-report-docs-01.md](../../.tasks/TASK-FT017-04/TASK-FT017-04-S-VERIFY-final-report-docs-01.md).
- Required final gates passed: backend checkout-payment Jest, frontend checkout-payment Jest, `npm run build:frontend`, `npm run lint`, and `git diff --check`.
- RTM impact: `REQ-023` row for `FT-017` is `verified` for repo-local guarded mock payment mode evidence.

## Execution Boundary

- The current hard-coded repo-local local-runtime-provider is treated as old implicit mock behavior and must be replaced or gated by explicit provider selection.
- Canonical provider selection is server-side `PAYMENT_PROVIDER=mock`.
- The backend must also enforce an explicit runtime/test guard. Guard baseline: `NODE_ENV=production` is an absolute refusal, and mock provider selection also requires `APP_ENV=staging|test|local` or `E2E_TEST_MODE=TRUE`.
- Production runtime must reject/refuse `PAYMENT_PROVIDER=mock`; either fail startup or refuse checkout requests with a controlled error before payment confirmation is trusted.
- `DEBUG=true` / `__APP_DEBUG__` may expose visible checkout-only e2e affordance, but must not be the backend trust gate.
- The first baseline supports only mock `success/paid`; failed, timeout and pending outcomes are follow-up scope.
- The mock success path must still require valid `FT-012` composition, server-side `FT-013` catalog revalidation and valid Mini App auth/session from `FT-002`.

## Acceptance Criteria

- Backend config exposes an explicit payment provider boundary where `PAYMENT_PROVIDER=mock` is the only way to select the mock provider.
- `PAYMENT_PROVIDER=mock` is accepted only when the explicit runtime/test guard passes; production rejects/refuses mock usage.
- Mock `success/paid` produces a provider-trusted confirmation only after the same payment finalization seam used by the checkout runtime.
- Mock success creates at most one paid `CREATED` order from a server-revalidated composition and valid Mini App session.
- Duplicate mock submit/confirmation reuses or preserves the same paid order and does not create a second order.
- Checkout UI may show a visible e2e/debug affordance only when the backend mock provider mode is available and only inside the checkout route after valid handoff context.
- The feature does not add failed/timeout/pending mock outcomes in the first baseline.

## Forbidden Cases

- No order from frontend-only `DEBUG=true`, `__APP_DEBUG__`, manually toggled UI state, `invoiceClosed`, or other client-only payment event.
- No order from direct `/checkout` without a valid composition.
- No order from stale/invalid composition or missing/invalid Mini App auth/session.
- No production runtime use of mock payment provider.
- No catalog/cart ownership of payment affordance or trust decision.
- No shared payment abstraction introduced only to host this mode.
- No failed/timeout/pending mock outcome in the first baseline unless a later task explicitly scopes it in.

## Normative Inputs

- [.memory-bank/features/FT-002-checkout-payment-and-order-creation.md](FT-002-checkout-payment-and-order-creation.md): auth/payment/order creation ownership and trusted payment boundary.
- [.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md](FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md): mounted customer checkout flow and composition revalidation.
- [.memory-bank/contracts/payment-confirmation-contract.md](../contracts/payment-confirmation-contract.md): trusted payment confirmation, anti-replay and mock provider guardrails.
- [.memory-bank/runbooks/e2e-mock-payment.md](../runbooks/e2e-mock-payment.md): repo-local/e2e mock payment gates and verification targets.
- [.memory-bank/testing/index.md](../testing/index.md): checkout-payment verification and anti-cheat baseline.
- [.memory-bank/epics/EP-001-customer-ordering-experience.md](../epics/EP-001-customer-ordering-experience.md): customer ordering epic boundary.
- [doc/ARCHITECTURE.md](../../doc/ARCHITECTURE.md): canonical slice/layer/contour rules and shared-boundary policy.

## Verification Targets

- Config/runtime: `PAYMENT_PROVIDER=mock` selects mock only with explicit `APP_ENV=staging|test|local` or `E2E_TEST_MODE=TRUE` guard and never in production.
- Negative config: production-like runtime rejects/refuses `PAYMENT_PROVIDER=mock`.
- Happy e2e: valid composition -> checkout -> mock `success/paid` -> exactly one paid `CREATED` order -> customer-safe cursor/revision.
- Negative trust: `DEBUG=true` without `PAYMENT_PROVIDER=mock` does not create trusted payment confirmation.
- Negative checkout boundary: direct checkout, stale composition and missing auth/session stay no-order.
- Idempotency: duplicate submit/confirmation does not create a second order.

## Out Of Scope

- Real payment provider integration changes.
- Mock failed, timeout and pending outcomes.
- Catalog/cart behavior changes.
- Delivery assignment/tracking lifecycle changes.
- Shared payment/provider abstraction.
