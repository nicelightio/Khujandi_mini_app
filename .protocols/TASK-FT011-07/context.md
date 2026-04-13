---
description: Context and loaded sources for TASK-FT011-07.
status: active
---
# TASK-FT011-07 Context

## Task

- ID: `TASK-FT011-07`
- Title: `Make provisioning conflict handling race-safe at the persistence boundary`

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
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`

## Richer inputs found

- Task card in `.memory-bank/tasks/backlog.md` with explicit `Touched files`, `Tests`, `Verify`, `Docs`, and source context from `red-verify`.
- `FT-011` feature doc with acceptance criteria, edge cases, constraints, and verification targets.
- `IMPL-FT-011` with invariants, quality gates, and expected touched files.
- Contract docs explicitly require atomic provisioning and fail-closed duplicate/conflict handling on the canonical persistence path.
- `TASK-FT011-03` red verification explicitly identifies the remaining race at the service-layer precheck.

## Fallback usage

- No dedicated task-card file or protocol templates were found for `TASK-FT011-07`.
- Used classic fallback: task card -> feature -> requirements -> contracts/architecture -> testing -> prior task red-verification.

## Task invariants

- Duplicate/conflicting provisioning must fail closed at the repository/DB boundary, not only via an application-layer precheck.
- Concurrent identical provisioning intent must leave exactly one durable starter bundle and no partial rows.
- Scope stays inside the owning `catalog` slice plus minimal schema/runtime alignment only if required by canonical persistence semantics.
- Existing transactional rollback behavior for `shop + binding + starter menu pages + starter products` must remain intact.
