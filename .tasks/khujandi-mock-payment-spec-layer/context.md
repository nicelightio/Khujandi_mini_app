# Context

## Scope

- Task: spec-layer design for debug/e2e-only mock payment in customer checkout flow.
- Code implementation, tests, commits and pushes are out of scope.
- Memory Bank edits must wait for teamlead decisions.

## Priming

Read core:
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`

Read task-scoped:
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/runbooks/index.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`
- `.memory-bank/runbooks/security-auth-and-secret-response.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/index.md`
- `.memory-bank/features/index.md`

## Initial boundary read

- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Future implementation layers: `presentation` checkout route/UI affordance plus `application`/`infrastructure` payment-provider boundary.
- Shared extraction: not justified. The behavior is a checkout-payment runtime mode, not a shared payment abstraction.
- Upstream boundary: `catalog` produces `FT-012` composition only; it must not own payment affordance.
- Runtime trust invariant: no order without server-side trusted payment confirmation. A mock provider can only be trusted if selected server-side by explicit non-production config and still follows idempotency/no-order-on-failure rules.

## Candidate normative shape before approval

- `FT-002`: payment trust ownership, mock-provider acceptance/forbidden cases.
- `FT-013`: checkout route/UI placement after composition handoff and server-side revalidation.
- `payment-confirmation-contract`: explicit server-side mock provider as a non-production trusted provider variant, separate from client-only payment events.
- `testing/index.md`: future verification targets for e2e mock payment.
- New runbook candidate: `.memory-bank/runbooks/e2e-mock-payment.md`, if approved.

## Drift / open risk

- Current docs require mock/runtime checks for auth/payment, but do not yet define a normative e2e mock payment provider gate.
- `DEBUG=true` exists as a debug runtime concept for catalog diagnostics (`REQ-030`) and should not become the sole server-side trust gate for payment.
