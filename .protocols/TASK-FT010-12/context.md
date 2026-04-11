---
description: Контекст выполнения TASK-FT010-12.
---
# TASK-FT010-12 Context

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-12`)
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/telegram-mini-app-auth-contract.md`
- `.memory-bank/testing/index.md`
- `.tasks/TASK-FT010-11/TASK-FT010-11-S-RED-VERIFY-final-report-docs-01.md`

## Richer inputs found
- Task card in backlog with explicit touched files, tests, verify target, and constraints.
- Prior `red-verify` report for `TASK-FT010-11` with the exact remaining transport-level concern.

## Fallback used
- `FT-010`, `REQ-025`, `REQ-022`, seller access contract, and Telegram Mini App auth contract are used as the normative fallback basis.

## Implementation focus
- Remove the route-local `pendingMiniAppSessionToken` convention from repo-local Mini App auth mounting.
- Make the checked-in `checkout-payment` auth boundary the explicit source of cookie transport data.
- Keep the fix minimal and limited to `checkout-payment`, `dev-runtime`, targeted tests, and docs/protocol sync.
