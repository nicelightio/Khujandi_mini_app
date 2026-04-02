---
description: Verification report for TASK-FT009-06 real Telegram client-matrix closure.
status: active
---
# TASK-FT009-06 Verification Report 01

## Verdict

- `FAIL`

## What passed

- Repo-local `FT-009` shell/runtime Jest suite passed with `7` suites and `26` tests.
- `npx tsc -p tsconfig.jest.json` passed.
- The remaining gap is not a repo-local regression.

## Blocking condition

- The task requires real Telegram client-matrix evidence for iOS, Android, and Desktop/macOS where relevant.
- No `.tasks/TASK-FT009-06/` evidence bundle existed in the workspace.
- The current CLI environment does not provide direct access to real Telegram clients, so the required evidence could not be generated here.

## Required evidence bundle

- iOS Telegram: safe-area, bottom CTA, keyboard/stable viewport, theme change, lifecycle resume, checkout UI.
- Android Telegram: safe-area, bottom CTA, keyboard/stable viewport, theme change, lifecycle resume, checkout UI.
- Telegram Desktop or macOS beta: customer-facing shell/checkout behavior where desktop usage is relevant.
- Operator notes linking each artifact to `REQ-019`, shared `REQ-022`, and `REQ-023` closure.

## Commands executed

- `npx jest --config jest.config.cjs frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/ui-shell.spec.ts frontend/src/tests/app/app-shell.spec.tsx frontend/src/tests/slices/catalog/catalog-page.spec.tsx frontend/src/tests/slices/catalog/catalog-route.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- `npx tsc -p tsconfig.jest.json`

## Next action

- Add the real-client evidence bundle under `.tasks/TASK-FT009-06/`, then rerun docs/RTM sync for final `FT-009` closure.
