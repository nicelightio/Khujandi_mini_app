---
description: Execution plan for TASK-FT001-07.
status: active
---
# TASK-FT001-07 Plan

## Inputs used

- Richer task-card fields from `.memory-bank/tasks/backlog.md`
- `FT-001` implementation-state and acceptance notes
- `IMPL-FT-001` step 7 and quality gates
- Frontend slice and WebView placement rules from architecture/guides docs

## Steps

1. Inspect the current `frontend/src/slices/catalog` scaffold and the backend public catalog read contract/runtime.
2. Implement minimal catalog API/model wiring so the public route loads shops and products from the backend read path.
3. Render browse data with explicit loading, empty, and error states while keeping logic inside the `catalog` slice.
4. Add frontend smoke tests for unauthenticated browse rendering and state handling.
5. Run relevant frontend tests and any lightweight type/lint gates available for the touched scope.
6. Sync protocol files, task artifacts, backlog/changelog, and feature/docs status.
