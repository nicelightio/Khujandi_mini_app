---
description: Verification failure for TASK-FT009-06 due to missing real Telegram client-matrix evidence for FT-009 closure.
status: active
---
# BUG-2026-04-02 TASK-FT009-06 Missing Telegram Client-Matrix Evidence

## Summary

`TASK-FT009-06` reached the final `FT-009` quality gate, but formal verification still cannot close because the workspace does not contain the required real `Android Telegram` evidence for customer-facing shell/runtime behavior.

## Detection

- Date: `2026-04-02`
- Command: `npx jest --config jest.config.cjs frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/ui-shell.spec.ts frontend/src/tests/app/app-shell.spec.tsx frontend/src/tests/slices/catalog/catalog-page.spec.tsx frontend/src/tests/slices/catalog/catalog-route.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- Command: `npx tsc -p tsconfig.jest.json`
- Verification artifact: `.protocols/TASK-FT009-06/verification.md`

## Evidence

- Repo-local shell/runtime verification passes: `7` suites and `26` tests.
- TypeScript verification for the frontend/Jest surface passes.
- `.tasks/TASK-FT009-06/` does not contain the required screenshots, videos, traces, or operator notes for a real `Android Telegram` run.
- `iOS/Desktop` evidence is no longer treated as blocking for current closure, but may still be added later as optional hardening.
- `.memory-bank/runbooks/telegram-mini-app-verification.md` and `.memory-bank/testing/index.md` require real Android Telegram evidence for final `FT-009` closure.

## Impact

- `TASK-FT009-06` cannot be marked `done`.
- `REQ-019` and the remaining shared `REQ-022` / `REQ-023` shell-runtime closure cannot move to `done`.
- The current `/autopilot` run must stop at a quality-gate blocker until the Android evidence bundle is supplied.

## Suggested fix

- Collect a real Telegram Android evidence bundle under `.tasks/TASK-FT009-06/`.
- Cover at minimum: safe-area and bottom CTA behavior, stable viewport plus keyboard behavior, live theme change, `activated/deactivated` resume, centralized back/swipe policy, and customer-facing checkout UI.
- Re-run `/verify TASK-FT009-06` after the evidence bundle is present.
