---
description: Context and loaded sources for TASK-FT001-09.
status: active
---
# TASK-FT001-09 Context

## Task

- ID: `TASK-FT001-09`
- Title: `Add repo test runner config for catalog specs`

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
- `.memory-bank/testing/index.md`
- `.memory-bank/architecture/index.md`
- `.memory-bank/guides/index.md`

## Richer inputs found

- Task card in `.memory-bank/tasks/backlog.md` with explicit `Touched files`, `Tests`, `Verify`, `Docs`.
- Feature doc explicitly records that `TASK-FT001-04` and `TASK-FT001-05` are blocked only by missing repo-level Jest config.
- Testing doc defines unit/integration gates as mandatory evidence.

## Fallback usage

- No dedicated task-card file or protocol templates were found for `TASK-FT001-09`.
- Used classic fallback: task card -> feature -> requirements -> architecture/guides -> testing.

## Task invariants

- Scope stays repo-local and backend-test-only.
- No frontend/e2e/CI/watch/coverage/reporting platform expansion.
- Existing `tests/slices/catalog/*.spec.ts` must run from the repository via checked-in config and scripts.
