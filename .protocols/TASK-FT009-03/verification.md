---
description: Verification notes for TASK-FT009-03.
status: active
---
# TASK-FT009-03 Verification

## Basis
- Classic task acceptance plus explicit task-card verification targets from `.memory-bank/tasks/backlog.md`.
- Priority basis used during verify:
- `Verification Targets` from `.memory-bank/tasks/backlog.md`
- `Verify` and `Invariants` from the task card
- `FT-009` acceptance criteria relevant to runtime adapter scope
- Repo-local evidence from `.tasks/TASK-FT009-03/`

## Checks
- Runtime adapter wrappers and centralized event handling:
- Reviewed `frontend/src/shared/telegram/webapp.ts` and `frontend/src/app/app-shell.tsx`.
- Confirmed `AppShell` owns `ready()/expand()` and subscriptions for `themeChanged`, `viewportChanged`, `safeAreaChanged`, `contentSafeAreaChanged`, `activated`, and `deactivated`.
- Confirmed runtime reads stay behind bridge methods, including `getRuntimeSnapshot()`, with no direct `Telegram.WebApp.*` access from app or slice code.

- Shell state transitions and graceful fallback:
- Reviewed `frontend/src/shared/state/ui-shell.ts` and `frontend/src/app/app-shell.tsx`.
- Confirmed nested shell state is merged through `mergeUiShellState()` and that non-Telegram fallback keeps the shell operational while still marking runtime readiness.

- Stable viewport and safe-area CSS sync:
- Reviewed `frontend/src/app/app-shell.tsx` and `frontend/src/shared/styles/webview-shell.css`.
- Confirmed shell emits `--tg-viewport-stable-height` and Telegram safe-area CSS variables.
- Confirmed page baseline uses `var(--tg-viewport-stable-height, 100vh)` and Telegram content safe-area variables instead of `env(safe-area-inset-*)`.

## Commands
- `npx jest --config jest.config.cjs frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/ui-shell.spec.ts frontend/src/tests/app/app-shell.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- `npx tsc -p tsconfig.jest.json --noEmit`
- grep pattern `Telegram\.WebApp\.` under `frontend/src`

## Evidence
- PASS: focused Jest suite passed with `4` suites and `14` tests.
- PASS: TypeScript gate `tsconfig.jest.json` completed without diagnostics.
- PASS: grep for `Telegram.WebApp.` under `frontend/src` returned no matches, confirming the no-direct-access invariant outside the shared bridge layer.
- Evidence summary is also recorded in `.tasks/TASK-FT009-03/TASK-FT009-03-S-IMPL-final-report-code-01.md`.

## Scope Notes
- This verify closes only the runtime adapter scope for `TASK-FT009-03`.
- Real Telegram client-matrix evidence remains outside this task and is still deferred to later `FT-009` verification work.

## Verdict
- PASS
