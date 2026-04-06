---
description: Контекст выполнения TASK-FT008-09.
status: active
---
# TASK-FT008-09 Context

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
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT008-09`)
- `.memory-bank/tasks/plans/IMPL-FT-008-BUGFIX-review-draft-durability.md`
- `.memory-bank/bugs/BUG-2026-04-06-ft008-ephemeral-review-draft-state.md`

## Richer inputs found

- `Bug`: `BUG-2026-04-06-ft008-ephemeral-review-draft-state`
- `Plan`: `IMPL-FT-008-BUGFIX-review-draft-durability`
- `Constraints`: keep final submit ownership in `reviews-feedback`, prefer minimal durability strategy, make runtime guarantee explicit
- `Verification Targets`: restart/reload continuity for active drafts, duplicate-safe final submit, unchanged `review.negative` semantics

## Fallback usage

- Richer task inputs exist, so fallback is limited to feature/contract/runbook/testing docs for normative intent.

## Code scope

- `backend/prisma/schema.prisma`
- `backend/src/integrations/telegram-bot/telegram-bot-reviews-feedback.flow.ts`
- `backend/src/slices/reviews-feedback/**/*`
- `tests/slices/reviews-feedback/*.spec.ts`
- `.memory-bank/**/*FT-008*`
