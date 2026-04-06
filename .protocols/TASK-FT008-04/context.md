---
description: Контекст выполнения TASK-FT008-04.
status: active
---
# TASK-FT008-04 Context

## Task
- TASK-ID: `TASK-FT008-04`
- Title: `Implement completed-only review submission, structured payload persistence and duplicate guard`
- Feature: `FT-008`
- REQs: `REQ-013`

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
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`

## Normative inputs found
- Review write-path разрешен только после `COMPLETED`; незавершенные и terminal non-completed статусы не принимают review.
- Structured payload MVP ограничен `rating`, `reason_code`, `comment(optional)` и явным `order/direction` context.
- Duplicate/replay bot delivery не должен создавать второй review write; uniqueness и transport replay protection должны short-circuit'ить повтор.
- `TASK-FT008-04` закрывает только submission/persistence/idempotency path для `REQ-013`; `review.negative` runtime fan-out остается в `TASK-FT008-05`.

## Scope focus
- Добавить server-side submit command в `reviews-feedback` slice.
- Провалидировать actor/direction ownership, `COMPLETED` gate, required `rating/reason_code`, optional `comment`.
- Сохранить structured review ровно один раз и вернуть persisted result при duplicate unique-pair replay.

## Fallback used
- Richer fields присутствуют в backlog card (`Verification Targets`, `Invariants`) и `IMPL-FT-008`, поэтому fallback beyond feature + requirements + normative docs не потребовался.

## Code areas inspected
- `backend/prisma/schema.prisma`
- `backend/src/slices/reviews-feedback/domain/reviews-feedback.types.ts`
- `backend/src/slices/reviews-feedback/application/reviews-feedback.service.ts`
- `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`
- `backend/src/slices/reviews-feedback/presentation/reviews-feedback.controller.ts`
- `backend/src/slices/delivery-tracking/application/delivery-tracking.service.ts`
- `backend/src/slices/order-cancellation/application/order-cancellation.service.ts`
- `tests/slices/reviews-feedback/reviews-feedback.unit.spec.ts`
- `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts`
