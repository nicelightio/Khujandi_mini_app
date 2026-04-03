# TASK-FT004-02 Context

## Task
- `TASK-FT004-02`
- Scope: scaffold backend `delivery-assignment` slice and persistence/test baseline only.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT004-02` card)
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
- `doc/DATA_MODEL.md` (`order_status_history`, `events`)
- `doc/API_GUIDELINES.md` (`/events` contract)

## Normative inputs found
- Backlog card richer fields exist: `Touched files`, `Tests`, `Verify`, `Docs`, `Constraints`.
- Feature doc defines acceptance criteria and scope boundary.
- IMPL plan adds persistence/runtime constraints and expected touched files.

## Existing code patterns inspected
- `backend/src/slices/catalog/**/*`
- `backend/src/slices/checkout-payment/**/*`
- `backend/src/shared/db/prisma-client.ts`
- `backend/src/shared/errors/app-error.ts`
- `backend/src/shared/testing/create-test-context.ts`
- `tests/slices/catalog/**/*`
- `tests/slices/checkout-payment/**/*`
- `jest.config.cjs`
- `package.json`

## Key constraints
- Keep `CREATED -> ASSIGNED` ownership inside `delivery-assignment`.
- Do not move assignment business rules to `shared`.
- Deliver scaffold/baseline only; no full command implementation or notification integration in this task.
- Keep docs/status sync consistent after code changes.
