---
description: Контекст выполнения TASK-FT010-10.
---
# TASK-FT010-10 Context

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-10`)
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/admin-auth-contract.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/bugs/BUG-2026-04-10-ft010-provisioning-route-uses-refresh-cookie-as-auth.md`
- `.protocols/TASK-FT010-09/red-verification.md`

## Richer inputs found
- Task card in backlog with explicit touched files, tests, verify target, constraints.
- Active bug record with semantic root cause and required follow-up.
- Red verification for `TASK-FT010-09` pinpointing the refresh-cookie shortcut as the architectural regression.

## Fallback used
- `FT-010`, `EP-001`, `REQ-025`, `REQ-017`, and `admin-auth` / seller access contracts were used as the normative fallback/acceptance basis.

## Implementation focus
- Replace the route-local refresh-cookie shortcut with one reusable protected admin runtime boundary.
- Keep `FT-007` session semantics intact inside checked-in repo reality: privileged writes require the protected cookie boundary and respect `accessTokenExpiresAt`, not refresh-only validity.
- Keep the change minimal and localized to `dev-runtime`, `admin-access` runtime helpers, and targeted runtime tests.
