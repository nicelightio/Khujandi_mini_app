---
description: Контекст выполнения TASK-FT008-03.
status: active
---
# TASK-FT008-03 Context

## Task
- TASK-ID: `TASK-FT008-03`
- Title: `Scaffold Telegram bot review stepper and alert harness`
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
- `REQ-013` and `FT-008` require a two-sided Telegram-bot review flow with ordered steps `rating -> reason_code -> comment(optional)` after `COMPLETED`.
- `REQ-014`, `telegram-bot-contract`, and runtime docs require `review.negative` fan-out only to active admins, while bot transport stays duplicate-safe and does not own review semantics.
- Backlog card for `TASK-FT008-03` narrows scope to a minimal transport harness for prompts, callback parsing, dedupe keys, and alert targeting without implementing the review write-path.

## Scope focus
- Add a transport-only Telegram review stepper harness that can build prompt payloads and parse callback data for future runtime wiring.
- Add a transport-only negative alert harness that fans out to unique admin chat IDs with per-target dedupe keys.
- Cover the scaffold with repo-local `reviews-feedback` tests without pulling admin auth/session or review domain logic into the integration layer.

## Fallback used
- Richer task-card fields were present in backlog and `IMPL-FT-008`, so no fallback beyond feature + requirements + normative docs was required.

## Code areas inspected
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-assignment.notifier.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-delivery-tracking.notifier.ts`
- `backend/src/slices/reviews-feedback/domain/reviews-feedback.types.ts`
- `tests/slices/delivery-tracking/delivery-tracking.unit.spec.ts`
- `tests/slices/reviews-feedback/reviews-feedback.unit.spec.ts`
