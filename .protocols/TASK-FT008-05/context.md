---
description: Контекст выполнения TASK-FT008-05.
status: active
---
# TASK-FT008-05 Context

## Task
- TASK-ID: `TASK-FT008-05`
- Title: `Implement negative alert publication and active-admin Telegram fan-out`
- Feature: `FT-008`
- REQs: `REQ-014`

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
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`

## Normative inputs found
- Low rating `<= 2` после успешного review write обязан публиковать canonical `review.negative`.
- Fan-out для `review.negative` идет только активным администраторам как explicit exception к default actor-targeted delivery.
- Duplicate/replay review delivery не должен повторно создавать negative event или повторный alert fan-out.
- Transport/runtime слой не получает ownership review semantics; admin auth/session ownership не переносится в `FT-008`.

## Scope focus
- Расширить owning slice `reviews-feedback`, чтобы low-rating review атомарно публиковал `review.negative` вместе с review artifacts.
- Разрешить service-level recipient resolution активных администраторов и duplicate-safe Telegram fan-out.
- Сохранить transport-failure semantics non-blocking relative to committed review write.

## Fallback used
- Richer fields присутствуют в backlog card (`Constraints`, `Verify`) и `IMPL-FT-008`, поэтому fallback beyond feature + requirements + normative docs не потребовался.

## Code areas inspected
- `backend/src/slices/reviews-feedback/domain/reviews-feedback.types.ts`
- `backend/src/slices/reviews-feedback/application/reviews-feedback.service.ts`
- `backend/src/slices/reviews-feedback/infrastructure/prisma-reviews-feedback.repository.ts`
- `backend/src/slices/reviews-feedback/presentation/reviews-feedback.module.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier.ts`
- `tests/slices/reviews-feedback/reviews-feedback.unit.spec.ts`
- `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts`
