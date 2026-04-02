---
description: Execution context for TASK-FT003-06.
status: active
---
# TASK-FT003-06 Context

## Task
- TASK-ID: `TASK-FT003-06`
- Title: `Add localization verification suite and Telegram evidence sync`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`, `REQ-023`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, dependencies, touched files, tests, verify target, docs, and quality gates.
- `.memory-bank/features/FT-003-language-selection-and-localization.md`: acceptance criteria, normative inputs, test pointers, and verify ownership split with `FT-009`.
- `.memory-bank/tasks/plans/IMPL-FT-003.md`: rollout steps, verification targets, constraints, and expected touched files.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: storage fallback order, trusted language source-of-truth rules, and Telegram runtime ownership.
- `.memory-bank/runbooks/telegram-mini-app-verification.md`: Telegram-specific verification checklist and minimal client-matrix evidence rules.
- `.memory-bank/requirements.md`: `REQ-003`, `REQ-022`, `REQ-023`, and current RTM lifecycle state.
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`: parent epic acceptance baseline.
- `.memory-bank/testing/index.md`: Telegram-sensitive anti-cheat rules and quality gates.
- `.memory-bank/invariants.md`: mandatory first-run language-choice invariant.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: boundary split between `FT-003` and `FT-009`.
- `.memory-bank/guides/frontend-slices-and-webview.md`: placement rules for shared i18n/state/runtime helpers.
- `.memory-bank/guides/storage-and-state-implementation.md`: deterministic persistence fallback policy.
- `.protocols/TASK-FT003-05/handoff.md`: next-task guardrails and scope handoff.

## Richer inputs found
- Task card includes explicit `Touched files`, `Tests`, `Verify`, `Docs`, and `Quality Gates` fields.
- `FT-003` and `IMPL-FT-003` explicitly require final frontend unit/contract/e2e smoke, backend integration for post-auth language sync, and Telegram client-matrix evidence.
- `telegram-mini-app-verification.md` narrows Telegram-specific acceptance for localization to overlay, persistence fallback, `ru` fallback for invalid values, and post-auth restore/sync while keeping shell baseline in `FT-009`.
- `TASK-FT003-05` handoff instructs the next task to reuse the shared language/runtime path and not reopen storage/runtime ownership.

## Fallback usage
- Fallback was not needed because the task card and `FT-003` spec layer define scope, constraints, and verification targets explicitly.

## Scope interpretation
- Audit existing frontend/backend localization coverage and add only missing verification cases needed to satisfy `FT-003` acceptance.
- Produce repo-local evidence for overlay, persistence fallback, and post-auth sync without expanding into safe-area/theme/lifecycle shell work.
- Sync Memory Bank, RTM, and task artifacts only after the verification basis is complete and evidence is stored.
