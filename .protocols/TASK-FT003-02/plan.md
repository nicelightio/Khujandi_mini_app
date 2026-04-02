---
description: Execution plan for TASK-FT003-02.
status: active
---
# TASK-FT003-02 Plan

## Goal
- Add the minimal shared frontend scaffold required for later `FT-003` runtime tasks without leaking storage or Telegram runtime calls into feature components.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-003`
- `IMPL-FT-003`
- `mini-app-runtime-contract`
- `requirements.md`
- `EP-001`
- `invariants.md`
- `frontend-presentation-and-webview`
- `frontend-slices-and-webview`
- `storage-and-state-implementation`
- `testing/index.md`

## Planned changes
1. Expand shared i18n/runtime primitives with default language and normalization helpers.
2. Add shared persistence abstractions that preserve `DeviceStorage -> CloudStorage -> localStorage` ownership and order.
3. Add a small global language controller/state plus app-level localization boundary as the overlay entrypoint.
4. Add repo-local frontend tests for normalization, persistence orchestration, and overlay gating baseline.
5. Sync task protocol, backlog/changelog, and implementation report after verification.

## Verification targets
- Confirm the repo now has a shared localization scaffold under `shared/i18n`, `shared/lib`, `shared/state`, and `shared/telegram`.
- Confirm app-level overlay entrypoint exists without direct component-level storage or Telegram API access.
- Confirm repo-local tests cover normalization, fallback orchestration, and overlay visibility baseline.

## Quality gates
- Jest repo-local tests for touched frontend files
- Type-safe compilation through Jest/ts-jest coverage for the touched files

## Non-goals
- No full translation catalog rollout
- No backend profile sync implementation
- No safe-area/theme/viewport/lifecycle shell work from `FT-009`
