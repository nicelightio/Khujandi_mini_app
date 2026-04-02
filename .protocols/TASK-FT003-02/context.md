---
description: Execution context for TASK-FT003-02.
status: active
---
# TASK-FT003-02 Context

## Task
- TASK-ID: `TASK-FT003-02`
- Title: `Scaffold shared i18n state, persistence helpers and overlay entrypoints`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, touched files, verification target, constraints.
- `.memory-bank/features/FT-003-language-selection-and-localization.md`: acceptance criteria and ownership boundary.
- `.memory-bank/tasks/plans/IMPL-FT-003.md`: sequencing, constraints, expected touched files.
- `.memory-bank/requirements.md`: normative REQ basis.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime adapter and storage policy.
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`: parent epic acceptance.
- `.memory-bank/invariants.md`: mandatory first-run language choice invariant.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: shell/runtime ownership split.
- `.memory-bank/guides/frontend-slices-and-webview.md`: placement rules for shared i18n/state/telegram helpers.
- `.memory-bank/guides/storage-and-state-implementation.md`: deterministic persistence fallback policy.
- `.memory-bank/testing/index.md`: quality gates and Telegram-sensitive testing baseline.

## Richer inputs found
- Task card fields present: `Touched files`, `Tests`, `Verify`, `Docs`, `Constraints`.
- Feature doc provides acceptance criteria and verify ownership split against `FT-009`.
- IMPL plan provides explicit fallback order and non-goals for shell/runtime overlap.

## Fallback usage
- Fallback was not needed because the task card and related spec layer define the scope explicitly.

## Scope interpretation
- Deliver a technical enabling layer only: shared i18n helpers, persistence abstraction, global language state, and app-level overlay entrypoint.
- Do not implement full localization copy rollout, backend profile sync, or broader WebView shell behavior from `FT-009`.
- Avoid direct component access to `localStorage` and `Telegram.WebApp.*`; keep those behind helpers/adapters.
