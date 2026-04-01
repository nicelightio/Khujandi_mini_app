---
description: Context and loaded sources for TASK-FT001-04.
status: active
---
# TASK-FT001-04 Context

## Task

- ID: `TASK-FT001-04`
- Title: `Implement public shop and product reads with soft-delete filtering`

## Loaded normative inputs

- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/tasks/plans/IMPL-FT-001.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/guides/slice-implementation-playbook.md`
- `.memory-bank/guides/storage-and-state-implementation.md`
- `.memory-bank/testing/index.md`

## Richer inputs found

- Task card in `.memory-bank/tasks/backlog.md` with explicit `Touched files`, `Tests`, `Verify`, `Docs`, `Verification Targets`.
- Feature doc with acceptance criteria and edge cases.
- Public API contract with browse and soft-delete boundary rules.
- Implementation plan with quality gates and UAT steps.

## Fallback usage

- No dedicated task-scoped spec or protocol templates were found.
- Used classic fallback: task card -> feature -> requirements/epic -> architecture/guides -> testing.

## Task invariants

- Public catalog reads must work without auth.
- Responses must exclude soft-deleted shops.
- Responses must exclude soft-deleted products.
- Responses must exclude products whose parent shop is soft-deleted.
- Changes must stay inside owning `catalog` slice and preserve layered boundaries.
