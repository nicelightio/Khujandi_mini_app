---
description: Execution context for TASK-FT009-01.
status: active
---
# TASK-FT009-01 Context

## Task
- TASK-ID: `TASK-FT009-01`
- Title: `Freeze shell runtime, storage and verify boundaries`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`, `REQ-023`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, touched files, verification target, and next-step routing.
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`: acceptance criteria, shell invariants, and verify ownership target.
- `.memory-bank/tasks/plans/IMPL-FT-009.md`: sequencing, constraints, and expected touched docs.
- `.memory-bank/requirements.md`: normative REQ mapping.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime adapter boundary and storage split.
- `.memory-bank/runbooks/telegram-mini-app-verification.md`: Telegram-specific verify scope and evidence rules.
- `.memory-bank/testing/index.md`: quality gates and anti-cheat baseline.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: shell/runtime ownership split and anti-leak rules.
- `.memory-bank/guides/frontend-slices-and-webview.md`: frontend placement rules for shell/runtime code.
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`: parent epic success criteria.
- `.memory-bank/features/FT-002-checkout-payment-and-order-creation.md`: existing auth/payment verify ownership boundary.
- `.memory-bank/features/FT-003-language-selection-and-localization.md`: existing localization verify ownership boundary.

## Richer inputs found
- Task card fields present: `Normative Inputs`, `Touched files`, `Tests`, `Verify`, `Docs`, `Constraints`.
- Feature doc, implementation plan, runtime contract, runbook, and testing doc together provide explicit ownership and verification boundaries.

## Fallback usage
- Fallback was not needed because the task card and related normative docs already define explicit scope and verification targets.

## Scope interpretation
- This task is docs-first only.
- Deliverables are spec and protocol updates that freeze shell/runtime ownership, shared `REQ-022` storage boundary, and Telegram-specific verify routing before app-level scaffolding starts.
- No frontend/backend runtime code is expected in this task.
