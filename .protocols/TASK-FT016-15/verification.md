---
description: Verification report for TASK-FT016-15 operator/admin status control.
status: active
---
# TASK-FT016-15 Verification

## Verdict

FAIL

## Evidence

- PASS: backend command is narrow for recognized delivery-tracking actors. `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts:28` defines only adjacent operator transitions and includes `DELIVERED -> COMPLETED`; `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts:159` rejects non-next transitions with `409`.
- PASS: courier completion regression remains covered. `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts:22` leaves courier-owned transitions at `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED`, and tests cover courier `DELIVERED -> COMPLETED` rejection.
- PASS: admin-web confirmation action exists before write. `frontend/src/admin/routes/admin-assignment-route.tsx:229` calls injected/window confirmation before `updateOperatorOrderStatus`, and `frontend/src/admin/components/admin-assignment-page.tsx:152` routes status action clicks through that confirmation handler.
- PASS: no broad arbitrary status override found in the delivery-tracking service; invalid skip/regression/replay/terminal attempts are rejected before persistence.
- FAIL: the mounted API does not support the real operator role used by admin access. `FT-016` states that "`operator` is the manager role" in `.memory-bank/features/FT-016-operator-orders-monitoring-and-courier-offer-flow.md:14`. Admin access exposes roles `boss|manager|admin` in `backend/src/slices/admin-access/domain/admin-access.types.ts:4`. The runtime route passes `session.role` directly as the delivery-tracking actor role in `backend/src/dev-runtime/routes/admin-order-operations.routes.ts:63`, but `DeliveryTrackingService` allows only literal `operator` and `admin` in `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts:15` and rejects anything else at `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts:149`. Result: an authenticated `manager` operator gets `403` instead of being able to execute allowed next transitions.

## Commands

- `npm run test:delivery-tracking -- --runInBand` - PASS.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx frontend/src/tests/admin/admin-assignment-view-model.spec.ts --runInBand` - PASS.
- `npm run build:frontend` - PASS.
- `git diff --check` - PASS.
- Changed markdown local link validation - PASS for the changed local link in `.memory-bank/bugs/index.md`.

## Scope Checks

- No cancellation/refund implementation changes were required by this task; existing cancellation/refund routes remain separate.
- No assignment offer/claim/timeout/auto-offer behavior was accepted as part of this verification.
- No legacy direct assignment cleanup, broad admin rebuild, mass rewrite, customer mutation command or shared business state-machine extraction is accepted by this verification.

## Minimal Fix Recommendation

Normalize admin-access `manager` to delivery-tracking operator capability at the admin operator status route or service boundary, and add focused runtime coverage proving a `manager` account can close `DELIVERED -> COMPLETED` while non-operator roles remain rejected. Keep the transition matrix adjacent-only and do not touch assignment, cancellation, refund, timeout, auto-offer or legacy direct assignment behavior.
