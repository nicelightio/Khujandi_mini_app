---
description: Execution context for TASK-FT003-03.
status: active
---
# TASK-FT003-03 Context

## Task
- TASK-ID: `TASK-FT003-03`
- Title: `Implement deterministic language resolution and storage fallback policy`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, verification targets, touched files.
- `.memory-bank/features/FT-003-language-selection-and-localization.md`: acceptance criteria and edge cases.
- `.memory-bank/tasks/plans/IMPL-FT-003.md`: sequencing, constraints, expected tests.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime ownership and fallback order.
- `.memory-bank/requirements.md`: normative REQ basis and RTM.
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`: parent epic acceptance.
- `.memory-bank/testing/index.md`: quality gates and Telegram-sensitive verification baseline.
- `.memory-bank/invariants.md`: mandatory first-run language choice invariant.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: shared/runtime boundary.
- `.memory-bank/guides/frontend-slices-and-webview.md`: placement rules for shared i18n/state/telegram code.
- `.memory-bank/guides/storage-and-state-implementation.md`: deterministic persistence fallback policy.

## Richer inputs found
- Task card fields present: `Touched files`, `Tests`, `Verify`, `Docs`, `Verification Targets`.
- Feature doc and IMPL plan explicitly define `DeviceStorage -> CloudStorage -> localStorage` and `ru` fallback behavior.
- Runtime contract fixes ownership of Telegram storage access inside shared adapters only.

## Fallback usage
- Fallback was not needed because the task card and related spec set provide explicit scope and verification targets.

## Scope interpretation
- Finish deterministic language resolution on top of the scaffold from `TASK-FT003-02`.
- Keep the scope inside shared frontend helpers/adapters; do not wire post-auth sync or full localized copy rollout.
- Treat unsupported, empty, or damaged persisted values as invalid explicit preference while preserving `ru` as runtime fallback.
