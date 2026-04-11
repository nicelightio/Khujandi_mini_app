---
description: Execution context for TASK-FT010-18.
status: active
---
# TASK-FT010-18 Context

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT010-18` card)
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/architecture/system-contours-and-slices.md`

## Richer inputs found
- Backlog card with explicit `Touched files`, `Tests`, `Verify`, and dependency set.
- Feature + contract docs that make the semantic gap explicit: shared storefront must reuse the same tree but consume canonical owner-visible catalog data and seller write commands.

## Fallback use
- No separate implementation brief beyond the backlog/spec layer; implementation falls back to feature, contracts, requirements, and existing checked-in `FT-010` behavior.

## Working assumptions
- Scope is still the existing shared `CatalogRoute`/`CatalogPage` tree for `/shops/:shopId`.
- Canonical seller reads/writes should reuse checked-in `catalog` seller endpoints and not introduce a second storefront runtime boundary.
- If the repo-local backend runtime already mounts the needed seller endpoints, frontend wiring should be the minimal preferred fix.
