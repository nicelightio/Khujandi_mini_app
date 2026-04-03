# TASK-FT004-04 Context

## Task
- `TASK-FT004-04`
- Scope: implement only the backend assignment command endpoint with auth/RBAC, state validation, audit/history writes, and canonical `order.assigned` publication.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT004-04` card)
- `.memory-bank/features/FT-004-courier-assignment.md`
- `.memory-bank/tasks/plans/IMPL-FT-004.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.tasks/TASK-FT004-01/TASK-FT004-01-S-IMPL-final-report-docs-01.md`
- `.tasks/TASK-FT004-02/TASK-FT004-02-S-IMPL-final-report-code-01.md`

## Normative inputs found
- `FT-004` owns only the `CREATED -> ASSIGNED` transition and canonical `order.assigned` semantics.
- Successful assignment must update the order, write `order_status_history`, write assignment audit, publish `order.assigned`, and return polling-friendly `updated_at` plus string `revision`.
- Invalid auth/RBAC, invalid order state, and invalid courier target must return the controlled error contract and must not create side effects.
- Bot notification transport is out of scope for this task; only the domain event publication boundary is required here.

## Fallback / scope notes
- No richer task-specific contract beyond the backlog card and `FT-004` docs was found for exact admin-role expansion, so implementation should stay minimal and scoped to the explicit assignment boundary.

## Existing code patterns inspected
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/shared/errors/app-error.ts`
- `backend/src/slices/catalog/**/*`
- `backend/src/slices/checkout-payment/**/*`
- `tests/slices/delivery-assignment/**/*`

## Key constraints
- Keep assignment business rules inside `delivery-assignment`; do not move them into `shared`.
- Preserve the controlled project error contract through `AppError`.
- Avoid notification/runtime side effects on invalid requests.
