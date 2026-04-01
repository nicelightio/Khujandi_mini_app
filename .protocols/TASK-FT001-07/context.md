---
description: Context and loaded sources for TASK-FT001-07.
status: active
---
# TASK-FT001-07 Context

## Task

- ID: `TASK-FT001-07`
- Title: `Wire public catalog UI to backend read path`

## Loaded normative inputs

- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-001-catalog-browse-and-seller-management.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/tasks/plans/IMPL-FT-001.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/architecture/index.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/frontend-presentation-and-webview.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/guides/index.md`
- `.memory-bank/guides/slice-implementation-playbook.md`
- `.memory-bank/guides/frontend-slices-and-webview.md`
- `.memory-bank/guides/storage-and-state-implementation.md`

## Richer inputs found

- Task card in `.memory-bank/tasks/backlog.md` with explicit `Touched files`, `Tests`, `Verify`, and `Docs` fields.
- `FT-001` feature doc with implementation state, acceptance criteria, edge cases, and normative links.
- `IMPL-FT-001` with exact step `7` for wiring the public catalog UI and explicit quality gates.
- `catalog-public-api` contract with browse-safe, unauthenticated, soft-delete-filtered read boundary.

## Fallback usage

- No dedicated task-card file or protocol templates were found for `TASK-FT001-07`.
- Fallback was not needed beyond the standard chain because richer backlog and feature inputs exist; classic routing stayed `task card -> feature -> requirements -> architecture/guides -> testing`.

## Task invariants

- Public catalog browse MUST work without auth.
- UI wiring MUST stay inside the owning `catalog` slice and its presentation/api/model layers.
- UI MUST handle loading, empty, and error states for public browse.
- Browse rendering MUST not leak seller-only semantics into customer-facing UI.
