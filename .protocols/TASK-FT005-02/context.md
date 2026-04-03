# TASK-FT005-02 Context

## Task
- `TASK-FT005-02`
- Scope: scaffold backend `delivery-tracking` slice and persistence/test baseline only.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT005-02` card)
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/invariants.md`
- `.tasks/TASK-FT005-01/TASK-FT005-01-S-IMPL-final-report-docs-01.md`

## Normative inputs found
- `FT-005` keeps ownership of post-assignment lifecycle semantics inside the slice; shared transport stays transport-only.
- `TASK-FT005-02` is scaffold-only and must not close full state-machine or polling runtime behavior.
- `REQ-010` remains outside this task and still needs a separate SLA verification wave.

## Existing code patterns inspected
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/slices/checkout-payment/**/*`
- `backend/src/shared/errors/app-error.ts`
- `backend/src/shared/testing/create-test-context.ts`
- `backend/prisma/schema.prisma`
- `tests/slices/delivery-assignment/**/*`
- `jest.config.cjs`
- `package.json`

## Key constraints
- Keep lifecycle ownership inside `delivery-tracking`; do not move status-machine rules into `shared`.
- Reuse existing `orders`, `order_status_history`, and `events` persistence baseline instead of inventing new shared abstractions.
- Deliver execution-ready backend wiring and test harness only; full courier auth/state validation and full polling API semantics stay with later `FT-005` tasks.
