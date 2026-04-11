---
description: Контекст выполнения TASK-FT010-11.
---
# TASK-FT010-11 Context

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-11`)
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/testing/index.md`
- `.tasks/TASK-FT010-04/TASK-FT010-04-S-RED-VERIFY-final-report-docs-01.md`

## Richer inputs found
- Task card in backlog with explicit touched files, tests, verify target, and constraints.
- Prior `red-verify` report for `TASK-FT010-04` with the concrete semantic concern and required follow-up.

## Fallback used
- `FT-010`, `EP-001`, `REQ-025`, `REQ-022`, seller access contract, and Telegram Mini App auth contract are used as the normative fallback basis.

## Implementation focus
- Remove the `dev-runtime`-local Mini App auth/session clone for seller-protected reads.
- Reuse the checked-in `checkout-payment` auth/session module and one shared in-memory Prisma-like state in repo-local runtime.
- Keep the change minimal and localized to `dev-runtime`, targeted runtime tests, and MB/protocol sync.
