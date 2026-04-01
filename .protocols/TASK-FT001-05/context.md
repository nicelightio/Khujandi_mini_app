---
description: Context and loaded sources for TASK-FT001-05.
status: active
---
# TASK-FT001-05 Context

## Task

- ID: `TASK-FT001-05`
- Title: `Implement seller-scoped shop writes and rename policy flags`

## Loaded normative inputs

- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/plans/IMPL-FT-001.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Richer inputs found

- Task card with explicit `Tests`, `Verify`, `Docs`, and `Invariants`.
- Feature doc with acceptance criteria and edge cases.
- Seller write contract with ownership, rename policy, and snapshot invariant.
- Implementation plan with quality gates and UAT steps.

## Fallback usage

- No dedicated task-scoped spec or protocol templates were found.
- Used classic fallback: task card -> feature -> requirements -> architecture/testing docs.

## Task invariants

- Every seller-side shop write must run under seller context.
- Seller can mutate only own shops.
- First rename is free; later renames set manual paid marker.
- Shop rename must not mutate historical `shop_name_snapshot` data in other slices.
