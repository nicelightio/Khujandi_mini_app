---
description: Context and loaded sources for TASK-FT011-03.
status: active
---
# TASK-FT011-03 Context

## Task

- ID: `TASK-FT011-03`
- Title: `Enforce transactional catalog provisioning with fail-closed duplicate handling`

## Loaded normative inputs

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/tasks/plans/IMPL-FT-011.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/testing/index.md`

## Richer inputs found

- Task card in `.memory-bank/tasks/backlog.md` with explicit `Touched files`, `Tests`, `Verify`, `Docs`, and `Verification Targets`.
- `FT-011` feature doc with acceptance criteria, edge cases, constraints, and normative inputs.
- `IMPL-FT-011` with task ordering, invariants, expected touched files, and quality gates.
- Contract docs explicitly require atomic `shop + seller binding + starter catalog bootstrap` persistence and fail-closed duplicate handling.

## Fallback usage

- No dedicated task-card file or protocol templates were found for `TASK-FT011-03`.
- Used classic fallback: task card -> feature -> requirements -> contracts/architecture -> testing.

## Task invariants

- Provisioning must persist `shop`, seller binding, starter menu pages, and starter products atomically or roll back entirely.
- Duplicate/conflicting provisioning must return a controlled error and leave no partial catalog state.
- Scope stays inside the owning `catalog` slice and mounted repo-local runtime alignment only if needed by the provisioning path.
- Clean DB-backed baseline is acceptable; no legacy in-memory compatibility/backfill should be added.
