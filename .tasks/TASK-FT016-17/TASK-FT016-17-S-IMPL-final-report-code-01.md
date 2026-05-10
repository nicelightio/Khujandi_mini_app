---
description: Final implementation report for TASK-FT016-17 legacy direct assignment isolation.
status: active
---
# TASK-FT016-17 Final Report

## Summary

Implemented legacy direct assignment isolation for `delivery-assignment`.

Normal operator/admin assignment usage remains the v2 offer path:

- admin-web API/UI uses `POST /api/v1/admin/orders/:id/assignment-offers`;
- the old normal direct `POST /api/v1/admin/orders/:id/assignment` endpoint now returns `LEGACY_ASSIGNMENT_DISABLED` and does not mutate the order;
- direct assignment is retained only as `POST /api/v1/admin/orders/:id/assignment-override`.

The override path requires `confirmDirectAssignmentOverride: true`, accepts operator/admin capability through the existing route-boundary role normalization, and persists assignment audit with distinct action `override_assigned`.

## Files Changed

- `backend/src/dev-runtime/routes/admin-order-operations.routes.ts`
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-assignment/domain/delivery-assignment.types.ts`
- `backend/src/slices/delivery-assignment/infrastructure/prisma-delivery-assignment.repository.ts`
- `backend/src/slices/delivery-assignment/presentation/delivery-assignment.controller.ts`
- `tests/slices/delivery-assignment/delivery-assignment.runtime.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.unit.spec.ts`
- `tests/slices/delivery-assignment/delivery-assignment.integration.spec.ts`
- `.protocols/TASK-FT016-17/*`
- `.memory-bank/tasks/backlog.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.memory-bank/changelog.md`

## Checks

- `npm run test:delivery-assignment -- --runInBand` - PASS
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx --runInBand` - PASS
- `git diff --check` - PASS

## Residual Risks

- The override still publishes `order.assigned` because it performs a real direct assignment for emergency/manual recovery. It is isolated by route name, confirmation and `override_assigned` audit action, but downstream consumers still see the order lifecycle as assigned.
- No historical v1 orders, audits, events or statuses were rewritten.
