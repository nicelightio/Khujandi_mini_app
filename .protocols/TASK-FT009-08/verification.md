---
description: Верификация TASK-FT009-08.
status: active
---
# TASK-FT009-08 Verification

## Executed checks

- `npm run lint`
- `npx jest --config jest.config.cjs frontend/src/tests/app/app-shell.spec.tsx frontend/src/tests/shared/telegram/webapp.spec.ts frontend/src/tests/shared/state/ui-shell.spec.ts frontend/src/tests/shared/ui/page-shell.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-page.spec.tsx frontend/src/tests/slices/checkout-payment/checkout-payment-route.spec.tsx`

## Acceptance mapping

- Backlog verify target `shell owns one minimal degradation policy for weak-device/old-client runtime paths`: PASS via bridge capability derivation coverage plus `AppShell` runtime smoke for both enhanced and degraded paths.
- Backlog verify target `optional visual enhancements no longer rely on ad hoc feature-level decisions`: PASS via `PageShell` and checkout smoke proving bottom-action layout/effect behavior now flows from centralized shell policy.
- `FT-009` / contract subset for `isVersionAtLeast()`-guarded graceful fallback and shell-owned bottom-action policy: PASS in repo-local deterministic scope.

## Verdict

- PASS

## Notes

- Richer task inputs came from the backlog card plus FT-009 contract/architecture/testing docs.
- Fresh verify rerun completed on 2026-04-20 with the commands above.
- Real Android Telegram evidence remains with follow-up closure task `TASK-FT009-09`.
