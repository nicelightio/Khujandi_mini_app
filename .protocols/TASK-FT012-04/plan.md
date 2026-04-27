---
description: Execution plan for TASK-FT012-04.
status: active
---
# TASK-FT012-04 Plan

## Steps

1. Inspect current `catalog` composition model, storefront UI wiring and focused tests from `TASK-FT012-02/03`.
2. Add the smallest slice-local state/UI behavior needed for explicit cross-shop replace-or-clear confirmation.
3. Add focused frontend coverage proving cross-shop add is blocked until explicit replacement and mixed-shop payloads are impossible.
4. Run targeted catalog frontend tests and broader available catalog gate if practical.
5. Sync Memory Bank docs/backlog/changelog with implementation outcome.

## Constraints

- Do not introduce a shared cart module.
- Do not change checkout/payment/order side effects.
- Do not expose technical `shop.id` as route identity.
- Preserve seller edit-mode and public storefront structure.
