---
description: Контекст выполнения TASK-FT009-08.
status: active
---
# TASK-FT009-08 Context

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
- `.memory-bank/runbooks/telegram-mini-app-verification.md`
- `.memory-bank/bugs/BUG-2026-04-19-ft009-shell-runtime-hardening-gap.md`
- `.protocols/TASK-FT009-07/red-verification.md`
- `.protocols/TASK-FT009-07/handoff.md`

## Richer inputs found

- Backlog card for `TASK-FT009-08` with touched files, tests, verification target, docs scope, and constraints.
- `FT-009` acceptance criteria explicitly requiring shell-owned capability/degradation policy for weak Android and old Telegram clients.
- Runtime contract and frontend architecture docs requiring centralized shell policy instead of ad hoc slice-level runtime decisions.
- Prior `TASK-FT009-07` red verification narrowing the remaining concern to degradation policy and broader shell behavior validation.

## Fallback usage

- No separate task card document or protocol template was present.
- Used classic fallback: backlog task + feature spec + requirements + contract + architecture + guide + testing/runbook docs.

## Implementation target

- Add one minimal capability snapshot to the Telegram bridge.
- Derive one shell-owned degradation policy in shared shell state.
- Route shell layout metadata and bottom-action rendering through that policy without widening scope into a broad device-profiler or runtime propagation refactor.
