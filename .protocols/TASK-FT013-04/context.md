---
description: Execution context for TASK-FT013-04 mounted Mini App checkout auth/payment runtime.
status: active
---
# TASK-FT013-04 Context

## Loaded sources
- `AGENTS.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-013.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/runbooks/telegram-mini-app-verification.md`

## Richer inputs found
- Backlog task card includes `Normative Inputs`, `Constraints`, touched files, tests and verify target.
- `IMPL-FT-013.md` includes ownership, boundaries, steps and quality gates.
- `FT-013` and `FT-002` feature docs define current implementation drift and mounted-runtime closure target.

## Boundary check
- Owning capability slice: `checkout-payment`.
- Owning contour: `mini-app` customer-facing runtime.
- Touched layers: presentation/runtime HTTP mounting and application integration around existing auth/payment boundary.
- Shared justification: no new `shared` business extraction is justified; only existing technical auth/session/runtime primitives and explicit contracts may be consumed.
- Cross-slice boundary: `catalog` remains composition producer and read/revalidation source; `checkout-payment` consumes/revalidates/pays.

## Task intent
Mount the real Mini App auth/payment checkout path so customer-facing runtime uses the existing `FT-002` auth/session/payment boundary instead of stub APIs, route-local session side channels or `initDataUnsafe` trust.
