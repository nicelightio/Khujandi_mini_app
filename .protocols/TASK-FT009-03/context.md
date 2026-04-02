---
description: Execution context for TASK-FT009-03.
status: active
---
# TASK-FT009-03 Context

## Task
- TASK-ID: `TASK-FT009-03`
- Title: `Implement runtime adapter for theme, safe-area, stable viewport and lifecycle`
- Feature: `FT-009`
- REQs: `REQ-019`, `REQ-023`

## Loaded sources
- `.memory-bank/tasks/backlog.md`: task card, verification targets, invariants, and touched file scope.
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`: acceptance criteria and shell ownership boundary.
- `.memory-bank/tasks/plans/IMPL-FT-009.md`: implementation sequence and quality gates.
- `.memory-bank/requirements.md`: normative wording for `REQ-019` and `REQ-023`.
- `.memory-bank/contracts/mini-app-runtime-contract.md`: runtime adapter boundary, event ownership, and safe-area/viewport policy.
- `.memory-bank/architecture/frontend-presentation-and-webview.md`: shell/runtime architectural rules.
- `.memory-bank/testing/index.md`: Telegram-sensitive verification baseline.
- `.memory-bank/runbooks/telegram-mini-app-verification.md`: runtime/client-matrix verify routing.
- Existing frontend shell/runtime scaffold in `frontend/src/app`, `frontend/src/shared`, and `frontend/src/tests`.

## Richer inputs found
- Task card fields present: `Touched files`, `Tests`, `Verify`, `Docs`, `Verification Targets`, `Invariants`.
- Feature, implementation plan, runtime contract, architecture, testing, and verification docs define explicit runtime scope and non-goals.

## Fallback usage
- Fallback was not needed because the task card and normative docs already define runtime behavior, ownership, and verification expectations.

## Scope interpretation
- This task wires real shell/runtime behavior into the existing scaffold: `ready()/expand()`, theme, viewport, safe-area, and lifecycle handling.
- `viewportStableHeight` must be the layout source of truth when Telegram runtime is available.
- Direct `Telegram.WebApp.*` access must remain isolated inside the shared bridge layer.
- Business logic for catalog, checkout, auth/session, and localization stays outside the shell runtime layer.
