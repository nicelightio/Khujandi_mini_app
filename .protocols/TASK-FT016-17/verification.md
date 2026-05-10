---
description: Verification report for TASK-FT016-17 legacy direct assignment isolation.
status: active
---
# TASK-FT016-17 Verification

## Verdict

FAIL

## Scope Verified

- Owning slice: `delivery-assignment`.
- Contours: `backend`, `admin-web`.
- Touched layers: `application`, `presentation`, `ui/app`, focused tests and task docs.
- Shared extraction: not added and not justified.

## Acceptance Evidence

- Normal admin-web manual assignment API usage calls `POST /api/v1/admin/orders/:orderId/assignment-offers`, not the legacy direct assignment endpoint.
- Mounted legacy normal endpoint `POST /api/v1/admin/orders/:id/assignment` is disabled with `410 LEGACY_ASSIGNMENT_DISABLED` and does not mutate the order.
- Explicit direct assignment is retained only as `POST /api/v1/admin/orders/:id/assignment-override`.
- Override requires `confirmDirectAssignmentOverride: true`, normalizes `manager` to operator capability at the route boundary, and persists delivery-assignment audit action `override_assigned`.
- Existing v1-style assigned order readability is preserved through the operator delivery read model when orders are already assigned.
- No evidence of mass order/audit/event rewrite, `AssignmentOffer` schema change, offer/claim/timeout/operator-completion semantic change, pickup/completion change, cancellation/refund change, broad admin rebuild, or shared extraction was found in the scoped diff.

## Blocking Issue

- `npm run test:delivery-tracking -- --runInBand` fails because `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts:189` and `tests/slices/delivery-tracking/delivery-tracking.runtime.spec.ts:472` still use the old normal `POST /api/v1/admin/orders/:id/assignment` endpoint as runtime setup and expect `200`. After this task, that endpoint correctly returns `410 LEGACY_ASSIGNMENT_DISABLED`, so the repo-local delivery-tracking gate is now stale/failing.
- Minimal fix recommendation: update the delivery-tracking runtime setup to use the v2 offer+claim path for newly assigned test orders, or seed/read an already-assigned v1 order when the test is specifically proving existing active order readability. Use `/assignment-override` only when the test explicitly verifies emergency override behavior and include `confirmDirectAssignmentOverride: true`.

## Commands

- `npm run test:delivery-assignment -- --runInBand` - PASS; 5 suites / 54 tests passed.
- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-assignment-api.spec.ts frontend/src/tests/admin/admin-assignment-view-model.spec.ts frontend/src/tests/admin/admin-assignment-route.spec.tsx --runInBand` - PASS; 3 suites / 23 tests passed.
- `git diff --check` - PASS.
- Changed markdown local link validation - PASS; the only changed markdown local link target exists.
- Additional compatibility smoke: `npm run test:delivery-tracking -- --runInBand` - FAIL; 1 suite failed / 2 tests failed due stale `/assignment` setup expectations receiving `410` instead of `200`.

## Risks / Notes

- The implementation behavior appears aligned with `TASK-FT016-17` acceptance, but the task cannot be marked PASS while an existing repo-local delivery-tracking gate still expects the removed normal direct assignment path.
- Historical v1 events/audits/orders were not rewritten by this verification.
