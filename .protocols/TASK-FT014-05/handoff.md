---
description: Handoff notes for TASK-FT014-05.
status: active
---
# TASK-FT014-05 Handoff

## Summary
- Hardened `frontend/src/slices/order-tracking/model/order-tracking-view-model.ts` so stale duplicate/out-of-order lifecycle regressions are ignored for display, while terminal states remain terminal and cursor progress is preserved.
- Hardened `frontend/src/slices/order-tracking/hooks/use-order-tracking-view-model.ts` so lifecycle cleanup resets stale in-flight polling before resume.
- Added focused coverage in `frontend/src/tests/slices/order-tracking/order-tracking-view-model.spec.ts` and `frontend/src/tests/slices/order-tracking/order-tracking-route.spec.tsx`.
- Verified with focused order-tracking Jest, `npm run lint`, and `npm run build:frontend`.

## Follow-up
- `TASK-FT014-06` remains blocked until upstream fresh Android Telegram checkout evidence exists; it owns final paid-order-to-status e2e/docs closure for `REQ-033`.
