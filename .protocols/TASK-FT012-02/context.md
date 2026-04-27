---
description: Execution context for TASK-FT012-02.
status: active
---
# TASK-FT012-02 Context

## Loaded Sources
- `AGENTS.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/tasks/plans/IMPL-FT-012.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/architecture/frontend-presentation-and-webview.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/glossary.md`
- `.memory-bank/invariants.md`

## Richer Inputs
- Source Artifacts: `FT-012`, `customer-order-composition-contract.md`.
- Normative Inputs: `customer-order-composition-contract.md`, `catalog-public-api.md`.
- Constraints: no backend order/payment writes; no shared cart domain module.
- Verification target: local catalog composition state, public storefront data, public shop path plus internal product IDs in payload, no technical `shop.id` as customer-facing route identity.

## Boundary Check
- Owning capability slice: `catalog`.
- Owning contour: `mini-app`.
- Touched layers: frontend `presentation` and slice-local `application/read-composition state`.
- Shared extraction: not justified. Cart/order composition is customer workflow state around catalog data; the cross-slice boundary is the contract payload only.
- Cross-slice rule: `checkout-payment` remains downstream consumer for revalidation/payment/order creation; this task only maps the draft shape.

## Drift Watch
- Do not create orders, reserve stock, start payment, emit lifecycle events or move cart business logic into `shared`.
- Technical `shop.id` may exist only as internal payload data, never as public route identity.
