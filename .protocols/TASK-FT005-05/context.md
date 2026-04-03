---
description: Execution context for TASK-FT005-05.
status: active
---
# TASK-FT005-05 Context

## Task
- TASK-ID: `TASK-FT005-05`
- Title: `Implement ordered events polling with string cursors and duplicate-safe semantics`
- Feature: `FT-005`
- REQs: `REQ-009`, `REQ-018`

## Loaded sources
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`
- `.tasks/TASK-FT005-01/TASK-FT005-01-S-IMPL-final-report-docs-01.md`
- `.tasks/TASK-FT005-02/TASK-FT005-02-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-04/TASK-FT005-04-S-IMPL-final-report-code-01.md`

## Normative inputs found
- `GET /events?since=<cursor>` must return events ordered by ascending `revision`.
- `since`, `revision`, and `next_cursor` remain string-only opaque values at the API boundary.
- Empty-window and duplicate polling requests must stay duplicate-safe and must not create domain side effects.
- Event shape must remain stable for future SSE/WS migration.

## Scope interpretation
- Implement only the ordered polling read path in the owning `delivery-tracking` slice.
- Preserve string cursor behavior and stable event ordering for repeated polling requests.
- Keep the read path side-effect free; no extra writes, history, or event publication on polling.
- Do not implement notification wiring, frontend runtime integration, or `REQ-010` SLA closure.

## Code patterns inspected
- `backend/src/slices/delivery-tracking/domain/delivery-tracking.types.ts`
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
- `backend/src/slices/delivery-tracking/infrastructure/prisma-delivery-tracking.repository.ts`
- `backend/src/slices/delivery-tracking/presentation/delivery-tracking.controller.ts`
- `tests/slices/delivery-tracking/delivery-tracking.unit.spec.ts`
- `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts`
