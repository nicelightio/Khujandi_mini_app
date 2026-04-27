---
description: Execution context for TASK-FT012-04 single-shop replace-or-clear behavior.
status: active
---
# TASK-FT012-04 Context

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
- `.memory-bank/tasks/plans/IMPL-FT-012.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/architecture/frontend-presentation-and-webview.md`
- `.memory-bank/testing/index.md`

## Ricer inputs

- Found in backlog/IMPL: Normative Inputs, Constraints, Invariants, Verification Targets.
- No separate task-card file exists; fallback is backlog row plus FT-012 feature, IMPL plan, EP-001, contracts and testing docs.

## Boundary check

- Owning capability slice: `catalog`.
- Owning contour: `mini-app` customer storefront.
- Touched layers: `presentation` and slice-local customer composition state/application helpers.
- Shared justification: no shared extraction. MVP single-shop cart/order composition is catalog-owned customer intent state; cross-slice reuse is limited to `customer-order-composition-contract.md`.
- Cross-slice constraints: no checkout/payment/order creation, no stock reservation, no lifecycle events.

## Task scope

- Enforce explicit replace/clear behavior before adding products from a different shop.
- Keep produced composition payload single-shop only.
- Provide controlled customer feedback for replacement path.
