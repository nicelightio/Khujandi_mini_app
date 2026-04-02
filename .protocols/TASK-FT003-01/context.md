---
description: Execution context for TASK-FT003-01.
status: active
---
# TASK-FT003-01 Context

## Task
- TASK-ID: `TASK-FT003-01`
- Title: `Freeze language policy, persistence fallback and verify boundaries`
- Feature: `FT-003`
- REQs: `REQ-003`, `REQ-022`, `REQ-023`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, touched files, verification target.
- `.memory-bank/features/FT-003-language-selection-and-localization.md`: acceptance criteria and failure modes.
- `.memory-bank/tasks/plans/IMPL-FT-003.md`: plan sequencing and constraints.
- `.memory-bank/requirements.md`: normative REQ mapping.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime adapter boundary, storage policy, and post-auth source-of-truth rules.
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`: parent epic success criteria.
- `.memory-bank/invariants.md`: mandatory first-run language choice invariant.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: shell/runtime ownership split.
- `.memory-bank/guides/frontend-slices-and-webview.md`: placement rules for shared i18n/runtime helpers.
- `.memory-bank/guides/storage-and-state-implementation.md`: deterministic persistence fallback policy.
- `.memory-bank/runbooks/telegram-mini-app-verification.md`: Telegram-specific verify ownership and evidence expectations.
- `.memory-bank/testing/index.md`: quality gates and Telegram-sensitive anti-cheat baseline.

## Richer inputs found
- Task card fields present: `Normative Inputs`, `Touched files`, `Tests`, `Verify`, `Docs`, `Constraints`.
- Feature doc provides acceptance criteria, edge cases, and baseline verification pointers.
- IMPL plan provides explicit fallback order, source-of-truth rules, and scope split against `FT-009`.

## Fallback usage
- Fallback was not needed because task card, feature doc, implementation plan, runtime contract, runbook, and testing docs provide explicit scope.

## Scope interpretation
- This task is docs-first only.
- Deliverables are feature/contract/runbook consistency updates that freeze default language policy, storage fallback order, post-auth profile sync boundary, and Telegram-specific verify ownership before runtime scaffolding.
- No frontend/backend runtime code is expected in this task.
