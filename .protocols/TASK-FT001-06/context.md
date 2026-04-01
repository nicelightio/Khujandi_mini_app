---
description: Context and loaded sources for TASK-FT001-06.
status: active
---
# TASK-FT001-06 Context

## Task

- ID: `TASK-FT001-06`
- Title: `Implement seller-scoped product writes`

## Loaded normative inputs

- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/plans/IMPL-FT-001.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Richer inputs found

- Task card with explicit `Tests`, `Verify`, and `Docs` fields.
- Feature doc with acceptance criteria and edge cases.
- Seller write contract with ownership and shop/product linkage rules.
- Implementation plan with quality gates and UAT steps.

## Fallback usage

- No dedicated task-scoped spec or protocol templates were found.
- Used classic fallback: task card -> feature -> requirements -> architecture/testing docs.

## Task invariants

- Every seller-side product write must run under seller context.
- Seller can mutate only products that belong to own shops.
- Product writes must validate linkage to a shop owned by the same seller.
- Changes must stay inside the owning `catalog` slice.
