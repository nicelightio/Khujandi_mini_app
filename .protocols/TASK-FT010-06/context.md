---
description: Execution context for TASK-FT010-06.
status: active
---
# TASK-FT010-06 Context

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-06` card)
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- Backlog card with explicit `Tests`, `Verify`, and `Constraints`.
- Feature and contract docs with shared-tree seller edit-mode, no-second-storefront, and no-delete rules.

## Fallback use
- No separate task-card artifact beyond backlog entry; implementation follows feature + contracts + requirements.

## Working assumptions
- Scope is frontend `catalog` shared storefront edit mode on the existing route/component tree.
- Seller access state is consumed from checked-in seller-aware runtime/client primitives delivered by earlier FT-010 tasks.
