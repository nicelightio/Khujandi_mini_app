---
description: Execution context for TASK-FT013-03 server-side composition revalidation.
status: active
---
# TASK-FT013-03 Context

## Loaded Sources
- `AGENTS.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` task card lines for `TASK-FT013-03`
- `.memory-bank/tasks/plans/IMPL-FT-013.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/contracts/payment-confirmation-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/testing/index.md`

## Richer Inputs
- Found task-card fields: touched files, tests, verify target, docs, invariant.
- Found IMPL-plan fields: source artifacts, normative inputs, ownership/boundaries, steps, tests, quality gates, verification targets.
- No separate richer task file existed for this task; fallback is feature + implementation plan + contract layer.

## Boundary Check
- Owning capability slice: `checkout-payment`.
- Contour: `mini-app` customer checkout flow.
- Touched layers: backend application/domain-adjacent validation inside `checkout-payment`; catalog access only through explicit read/revalidation boundary if required.
- Shared extraction: not justified. The only cross-slice artifact is the customer order composition contract; revalidation orchestration belongs to `checkout-payment`, catalog state remains owned by `catalog`.
- Cross-slice drift guard: do not move catalog ownership, cart business logic, payment trust, or provider confirmation into `shared`.

## Task Scope
- Add server-side composition revalidation before payment/order creation.
- Cover valid composition, hidden/`NOT_WORKING` shop, missing product, unavailable product, invalid quantity, price drift, and currency drift.
- Return controlled repair/reconfirmation responses when customer-visible payment facts changed.
