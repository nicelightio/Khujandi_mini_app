# TASK-FT006-04 Verification

## Verification basis
- Task card: `.memory-bank/tasks/backlog.md` (`TASK-FT006-04`)
- Feature boundary: `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md` lines `17-25`, `38-42`, `57-60`
- Normative lifecycle and contract: `.memory-bank/states/order-lifecycle.md` lines `16-27`, `.memory-bank/contracts/api-events-baseline.md` lines `29-39`
- Testing policy: `.memory-bank/testing/index.md` lines `27-28`, `33-39`

## Verification targets
- Backend cancellation command allows only `admin` and assigned `courier` per documented state/role policy.
- Successful cancellation persists order status, cancellation actor/reason, `refund_status`, history, audit, and canonical `order.cancelled` event.
- Forbidden or invalid attempts return the controlled `AppError` contract and do not create persistence side effects.
- Repo-local unit, integration, and Jest TypeScript gates pass for the owned backend slice scope.

## Checks

### 1. Allowed-role and allowed-state command policy
- What was checked:
  - `backend/src/slices/order-cancellation/application/order-cancellation.service.ts` restricts cancellation to authenticated `admin` or `courier` actors only.
  - Admin path allows only `CREATED`, `ASSIGNED`, `IN_PROGRESS` and maps to `CANCELLED_BY_ADMIN`.
  - Courier path allows only `ASSIGNED`, `IN_PROGRESS`, requires assignment ownership, and enforces reason `COURIER_UNAVAILABLE` before mapping to `CANCELLED_BY_COURIER_UNAVAILABLE`.
- Evidence:
  - Code: `backend/src/slices/order-cancellation/application/order-cancellation.service.ts`
  - Tests: `tests/slices/order-cancellation/order-cancellation.unit.spec.ts`, `tests/slices/order-cancellation/order-cancellation.integration.spec.ts`

### 2. Successful cancellation persistence and canonical side effects
- What was checked:
  - `backend/src/slices/order-cancellation/infrastructure/prisma-order-cancellation.repository.ts` writes the cancelled order fields, `order_status_history`, cancellation audit, and canonical `order.cancelled` event in one transactional flow.
  - Paid cancellations persist `refundStatus = PENDING_MANUAL`; non-paid cancellations persist `refundStatus = NOT_REQUIRED`.
  - Command result returns polling-friendly `updatedAt` and string `revision` derived from the event id.
- Evidence:
  - Code: `backend/src/slices/order-cancellation/application/order-cancellation.service.ts`, `backend/src/slices/order-cancellation/infrastructure/prisma-order-cancellation.repository.ts`
  - Tests: integration specs asserting `order.update`, `orderStatusHistory.create`, `orderCancellationAudit.create`, and `event.create`

### 3. Controlled failures stay side-effect free
- What was checked:
  - Forbidden `client` role is rejected before lookup/persistence.
  - Invalid order states return `AppError("CONFLICT", ...)` and serialize through `toPayload()` into the project error contract.
  - Courier cancellation with a non-unavailable reason is rejected without writes.
- Evidence:
  - Code: `backend/src/slices/order-cancellation/application/order-cancellation.service.ts`, `backend/src/shared/errors/app-error.ts`
  - Tests: `tests/slices/order-cancellation/order-cancellation.unit.spec.ts`, `tests/slices/order-cancellation/order-cancellation.integration.spec.ts`

### 4. Repo-local gates
- Commands:
  - `npm run test:order-cancellation:unit`
  - `npm run test:order-cancellation:integration`
  - `npx tsc -p tsconfig.jest.json --noEmit`
- Result:
  - PASS: unit suite passed (`1` suite, `5` tests).
  - PASS: integration suite passed (`1` suite, `5` tests).
  - PASS: TypeScript check completed without diagnostics.
- Evidence:
  - Command output from current verify run.

## Verdict
- `VERDICT: PASS`

## Notes
- Verify scope is intentionally limited to `TASK-FT006-04` backend command ownership.
- This verify does not close full `FT-006`: manual refund progression, admin-web runtime wiring, functional e2e closure, and final refund outcome evidence remain with `TASK-FT006-05`..`TASK-FT006-08`.
