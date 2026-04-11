---
description: Execution context for TASK-FT010-07.
status: active
---
# TASK-FT010-07 Context

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
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-07` card)
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- Backlog card with explicit `Tests`, `Verify`, `Docs`, and `Constraints`.
- Feature and contract docs with narrow `seller-web`, admin provisioning, shared seller session family, and `WORKING/NOT_WORKING` visibility rules.

## Fallback use
- No separate task artifact beyond backlog entry; implementation follows feature + contracts + requirements + contour architecture docs.

## Working assumptions
- Scope is frontend/runtime wiring for existing admin provisioning and seller status-toggle surfaces rather than new domain behavior.
- Backend protected admin provisioning and seller session reuse/runtime access are expected to come from earlier FT-010 tasks and should be consumed, not redefined.
