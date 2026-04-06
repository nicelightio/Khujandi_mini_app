---
description: Контекст выполнения TASK-FT008-06.
status: active
---
# TASK-FT008-06 Context

## Task
- TASK-ID: `TASK-FT008-06`
- Title: `Wire bot-guided client and courier review flows`
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
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/testing/index.md`

## Normative inputs found
- Review flow должен идти через Telegram-бота в шагах `rating -> reason_code -> comment(optional)` и активироваться только после `COMPLETED`.
- Bot/runtime слой не обходит server-side validation: финальная запись отзыва обязана проходить через owning `reviews-feedback` submit path.
- Duplicate bot delivery не должен создавать повторный review write или повторный negative alert fan-out.

## Scope focus
- Подключить существующий Telegram review harness к backend submit path без добавления web UI.
- Поддержать обе стороны feedback loop: `client -> courier` и `courier -> client`.
- Сохранить controlled duplicate handling на stepper/runtime уровне и опереться на existing backend idempotency для final review write.

## Code areas inspected
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.notifier.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness.ts`
- `backend/src/slices/reviews-feedback/presentation/reviews-feedback.controller.ts`
- `backend/src/slices/reviews-feedback/application/reviews-feedback.service.ts`
- `backend/src/slices/reviews-feedback/domain/reviews-feedback.types.ts`
- `tests/slices/reviews-feedback/reviews-feedback.unit.spec.ts`
- `tests/slices/reviews-feedback/reviews-feedback.integration.spec.ts`
