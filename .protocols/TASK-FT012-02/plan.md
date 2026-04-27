---
description: Execution plan for TASK-FT012-02.
status: active
---
# TASK-FT012-02 Plan

## Scope
- Add slice-local cart/composition state and a mapper that emits the normative customer-order composition payload.
- Add focused tests for add item, duplicate merge, quantity update, remove item, empty cart state and payload mapping.

## Steps
1. Inspect existing `frontend/src/slices/catalog` and catalog test layout.
2. Add minimal `catalog`-local composition state/reducer and mapper using public storefront product data.
3. Add focused frontend tests under catalog tests.
4. Run focused test gate and any cheap type/lint gate that is practical for the touched files.
5. Update Memory Bank backlog/changelog/index and task reports.

## Fallback Basis
- Richer inputs are present in the backlog and implementation plan, so no classic fallback is needed beyond `FT-012` + requirements + contracts.

## Non-Goals
- No UI wiring for storefront buttons beyond what is needed by tests.
- No explicit cross-shop replace/clear UX; that belongs to `TASK-FT012-04` unless reducer boundaries require a blocked reason.
- No checkout navigation or payment/order side effects.
