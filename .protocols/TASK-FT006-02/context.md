# TASK-FT006-02 Context

## Task
- `TASK-FT006-02`
- Scope: scaffold backend `order-cancellation` slice and refund persistence/test baseline only.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT006-02` card)
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.tasks/TASK-FT006-01/TASK-FT006-01-S-IMPL-final-report-docs-01.md`

## Normative inputs found
- `TASK-FT006-02` is scaffold-only: it must prepare owning backend persistence and tests without claiming full cancellation/refund runtime closure.
- Cancellation actor/reason and refund-state ownership must stay inside `order-cancellation`; no premature shared business abstractions.
- Cancelled paid orders must have explicit refund tracking state, while final verification of `PENDING_MANUAL -> DONE/REJECTED` remains for later tasks.

## Existing code patterns inspected
- `backend/prisma/schema.prisma`
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/slices/delivery-tracking/**/*`
- `backend/src/slices/checkout-payment/**/*`
- `backend/src/shared/errors/app-error.ts`
- `backend/src/shared/testing/create-test-context.ts`
- `tests/slices/delivery-assignment/**/*`
- `tests/slices/delivery-tracking/**/*`
- `jest.config.cjs`
- `package.json`

## Key constraints
- Keep cancellation/refund semantics inside the new slice; shared layers may only provide transport/testing primitives.
- Reuse existing `orders`, `order_status_history`, and `events` persistence baseline while adding explicit cancellation/refund ownership fields.
- Leave auth/RBAC validation, allowed-state enforcement, and final refund workflow closure to later `FT-006` tasks.
