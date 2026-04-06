---
description: Контекст выполнения TASK-FT008-08.
status: active
---
# TASK-FT008-08 Context

## Loaded docs

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/epics/EP-004-reviews-and-alerts.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT008-08`)
- `.memory-bank/tasks/plans/IMPL-FT-008-BUGFIX-review-callback-replay-hardening.md`
- `.memory-bank/bugs/BUG-2026-04-06-ft008-stale-review-callback-replay-gap.md`

## Richer inputs found

- `Bug`: `BUG-2026-04-06-ft008-stale-review-callback-replay-gap`
- `Plan`: `IMPL-FT-008-BUGFIX-review-callback-replay-hardening`
- `Constraints`: keep `reviews-feedback` ownership, preserve final-submit idempotency and negative alert semantics
- `Verification Targets`: stale rating/reason callbacks, replay of older prompt buttons, regression on duplicate-safe final submit

## Fallback usage

- Richer task inputs exist, so fallback is limited to feature/contract/testing docs for normative intent.

## Code scope

- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.harness.ts`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
- `tests/slices/reviews-feedback/*.spec.ts`
