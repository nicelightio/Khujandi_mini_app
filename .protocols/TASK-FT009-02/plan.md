---
description: Execution plan for TASK-FT009-02.
status: active
---
# TASK-FT009-02 Plan

## Goal
- Scaffold an app-level shell boundary, richer shared shell state shape, and execution-ready runtime tests without implementing the full Telegram runtime event logic yet.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-009`
- `IMPL-FT-009`
- `mini-app-runtime-contract`
- `requirements.md`
- `frontend-presentation-and-webview`
- `frontend-slices-and-webview`
- `testing/index.md`

## Planned changes
1. Introduce an app-level shell boundary component/provider that wraps routed content and centralizes shell state ownership.
2. Expand shared Telegram bridge types with explicit runtime-facing metadata access while keeping behavior no-op safe.
3. Expand shared shell state primitives so later tasks can attach theme/viewport/lifecycle behavior without reshaping consumers again.
4. Add repo-local Jest coverage for shell state, app shell boundary, and runtime bridge primitives.
5. Sync task progress, verification notes, and Memory Bank changelog/backlog status after implementation.

## Verification targets
- Confirm routed app content is wrapped by a centralized shell boundary.
- Confirm shell scaffold exposes execution-ready state for later theme/viewport/lifecycle work.
- Confirm tests cover the no-direct-Telegram-access boundary via shared bridge primitives only.

## Quality gates
- Focused Jest suite for touched frontend app/shared tests.

## Non-goals
- No full runtime event subscriptions yet.
- No route-level feature logic changes beyond shell wrapping.
- No real Telegram client-matrix verification in this task.
