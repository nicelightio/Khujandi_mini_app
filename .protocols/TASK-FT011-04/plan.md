---
description: Execution plan for TASK-FT011-04.
status: active
---
# TASK-FT011-04 Plan

## Inputs used

- Richer task-card fields from `.memory-bank/tasks/backlog.md`
- `FT-011` acceptance criteria and edge cases
- `IMPL-FT-011` invariants and quality gates
- Public/seller catalog runtime contracts from `.memory-bank/contracts/catalog-public-api.md` and `.memory-bank/contracts/catalog-seller-access-and-session.md`

## Steps

1. Inspect the mounted runtime and catalog slice to find reads that still bypass the repository-backed persisted path.
2. Implement the smallest slice/runtime change that moves seller storefront resolution and related seller capability checks onto repository-backed catalog reads.
3. Add or update runtime coverage proving seller storefront data survives restart/reset and no longer depends on route-local state wiring.
4. Run targeted lint/tests for the touched catalog scope.
5. Sync task artifacts and Memory Bank status/docs with the verified result.
