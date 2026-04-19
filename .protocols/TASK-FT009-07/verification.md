---
description: Верификация TASK-FT009-07.
status: active
---
# TASK-FT009-07 Verification

## Basis

- `TASK-FT009-07` backlog acceptance/verify targets
- `FT-009` acceptance criteria
- `REQ-019`, `REQ-022`

## Planned evidence

- Focused shared UI test for shell-owned bottom action rendering.
- Focused checkout page smoke proving CTA goes through shell-owned layout path.
- Targeted Jest run for shared and checkout specs.

## Executed evidence

- `PASS`: `npx jest --config jest.config.cjs frontend/src/tests/shared/ui/page-shell.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`
- `PASS`: `npx jest --config jest.config.cjs frontend/src/tests/shared frontend/src/tests/slices/checkout-payment`
- `PASS`: `npx eslint frontend/src/shared/ui/page-shell.tsx frontend/src/slices/checkout-payment/components/checkout-payment-page.tsx frontend/src/tests/shared/ui/page-shell.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`

## Acceptance coverage

- Backlog verify target `keyboard-safe bottom CTA remains reachable through shell-owned safe-area-aware layout`: satisfied by the sticky `data-shell-footer-layout="keyboard-safe"` footer path, safe-area-aware shell CSS, and shared `PageShell` coverage.
- Backlog verify target `checkout no longer depends on page-local CTA placement`: satisfied by checkout page migration to `PageShell.bottomAction`, plus page/route smoke asserting the CTA is rendered in `data-shell-bottom-action="visible"`.
- `REQ-019` shell UX subset for shared bottom action primitives: satisfied for this task scope because the customer-facing checkout CTA now renders through the shared shell footer while centralized action-feedback metadata remains intact.
- `REQ-022` shell-owned boundary subset: satisfied for this task scope because the change stays within shared shell/layout ownership and does not introduce JS-readable session persistence or feature-local Telegram transport logic.

## Verdict

- `PASS` for scoped `TASK-FT009-07` implementation and focused verification.
