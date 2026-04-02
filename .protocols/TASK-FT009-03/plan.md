---
description: Execution plan for TASK-FT009-03.
status: active
---
# TASK-FT009-03 Plan

## Goal
- Attach actual Telegram runtime bootstrap and event-driven shell state updates to the existing app-level shell scaffold.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-009`
- `IMPL-FT-009`
- `mini-app-runtime-contract`
- `requirements.md`
- `frontend-presentation-and-webview`
- `testing/index.md`
- `telegram-mini-app-verification`

## Planned changes
1. Extend the shared bridge/state primitives so AppShell can consume runtime snapshots without direct Telegram API access.
2. Implement AppShell bootstrap and event subscriptions for `ready()/expand()`, theme, viewport, safe-area, and lifecycle.
3. Propagate stable viewport and safe-area values through shell CSS variables/data markers.
4. Add focused Jest coverage for bridge snapshots, shell state merging, and AppShell runtime wiring.
5. Sync task progress, verification notes, and Memory Bank changelog/index after passing repo-local gates.

## Verification targets
- Confirm runtime handling is centralized inside AppShell plus shared bridge helpers.
- Confirm stable viewport and safe-area values are propagated through shell state/CSS variables.
- Confirm older or absent Telegram runtime degrades without breaking the shell.

## Quality gates
- Focused frontend Jest suite for touched app/shared tests.
- TypeScript gate if available in the repo.

## Non-goals
- No slice-level catalog/checkout visual integration yet; that belongs to `TASK-FT009-04`.
- No real Telegram client-matrix evidence yet; that belongs to later verify work.
