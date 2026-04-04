# TASK-FT006-04 Context

## Task
- `TASK-FT006-04`
- Scope: implement only the backend authorized cancellation command with auth/RBAC, state validation, cancellation actor/reason persistence, and audit/event writes inside the owning `order-cancellation` slice.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT006-04` card)
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/invariants.md`
- `.tasks/TASK-FT006-01/TASK-FT006-01-S-IMPL-final-report-docs-01.md`
- `.tasks/TASK-FT006-02/TASK-FT006-02-S-IMPL-final-report-code-01.md`
- `.protocols/TASK-FT004-04/progress.md`
- `.protocols/TASK-FT005-04/progress.md`

## Normative inputs found
- `admin` may cancel only from `CREATED`, `ASSIGNED`, or `IN_PROGRESS`, producing `CANCELLED_BY_ADMIN`.
- `courier` may cancel only from `ASSIGNED` or `IN_PROGRESS`, only for the unavailable-case, producing `CANCELLED_BY_COURIER_UNAVAILABLE`.
- `client` must never cancel, and invalid state/role attempts must return the controlled error contract without write side effects.
- Successful cancellation must stay inside the owning `order-cancellation` slice and write order status, `order_status_history`, audit, and canonical `order.cancelled` event.
- Refund-state visibility must remain explicit on cancellation, but manual refund progression stays out of scope for this task.

## Existing code patterns inspected
- `backend/src/slices/order-cancellation/**/*`
- `tests/slices/order-cancellation/**/*`
- `backend/src/slices/delivery-assignment/application/delivery-assignment.service.ts`
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
- `backend/src/shared/errors/app-error.ts`

## Scope notes
- No richer task-specific contract beyond the backlog card and current `FT-006` docs was found; implementation should stay minimal and command-focused.
- Keep cancellation policy inside `order-cancellation`; do not move actor/state rules into `shared`.
