# TASK-FT004-03 Context

## Task
- `TASK-FT004-03`
- Scope: scaffold admin assignment route shell and frontend test harness only.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT004-03` card)
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/tasks/plans/IMPL-FT-004.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`

## Normative inputs found
- `FT-004` keeps ownership only over `CREATED -> ASSIGNED` and the assignment notification boundary.
- `TASK-FT004-03` must add only admin-web route shell plus frontend harness; login/session stays in `FT-007`.
- `admin-web` is a separate contour and should not be collapsed into the `mini-app` shell/runtime ownership.

## Existing code patterns inspected
- `frontend/src/app/router.tsx`
- `frontend/src/shared/ui/page-shell.tsx`
- `frontend/src/slices/checkout-payment/**/*`
- `frontend/src/tests/app/**/*`
- `frontend/src/tests/slices/checkout-payment/**/*`
- `jest.config.cjs`
- `package.json`

## Key constraints
- Do not pull `FT-007` auth/session implementation into `FT-004` frontend scope.
- Keep admin assignment scaffold minimal and fixture-driven until backend command wiring lands in later tasks.
- Add repo-local frontend smoke coverage for route resolution, form state, and success/error rendering.
