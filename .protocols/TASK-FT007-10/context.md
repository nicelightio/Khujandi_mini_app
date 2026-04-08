# TASK-FT007-10 Context

## Loaded docs

- `.memory-bank/commands/execute.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT007-10` card)
- `.memory-bank/features/FT-007-admin-auth-and-session-security.md`
- `.memory-bank/requirements.md`
- `.memory-bank/spec-index.md`

## Richer inputs

- Explicit task card fields present: touched files, tests, verify, constraints, result.
- No separate IMPL plan was provided for this task.

## Fallback basis

- Feature spec `FT-007`
- RTM rows for `REQ-015`, `REQ-017`
- Existing frontend/admin routers and current production entrypoint wiring

## Problem statement

- The shared `index.html` always boots `frontend/src/app/main.tsx`.
- On production/static deploy, `/admin/login` therefore runs the customer router and falls back to catalog instead of rendering the admin login route.

## Intended outcome

- Keep one shared frontend entrypoint.
- Select `AdminRouter` for pathname prefix `/admin` and `AppRouter` otherwise.
