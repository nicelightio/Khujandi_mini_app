---
description: Execution context for TASK-FT017-01 guarded mock provider config/boundary.
status: active
---
# TASK-FT017-01 Context

## Source Specs Read
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-017-guarded-e2e-mock-payment-mode.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/tasks/plans/IMPL-FT-017.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/tasks/backlog.md` FT-017 section

## Ownership
- Owning slice: `checkout-payment`.
- Owning contour: `mini-app`.
- Task scope: `TASK-FT017-01` guarded mock provider config/boundary.
- Touched layers intended: backend runtime/config and checkout-payment payment confirmation boundary tests.
- Shared justification: no `shared` extraction justified; mock provider mode is a guarded checkout-payment runtime variant, not a reusable business abstraction.

## Constraints
- Replace/gate implicit repo-local local-runtime-provider behind explicit server-side `PAYMENT_PROVIDER=mock`.
- Accept mock provider only when `NODE_ENV !== "production"`.
- Production-like runtime must reject/refuse mock before trusted payment confirmation.
- `DEBUG=true` alone is not a trusted payment gate.
- No checkout UI affordance in this task.
- No failed, timeout or pending mock outcomes.
- No catalog/cart behavior changes.

## Initial Drift/Worktree Note
- Worktree already contains unrelated/preceding Memory Bank and protocol changes for FT-017 spec-layer setup. They are not reverted or overwritten.
