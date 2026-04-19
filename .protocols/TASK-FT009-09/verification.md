---
description: Верификация TASK-FT009-09.
status: active
---
# TASK-FT009-09 Verification

## Planned checks

- `npm run lint`
- `npx jest --config jest.config.cjs frontend/src/tests/app/app-shell.spec.tsx frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/ui-shell.spec.ts frontend/src/tests/shared/ui/page-shell.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`

## Executed checks

- `PASS`: `npm run lint`
- `PASS`: `npx jest --config jest.config.cjs frontend/src/tests/app/app-shell.spec.tsx frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/ui-shell.spec.ts frontend/src/tests/shared/ui/page-shell.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`

## Acceptance mapping

- Backlog verify focus `reconcile whether degraded clients keep a conservative shell-owned bottom-action primitive`: `PASS` via targeted shell/runtime/page/checkout coverage proving degraded Telegram runtime keeps the shell-owned `keyboard-safe` CTA layout.
- Backlog verify target `predictable fallback/degradation behavior`: `PASS` via repeated `npm run lint` plus focused Jest coverage proving enhanced-vs-minimal policy remains centralized while critical CTA reachability is preserved in repo-local paths.
- Backlog verify target `Android Telegram notes explicitly confirm reachable bottom CTA with keyboard open, predictable fallback/degradation behavior, and no obvious shell regression`: `FAIL` for current `/verify`, because `.tasks/TASK-FT009-09/android-notes.md` still contains only pending placeholders and no fresh real-device operator evidence.

## Verdict

- FAIL

## Notes

- Repo-local deterministic basis is green: `npm run lint` and the focused Jest suite passed again during this verify step.
- Overall `/verify` cannot return `PASS` because `FT-009` and `REQ-023` make fresh Android Telegram operator-confirmed evidence a blocking artifact for closure.
