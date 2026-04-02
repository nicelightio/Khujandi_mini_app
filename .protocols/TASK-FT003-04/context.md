---
description: Execution context for TASK-FT003-04.
status: active
---
# TASK-FT003-04 Context

## Task
- TASK-ID: `TASK-FT003-04`
- Title: `Implement first-run overlay gating and authenticated language sync`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, dependencies, touched files, tests, verify targets.
- `.memory-bank/features/FT-003-language-selection-and-localization.md`: acceptance criteria and edge cases.
- `.memory-bank/tasks/plans/IMPL-FT-003.md`: sequencing, constraints, expected touched files, and quality gates.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime ownership, persistence policy, and post-auth source-of-truth rule.
- `.memory-bank/requirements.md`: normative REQ basis and RTM.
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`: parent epic acceptance baseline.
- `.memory-bank/testing/index.md`: quality gates and Telegram-sensitive verification baseline.
- `.memory-bank/invariants.md`: mandatory first-run language choice invariant.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: frontend shared/runtime boundary.
- `.memory-bank/guides/frontend-slices-and-webview.md`: placement rules for shared state and Telegram access.
- `.memory-bank/guides/storage-and-state-implementation.md`: deterministic preference persistence rules.

## Richer inputs found
- Task card fields present: `Touched files`, `Tests`, `Verify`, `Docs`, `Invariants`.
- `FT-003` and `IMPL-FT-003` explicitly split this task from `TASK-FT003-05`: current scope is gating plus post-auth sync, not full copy rollout.
- Runtime contract explicitly requires backend profile to become source of truth after auth while keeping Telegram/runtime access behind shared adapters.

## Fallback usage
- Fallback was not needed because the task card and related spec set provide explicit scope, constraints, and verification targets.

## Scope interpretation
- Strengthen the app-level localization boundary so customer-facing routes stay blocked until an explicit language exists.
- Reuse the shared localization runtime from `TASK-FT003-02/03` instead of adding a new slice or direct component-level storage access.
- Add a minimal backend language update path inside `checkout-payment` so successful Telegram auth can persist the explicit user choice over the Telegram hint.
