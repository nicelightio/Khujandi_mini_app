---
description: Контекст выполнения TASK-FT008-02.
status: active
---
# TASK-FT008-02 Context

## Task
- TASK-ID: `TASK-FT008-02`
- Title: `Scaffold backend reviews-feedback slice and persistence/test baseline`
- Feature: `FT-008`
- REQs: `REQ-013`, `REQ-014`

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-004-reviews-and-alerts.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/tasks/plans/IMPL-FT-008.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`
- `doc/API_GUIDELINES.md`
- `doc/DATA_MODEL.md`

## Normative inputs found
- `REQ-013` requires a two-sided Telegram-bot review flow that activates only after `COMPLETED`.
- `REQ-014` requires low ratings (`<= 2`) to publish `review.negative`, but alert runtime ownership stays for later tasks.
- `FT-008` and `IMPL-FT-008` assign persistence ownership to the `reviews-feedback` slice and explicitly keep review semantics out of `shared`.
- `data-boundaries-and-persistence` defines `reviews` as slice-owned persistence, while `events-polling-and-bot-runtime` keeps `review.created` and `review.negative` semantics inside the same slice.

## Scope focus
- Add minimal backend scaffold for `reviews-feedback` under domain/application/infrastructure/presentation.
- Extend Prisma with a canonical `reviews` persistence baseline and uniqueness/indexing that future duplicate-safe review submission can reuse.
- Add repo-local Jest unit/integration baseline with execution-ready TODO coverage for completed-order gating, structured persistence, duplicate guard, and negative alert publication.

## Fallback used
- Richer task-card fields were present in backlog and `IMPL-FT-008`, so no fallback beyond feature + requirements + normative docs was required.

## Code areas inspected
- `backend/prisma/schema.prisma`
- `backend/src/slices/delivery-assignment/**/*`
- `backend/src/slices/order-cancellation/**/*`
- `backend/src/shared/testing/create-test-context.ts`
- `tests/slices/delivery-assignment/**/*`
- `tests/slices/order-cancellation/**/*`
- `package.json`
- `jest.config.cjs`
