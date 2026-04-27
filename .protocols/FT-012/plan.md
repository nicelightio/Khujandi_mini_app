# FT-012 Protocol Plan

## Scope

- Feature: `FT-012` customer product selection and cart/order composition.
- Owning slice: `catalog`.
- Contour: `mini-app`.
- Touched layers: frontend presentation/application around existing public storefront reads; optional thin contract tests for the handoff payload shape.
- Shared justification: no new shared business logic; only the existing boundary contract is shared between `catalog` producer and `checkout-payment` consumer.

## Inputs Read

- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/requirements.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/frontend-presentation-and-webview.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Decomposition Outcome

- Implementation plan: `.memory-bank/tasks/plans/IMPL-FT-012.md`.
- Backlog cards: `TASK-FT012-01` through `TASK-FT012-06` in `.memory-bank/tasks/backlog.md`.
- First executable task: `TASK-FT012-01`.

## Notes

- `FT-012` must not create orders, start payment, reserve stock, or publish lifecycle events.
- `FT-013` remains the owner of server-side checkout revalidation and paid order creation.
- `FT-012` closure requires proving the customer can compose a non-empty single-shop draft and reach checkout only with a valid composition payload.
