---
description: Execution plan for TASK-FT003-03.
status: active
---
# TASK-FT003-03 Plan

## Goal
- Make language resolution deterministic across supported values, invalid persisted values, storage failures, and Telegram adapter availability while preserving the documented fallback order.

## Inputs
- Task card in `.memory-bank/tasks/backlog.md`
- `FT-003`
- `IMPL-FT-003`
- `mini-app-runtime-contract`
- `requirements.md`
- `EP-001`
- `testing/index.md`
- `storage-and-state-implementation`

## Planned changes
1. Tighten shared language normalization so invalid persisted values can be distinguished from valid explicit user choices.
2. Update shared persistence orchestration to keep deterministic read/write order and tolerate unavailable higher-priority storage layers.
3. Replace the placeholder Telegram storage bridge with safe wrappers that keep runtime access inside `shared/telegram`.
4. Add focused unit/contract tests for invalid values, failure fallback, and adapter wrapper behavior.
5. Sync task protocol, task evidence, and Memory Bank status once verification passes.

## Verification targets
- Invalid, empty, and unsupported language values resolve to `ru` deterministically.
- Invalid persisted values do not masquerade as a valid explicit preference.
- Read/write fallback order remains `DeviceStorage -> CloudStorage -> localStorage`.
- Telegram adapter wrappers remain the only bridge for Device/Cloud storage access.

## Quality gates
- Focused Jest suites for shared i18n/lib/telegram/app files.
- Full repo-local frontend Jest pass for affected suites.

## Non-goals
- No backend profile sync.
- No copy rollout across catalog/checkout screens.
- No broader Telegram shell work from `FT-009`.
