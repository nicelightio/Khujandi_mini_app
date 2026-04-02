---
description: Execution plan for TASK-FT003-01.
status: active
---
# TASK-FT003-01 Plan

## Goal
- Freeze language-selection policy, persistence fallback, and verification boundaries so `FT-003` runtime tasks implement against an explicit spec layer.

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
- `telegram-mini-app-verification`
- `testing/index.md`

## Planned changes
1. Confirm `FT-003` explicitly covers `REQ-022` and `REQ-023` in addition to localization acceptance.
2. Tighten runtime contract around default `ru` baseline, Telegram language hint policy, explicit-user-choice precedence, and post-auth source of truth.
3. Tighten verification runbook around runtime contract checks, fallback-to-`ru`, and scope split from `FT-009` shell verification.
4. Sync backlog/changelog and record docs-only implementation/verification artifacts.

## Verification targets
- Confirm default language policy, storage fallback order, post-auth profile sync boundary, and Telegram-specific verify ownership are explicit and consistent across feature, plan, contract, runbook, and testing docs.
- Confirm no contradiction with `REQ-003`, `REQ-022`, and `REQ-023` in `.memory-bank/requirements.md`.
- Confirm backlog and changelog reflect docs-first completion and unlock `TASK-FT003-02`.

## Quality gates
- Doc-level traceability review
- Link/navigation consistency in touched Memory Bank docs

## Non-goals
- No runtime i18n/store scaffolding
- No frontend or backend implementation
