---
description: Execution context for TASK-FT009-04.
status: active
---
# TASK-FT009-04 Context

## Task
- TASK-ID: `TASK-FT009-04`
- Title: `Wire shell baseline into catalog and checkout UX`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-022`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, touched files, tests, verify target, and constraints.
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`: shell acceptance criteria and ownership boundaries.
- `.memory-bank/tasks/plans/IMPL-FT-009.md`: implementation sequence and quality gates.
- `.memory-bank/requirements.md`: normative wording for `REQ-019` and `REQ-022`.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime adapter and centralized swipe/back policy ownership.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: shared shell boundary and anti-leak rules.
- `.memory-bank/testing/index.md`: Telegram-sensitive verification baseline.
- `.memory-bank/runbooks/telegram-mini-app-verification.md`: verify routing and shell-specific evidence scope.
- Existing frontend shell, page shell, catalog, checkout, and test scaffold in `frontend/src/**/*`.

## Richer inputs found
- Task card fields present: `Touched files`, `Tests`, `Verify`, `Docs`, `Constraints`.
- Feature, implementation plan, contract, architecture, testing, and runbook docs explicitly define shell-vs-slice ownership and verification expectations.

## Fallback usage
- Fallback was not needed because the task card and normative docs already define route-level shell integration scope and non-goals.

## Scope interpretation
- Catalog and checkout must consume WebView-safe shell layout and policy via shared shell primitives instead of slice-local Telegram runtime bootstrapping.
- Business auth/payment logic stays in `checkout-payment`; shell only contributes layout, action feedback framing, and centralized back/swipe policy wiring.
- Slice components must not call `Telegram.WebApp.*` directly; Telegram-specific runtime access remains isolated in the shared bridge and shell context.
