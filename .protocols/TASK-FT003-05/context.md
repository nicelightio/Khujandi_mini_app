---
description: Execution context for TASK-FT003-05.
status: active
---
# TASK-FT003-05 Context

## Task
- TASK-ID: `TASK-FT003-05`
- Title: `Wire localized copy baseline into customer-facing routes`
- Feature: `FT-003`
- REQs: `REQ-003`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, dependencies, touched files, tests, verify target, and scope constraint.
- `.memory-bank/features/FT-003-language-selection-and-localization.md`: acceptance criteria and verify ownership.
- `.memory-bank/tasks/plans/IMPL-FT-003.md`: rollout order, constraints, expected touched files, and quality gates.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime/storage ownership and `ru` fallback policy.
- `.memory-bank/requirements.md`: `REQ-003` basis and RTM status.
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`: customer-ordering acceptance baseline.
- `.memory-bank/testing/index.md`: route/page smoke and Telegram-sensitive verification basis.
- `.memory-bank/invariants.md`: mandatory first-run language choice invariant.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: shared/runtime ownership rules.
- `.memory-bank/guides/frontend-slices-and-webview.md`: placement rules for shared i18n/state and route composition.
- `.memory-bank/guides/storage-and-state-implementation.md`: deterministic preference persistence rule.

## Richer inputs found
- Task card fields present: `Touched files`, `Tests`, `Verify`, `Docs`, `Constraints`.
- `TASK-FT003-04` handoff explicitly points the next task at consuming the centralized app language context instead of touching storage/runtime directly.
- `FT-003` and `IMPL-FT-003` clearly split this task from verification-heavy `TASK-FT003-06`: current scope is localized copy baseline for customer-facing routes, not full Telegram evidence closure.

## Fallback usage
- Fallback was not needed because the task card plus `FT-003`/`IMPL-FT-003` provide explicit scope, constraints, and verification targets.

## Scope interpretation
- Add a small shared localization dictionary/helper for customer-facing copy that can be consumed by the app boundary, catalog, and checkout routes.
- Keep localization consumption inside existing shared i18n and route/view-model boundaries without introducing component-level storage or Telegram runtime access.
- Preserve `FT-009` separation: no safe-area, theme, lifecycle, or broader shell/runtime work in this task.
