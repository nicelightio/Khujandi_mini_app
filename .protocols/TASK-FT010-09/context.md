---
description: Контекст выполнения TASK-FT010-09.
---
# TASK-FT010-09 Context

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-09`)
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/bugs/BUG-2026-04-10-ft010-admin-provisioning-runtime-open-without-admin-auth.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- Task card in backlog with explicit touched files, tests, verify target, constraints.
- Bug record with root cause and expected runtime posture.

## Fallback used
- Feature spec `FT-010`, `REQ-025`, and seller access/provisioning contracts were used as the normative fallback/acceptance basis.

## Implementation focus
- Reuse the checked-in admin cookie/session family for `POST /api/v1/admin/catalog/shops/provision`.
- Fail closed for anonymous or non-admin callers before any catalog writes.
- Keep the change minimal and localized to the repo-local runtime/test surface.
