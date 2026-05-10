---
description: Final implementation report for TASK-FT016-15 operator/admin status control.
status: active
---
# TASK-FT016-15 Final Report

## Scope

- Owning slice: `delivery-tracking`.
- Contours: `backend`, `admin-web`.
- Touched layers: application, presentation/runtime route, admin UI/API/model, focused tests, operational docs.
- Shared extraction: none.

## Implementation Summary

- Added a separate operator/admin status command in `delivery-tracking` so courier status writes remain courier-only while operator/admin can execute only the next allowed transition.
- Mounted `POST /api/v1/admin/operator/delivery/orders/:orderId/status` in the protected admin runtime.
- Enabled operator/admin transitions `ASSIGNED -> PICKED_UP -> IN_PROGRESS -> DELIVERED -> COMPLETED`; broad skip/regression/replay/terminal attempts still return `409 CONFLICT`.
- Captured actor role/name in status-change event payloads and runtime operator read-model history rows.
- Added admin-web confirmation-backed status control action for allowed transitions, including `DELIVERED -> COMPLETED`.
- Kept targeted offer, broadcast offer, bot chat, cancellation/refund, assignment claim/timeout, and courier bot completion out of scope.

## Tests / Checks

- `npm run test:delivery-tracking -- --runInBand` - PASS.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx frontend/src/tests/admin/admin-assignment-view-model.spec.ts --runInBand` - PASS.
- `npm run build:frontend` - PASS.
- `git diff --check` - PASS.
- Changed markdown local link validation - not applicable; no markdown links were added.

## Residual Risks

- Admin actor display name currently uses the runtime admin account id unless a richer admin identity read is added later.
- `TASK-FT016-16` still needs polling-consumer UI alignment for v2 `PICKED_UP`/`DELAYED`/operator completion events.
- Repository was already broadly dirty from prior FT-016 autonomous tasks; unrelated drift was not reverted or normalized.
