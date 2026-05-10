---
description: Protocol plan for decomposing FT-017 guarded e2e mock payment mode.
status: active
---
# FT-017 Protocol Plan

## Scope

- Feature: `FT-017` guarded e2e mock payment mode.
- Owning slice: `checkout-payment`.
- Contour: `mini-app`.
- Touched layers for future implementation: backend runtime/config plus application/infrastructure payment finalization seam; frontend checkout presentation only for a visible debug/e2e affordance.
- Shared justification: no shared extraction; this is a slice-local payment provider mode, not a reusable business abstraction.

## Inputs Read

- `AGENTS.md`
- `.memory-bank/commands/prd-to-tasks.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/runbooks/e2e-mock-payment.md`
- `.memory-bank/testing/index.md`

## Decomposition Strategy

- Wave 1 freezes the backend provider-selection boundary and replaces the old implicit repo-local success path with an explicit `PAYMENT_PROVIDER=mock` gate.
- Wave 2 wires the mounted checkout happy path to the guarded mock provider while preserving composition revalidation, Mini App session requirements and payment idempotency.
- Wave 3 adds checkout-only visible debug/e2e affordance after the backend guard exists.
- Wave 4 verifies the repo-local e2e flow and syncs Memory Bank evidence without widening into failed/timeout/pending mock outcomes.

## Gate

- Acceptance criteria from `FT-017` are covered by `TASK-FT017-01` through `TASK-FT017-04` in `.memory-bank/tasks/backlog.md`.
- Execution starts with `TASK-FT017-01`; downstream tasks stay `planned` until dependencies are complete.
- Implementation must not start from frontend-only `DEBUG=true`; server-side provider selection and non-production guard are mandatory prerequisites.
