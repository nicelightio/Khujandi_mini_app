---
description: Контекст выполнения TASK-FT009-07.
status: active
---
# TASK-FT009-07 Context

## Loaded docs

- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-009-mini-app-shell-and-webview-ux.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-009.md`
- `.memory-bank/contracts/mini-app-runtime-contract.md`
- `.memory-bank/architecture/frontend-presentation-and-webview.md`
- `.memory-bank/guides/frontend-slices-and-webview.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`

## Richer inputs found

- Backlog card for `TASK-FT009-07` with touched files, tests, verification target, docs scope, and constraints.
- `FT-009` acceptance criteria explicitly requiring shared keyboard-safe layout and bottom action zone primitives.
- Runtime contract and frontend architecture docs requiring shell-owned bottom action zones instead of page-local CTA layout.

## Fallback usage

- No separate task card or protocol template was present.
- Used classic fallback: backlog task + feature spec + requirements + contract + architecture + testing docs.

## Implementation target

- Add a shell-owned bottom action primitive to `PageShell`.
- Move checkout primary CTA into that primitive.
- Keep scope limited to customer-facing shell surfaces without a broader layout rewrite.
