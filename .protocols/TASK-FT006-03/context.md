# TASK-FT006-03 Context

## Task
- `TASK-FT006-03`
- Scope: scaffold operator cancellation/refund route shell and frontend test harness only.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT006-03` card)
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/invariants.md`
- `.tasks/TASK-FT006-01/TASK-FT006-01-S-IMPL-final-report-docs-01.md`

## Normative inputs found
- `TASK-FT006-03` is scaffold-only: it must prepare admin-web route/page coverage for cancellation and refund-state visibility without claiming runtime cancellation/refund closure.
- `REQ-011` and `FT-006` keep cancellation authority on the server side; frontend scope here must not duplicate auth/session or allowed-role enforcement.
- `REQ-012` requires visible refund tracking state, so the shell must already render explicit refund-state information even before backend wiring lands.

## Existing code patterns inspected
- `frontend/src/admin/**/*`
- `frontend/src/tests/admin/**/*`
- `package.json`
- `jest.config.cjs`

## Key constraints
- Keep admin-web as a separate contour; do not fold `FT-006` UI into Mini App slices.
- Do not pull `FT-007` auth/session implementation into this task; use fixture or existing boundary placeholders only.
- Keep backend command wiring and refund persistence behavior for later `TASK-FT006-04`..`TASK-FT006-06`.
