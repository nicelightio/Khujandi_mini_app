---
description: Execution plan for TASK-FT001-03.
status: active
---
# TASK-FT001-03 Plan

## Inputs strategy
- Use the task-card verify target as primary acceptance basis.
- Follow the frontend slice layout from `.memory-bank/guides/frontend-slices-and-webview.md`.
- Keep the route shell public and free of non-catalog business logic.

## Planned steps
1. Create `frontend/src/app/router.tsx` with a minimal public route shell.
2. Create `frontend/src/slices/catalog/**/*` scaffold for routes, components, hooks, api, and model.
3. Add technical shared frontend primitives for shell layout, route constants, UI shell state, Telegram stub, i18n options, and shell styles.
4. Add minimal frontend test skeleton files.
5. Sync protocols, backlog, feature/plan current state, and changelog.

## Constraints
- Keep catalog UI concerns inside the `catalog` slice.
- Do not move catalog business rules into `frontend/src/shared`.
- Keep the shell implementation-ready but intentionally disconnected from real APIs for now.

## Verification targets
- Frontend route shell exists.
- `catalog` slice layout exists.
- Shared frontend code contains only shell/runtime primitives.
- Frontend test skeleton exists.
