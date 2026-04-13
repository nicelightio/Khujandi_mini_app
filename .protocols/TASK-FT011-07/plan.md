---
description: Execution plan for TASK-FT011-07.
status: active
---
# TASK-FT011-07 Plan

## Inputs used

- Richer task-card fields from `.memory-bank/tasks/backlog.md`
- `FT-011` acceptance criteria, edge cases, and verification targets
- `IMPL-FT-011` invariants and quality gates
- Provisioning/persistence contract from `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `TASK-FT011-03` red-verification follow-up rationale

## Steps

1. Inspect the current provisioning service, repository, schema, and tests to confirm where the race remains and what canonical uniqueness key is minimally sufficient.
2. Implement the smallest persistence-boundary hardening that makes identical/concurrent provisioning fail closed while preserving transactional starter-bundle semantics.
3. Add hostile unit/integration/runtime coverage for repeated or concurrent provisioning attempts and assert exactly one persisted bundle remains.
4. Run targeted catalog tests and relevant repo-local quality gates for the touched scope.
5. Sync protocol artifacts and Memory Bank docs/status with the verified result.
