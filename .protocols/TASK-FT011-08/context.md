---
description: Context and loaded sources for TASK-FT011-08.
status: active
---
# TASK-FT011-08 Context

## Task

- ID: `TASK-FT011-08`
- Title: `Reconcile seller rename conflicts with the durable shop identity invariant`

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
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`

## Richer inputs found

- Task card in `.memory-bank/tasks/backlog.md` with explicit `Touched files`, `Tests`, `Verify`, `Docs`, and follow-up source from `red-verify` on `TASK-FT011-07`.
- `FT-011` feature doc with acceptance criteria, edge cases, and the explicit note that seller rename now shares the durable `sellerId + shop name` invariant.
- `IMPL-FT-011` with invariants, quality gates, and the broader runtime-hardening context.
- Contract docs that require controlled conflict behavior and durable seller writes on the canonical catalog persistence path.

## Fallback usage

- No dedicated task-card file or protocol templates were found for `TASK-FT011-08`.
- Used classic fallback: task card -> feature -> requirements -> contracts/architecture -> testing -> prior task implementation context.

## Task invariants

- Seller rename collisions against another shop owned by the same seller must fail through a controlled conflict contract rather than a raw persistence failure.
- The durable `Shop(sellerId, name)` uniqueness boundary introduced for provisioning remains authoritative and must stay mirrored on the repo-local in-memory runtime helper.
- Existing rename-count and manual-paid marker semantics from `REQ-020` must remain intact.
- Scope stays inside the owning `catalog` slice plus minimal runtime/test/doc sync.
