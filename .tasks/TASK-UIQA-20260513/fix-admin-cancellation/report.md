# Fix Admin Cancellation Seed Target Report

## Scope

- ROLE: SUBAGENT / implementer.
- Owning slice: `order-cancellation`.
- Owning contour: `admin-web`.
- Touched layers: admin-web presentation/tests; staging/dev-runtime seed; focused runtime tests.
- Shared extraction: not justified. The change is route/query state wiring plus deterministic staging data.

## Result

- `/admin/orders/cancellation` can now receive an explicit target order id via query:
  - `?orderId=test-order-cancellable-3001`
  - `?order_id=test-order-cancellable-3001`
- The cancellation route trims and stores the explicit id in its existing bootstrap/UI state, then uses that id for the existing cancellation and refund submit commands.
- The old demo fallback remains `order-in-progress-2004` for direct route opens without an explicit id.
- `operator_orders` / `delivery_happy_path` staging seed now includes paid cancellable order `test-order-cancellable-3001` in `IN_PROGRESS` with status history.
- Focused tests cover query routing, explicit order-id command targeting, staging seed presence/history, and cancellation/refund runtime success for `test-order-cancellable-3001`.

## Files Changed

- `frontend/src/admin/app/router.tsx`
- `frontend/src/admin/routes/admin-order-cancellation-route.tsx`
- `frontend/src/tests/admin/admin-router.spec.tsx`
- `frontend/src/tests/admin/admin-order-cancellation-route.spec.tsx`
- `backend/src/dev-runtime/staging-test-harness.ts`
- `tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts`
- `tests/slices/order-cancellation/order-cancellation.runtime.spec.ts`

## Checks

- `npx jest --config jest.config.cjs frontend/src/tests/admin/admin-order-cancellation-route.spec.tsx frontend/src/tests/admin/admin-router.spec.tsx tests/slices/order-cancellation/order-cancellation.runtime.spec.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts --runInBand` PASS.
- `npx eslint frontend/src/admin/app/router.tsx frontend/src/admin/routes/admin-order-cancellation-route.tsx frontend/src/tests/admin/admin-order-cancellation-route.spec.tsx frontend/src/tests/admin/admin-router.spec.tsx backend/src/dev-runtime/staging-test-harness.ts tests/slices/checkout-payment/checkout-payment.runtime-test-state.spec.ts tests/slices/order-cancellation/order-cancellation.runtime.spec.ts` PASS.
- `git diff --check` PASS.
- `npm run build:frontend` PASS.

## Notes And Risks

- This does not redesign the cancellation workflow and does not add a read/bootstrap API for arbitrary orders.
- The visible status label for an explicit id remains the existing minimal bootstrap assumption (`IN_PROGRESS`); the seeded QA target matches that state.
- `admin_boss` fixed persona currently has `boss` session role. Cancellation command policy still accepts `admin` or `courier` for cancellation, while refund update accepts `boss|manager|admin`. This report does not change that auth policy; the seeded runtime cancellation test uses an `ADMIN` admin session.
