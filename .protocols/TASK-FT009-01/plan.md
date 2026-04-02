---
description: Execution plan for TASK-FT009-01.
status: active
---
# TASK-FT009-01 Plan

## Goal
- Freeze shell/runtime, storage, and verification ownership so `FT-009` implementation tasks build on an explicit Telegram WebView spec layer.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-009`
- `IMPL-FT-009`
- `mini-app-runtime-contract`
- `requirements.md`
- `frontend-presentation-and-webview`
- `frontend-slices-and-webview`
- `telegram-mini-app-verification`
- `testing/index.md`
- `FT-002`
- `FT-003`

## Planned changes
1. Extend `FT-009` so it explicitly covers `REQ-022` shell/storage ownership and references runtime/runbook inputs.
2. Tighten the runtime contract around ownership split between `FT-002`, `FT-003`, and `FT-009`.
3. Tighten the verification runbook/testing doc so shell/client-matrix evidence is clearly separated from auth/payment and localization evidence.
4. Sync backlog, changelog, and Memory Bank navigation for docs-only task closure and handoff to `TASK-FT009-02`.

## Verification targets
- Confirm `ready()/expand()`, safe-area, stable viewport, theme/lifecycle, centralized back/swipe policy, and client-matrix ownership are explicit and non-conflicting across touched docs.
- Confirm the shared `REQ-022` boundary is split clearly: `FT-002` owns session/auth transport, `FT-003` owns language persistence behavior, and `FT-009` owns shell/runtime storage policy only.
- Confirm backlog and navigation show `TASK-FT009-01` complete and route the next action to `TASK-FT009-02`.

## Quality gates
- Doc-level traceability review
- Link and navigation consistency in touched Memory Bank docs

## Non-goals
- No shell scaffold or runtime code
- No frontend or backend implementation
