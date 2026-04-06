---
description: Контекст выполнения TASK-FT008-10.
status: active
---
# TASK-FT008-10 Context

## Loaded docs

- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-004-reviews-and-alerts.md`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT008-10`)
- `.tasks/TASK-FT008-09/TASK-FT008-09-S-RED-VERIFY-final-report-docs-01.md`
- `.protocols/TASK-FT008-09/red-verification.md`

## Richer inputs found

- `Source`: `TASK-FT008-09` red-verify semantic concern
- `Constraints`: do not rewrite review flow; close rollout/retention assumptions minimally
- `Touched files`: checked-in Prisma rollout artifact, `FT-008` docs, negative-alert runbook, changelog
- `Verification Targets`: checked-in runtime can materialize `ReviewDraft`; expired draft retention policy is explicit and maintainable

## Fallback usage

- Richer task card fields exist in backlog, so fallback is limited to feature/epic/contract/runbook docs for normative intent.

## Expected worktree scope

- `backend/prisma/migrations/**/*`
- `.memory-bank/features/FT-008-two-sided-reviews-and-negative-alerts.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/changelog.md`
- `.memory-bank/index.md`
