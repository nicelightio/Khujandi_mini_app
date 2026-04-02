---
description: Execution plan for TASK-FT009-04.
status: active
---
# TASK-FT009-04 Plan

## Goal
- Integrate the existing shell/runtime baseline into customer-facing catalog and checkout pages so they inherit WebView-safe layout, action feedback framing, and centralized back/swipe policy.

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
1. Extend the shared shell context with page-level policy registration for back/swipe/action-feedback metadata.
2. Move shell-owned runtime bootstrap responsibility fully into `AppShell` and stop duplicating `ready()/expand()` inside checkout slice logic.
3. Upgrade `PageShell` and shell CSS so catalog and checkout render inside a consistent WebView-safe layout.
4. Wire catalog and checkout pages to shared shell primitives and centralized policy props without moving business logic into `shared/ui`.
5. Expand focused Jest coverage for page-shell integration, checkout route behavior, and app-shell policy propagation.
6. Sync protocol artifacts and Memory Bank docs after repo-local verification passes.

## Verification targets
- Confirm catalog and checkout render inside shared shell layout markers.
- Confirm checkout publishes centralized back/swipe/action feedback policy through shell context instead of local Telegram bootstrapping.
- Confirm slices still use only shared bridge/context access rather than direct `Telegram.WebApp.*` calls.

## Quality gates
- Focused frontend Jest suite for touched app/shared/slice tests.
- TypeScript gate via `tsconfig.jest.json`.

## Non-goals
- No new auth/payment or localization business behavior.
- No real Telegram client-matrix evidence yet; that remains for later `FT-009` verification work.
