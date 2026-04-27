# TASK-FT012-01 Context

## Task
- `TASK-FT012-01`
- Goal: freeze the customer composition execution boundary for `FT-012` before product-code work starts.

## Loaded normative inputs
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `doc/ARCHITECTURE.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-012-customer-product-selection-and-cart-composition.md`
- `.memory-bank/features/FT-013-customer-checkout-handoff-and-paid-order-creation-flow.md`
- `.memory-bank/tasks/plans/IMPL-FT-012.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/customer-order-composition-contract.md`
- `.memory-bank/architecture/frontend-presentation-and-webview.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- Backlog task card includes `Source Artifacts`, `Constraints`, `Verify`, `Tests`, `Docs`, and touched docs.
- `IMPL-FT-012` includes source artifacts, normative inputs, constraints, invariants, steps, quality gates and UAT steps.
- Feature and contract docs already exist for the upstream composition producer and downstream checkout consumer.

## Fallback usage
- No dedicated task-scoped template was present, so this protocol uses the existing minimal manual structure.
- Feature + requirements + EP-001 + contract + testing docs are used as fallback support around the richer backlog card.

## Boundary check
- Owning capability slice: `catalog`.
- Owning contour: `mini-app`.
- Touched layers in this task: spec/contract documentation only; future implementation is limited to `presentation` + `application` composition state around catalog reads.
- `shared` extraction is not justified: cart/order composition is slice-local customer workflow state; only the handoff payload is shared as a documented boundary contract.
- Cross-slice boundary: `catalog` produces the draft, `checkout-payment` consumes it later through `FT-013` and revalidates before payment/order creation.

## Key constraints and invariants
- This task is docs-first only: no product code, no checkout semantics change, no order/payment side effect.
- Composition is single-shop and customer-visible.
- Preview totals are not trusted payment facts.
- Technical `shop.id` may be payload data only; public routing uses `shop_public_path`.
- Any resume/persistence stores only non-sensitive composition state and never session identifiers.
