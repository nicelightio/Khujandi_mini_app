---
description: Execution plan for TASK-FT011-09.
status: active
---
# TASK-FT011-09 Plan

## Inputs used

- Richer task-card fields from `.memory-bank/tasks/backlog.md`
- `FT-011` acceptance criteria and edge-case notes for multi-shop seller provisioning
- `IMPL-FT-011` invariants and quality gates
- Provisioning identity rules from `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`

## Steps

1. Inspect the mounted runtime provisioning path and test doubles to find where `sellerId`-only or `telegramId`-only uniqueness still leaks into behavior.
2. Implement the smallest runtime fix so binding creation no longer blocks a second admin-provisioned shop for the same seller identity.
3. Add focused integration and mounted-runtime regressions proving `shop A` and `shop B` can be provisioned for one seller identity while identical `sellerId + shop name` retries still fail closed.
4. Run the relevant catalog test gates.
5. Sync task artifacts and Memory Bank docs with the landed behavior.
