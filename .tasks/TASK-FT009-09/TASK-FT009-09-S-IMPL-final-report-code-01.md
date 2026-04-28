---
description: Implementation report for TASK-FT009-09.
status: active
---
# TASK-FT009-09 Implementation Report

## Scope delivered

- Narrowed the Telegram runtime capability semantics so degraded Telegram clients still report `supportsKeyboardSafeBottomActions: true` even when enhanced shell capabilities are unavailable.
- Preserved the centralized `enhanced` vs `minimal` shell degradation policy while ensuring the shared bottom CTA path stays `keyboard-safe` on degraded Telegram runtime paths instead of falling back to `inline`.
- Updated focused app/shared/checkout tests to lock in that conservative shell behavior.

## Verification evidence

- `npm run lint`
- `npx jest --config jest.config.cjs frontend/src/tests/app/app-shell.spec.tsx frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/ui-shell.spec.ts frontend/src/tests/shared/ui/page-shell.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`

## Remaining follow-up

- Fresh real Android Telegram notes are now advisory pre-release evidence for the task's explicit keyboard-open verify target.
