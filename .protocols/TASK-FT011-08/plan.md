---
description: Execution plan for TASK-FT011-08.
status: active
---
# TASK-FT011-08 Plan

## Inputs used

- Richer task-card fields from `.memory-bank/tasks/backlog.md`
- `FT-011` acceptance criteria and follow-up rationale from `TASK-FT011-07`
- `IMPL-FT-011` invariants and quality gates
- Rename and durability contracts from `.memory-bank/contracts/seller-catalog-write-policy.md` and `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`

## Steps

1. Inspect the current seller rename flow across service, repository/runtime helper, and HTTP runtime path to confirm where raw uniqueness errors can currently leak.
2. Implement the smallest controlled-conflict mapping for rename collisions while preserving existing rename-count/manual-review behavior.
3. Mirror the same invariant in the in-memory/runtime helper so mounted repo-local behavior matches the canonical persistence boundary.
4. Add focused unit/integration/runtime regressions for rename collision behavior.
5. Run targeted catalog quality gates and sync task/Memory Bank artifacts with the verified outcome.
