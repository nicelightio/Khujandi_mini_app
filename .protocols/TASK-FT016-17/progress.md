---
description: Progress log for TASK-FT016-17 legacy direct assignment isolation.
status: active
---
# TASK-FT016-17 Progress

## 2026-05-09

- Created task protocol.
- Completed required spec and review-gate reading.
- Recorded owning slice, contours, touched layers and shared justification before code edits.
- Disabled normal legacy `POST /api/v1/admin/orders/:id/assignment` usage with `LEGACY_ASSIGNMENT_DISABLED`.
- Retained direct assignment only as `POST /api/v1/admin/orders/:id/assignment-override` with `confirmDirectAssignmentOverride: true`.
- Added distinct `override_assigned` audit action for override persistence.
- Added focused delivery-assignment runtime/unit/integration coverage and confirmed existing admin assignment API/route/model tests still use pending offers as normal path.
- Checks passed so far:
  - `npm run test:delivery-assignment -- --runInBand`
  - `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx --runInBand`
  - `git diff --check`
