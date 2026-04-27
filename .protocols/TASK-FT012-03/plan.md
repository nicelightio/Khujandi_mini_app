---
description: Execution plan for TASK-FT012-03 storefront cart UI wiring.
status: active
---
# TASK-FT012-03 Plan

## Scope

Wire customer-visible add/update/remove cart UI on the existing public storefront route using canonical public storefront data and the existing `catalog` composition model.

## Steps

1. Inspect current storefront components, composition model, and catalog tests.
2. Add minimal UI state/actions for add, quantity update, remove, preview totals and checkout readiness.
3. Add focused route/page smoke coverage for visible selected shop, line items, quantities, display snapshots, preview totals, remove/update behavior and readiness changes.
4. Run focused tests and feasible catalog/frontend gates.
5. Sync Memory Bank/backlog/changelog and write verification/handoff artifacts.

## Constraints

- Preserve existing shared storefront customer/seller structure.
- Do not add seller edit or delete semantics.
- Do not create orders, start payment, reserve stock, publish lifecycle events, or trust preview totals.
- Keep technical `shop.id` internal; public storefront route identity remains `publicPath`.
