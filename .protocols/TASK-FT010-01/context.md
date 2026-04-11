# TASK-FT010-01 Context

## Task
- `TASK-FT010-01`
- Goal: scaffold backend `catalog` expansion, seller binding, and provisioning baseline for `FT-010`.

## Loaded normative inputs
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/tasks/plans/IMPL-FT-010.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/requirements.md`

## Richer inputs found
- Backlog task card with `Normative Inputs`, `Constraints`, `Verify`, and `Tests` fields.
- Implementation plan `IMPL-FT-010` with current-state notes, invariants, and expected touched files.

## Fallback usage
- No dedicated task-scoped protocol template was present, so this protocol uses a minimal manual structure.
- Feature + requirements + architecture/contracts/testing docs are used as fallback support around the richer backlog card.

## Key constraints and invariants
- Ownership remains in `catalog`; no business logic migration to `shared`.
- Public visibility must move toward explicit `WORKING/NOT_WORKING`, not legacy soft-delete semantics.
- Seller direction stays delete-free for shops, menu pages, and products.
- First shop comes from admin provisioning with skeleton pages/products; seller does not start from an empty builder.

## Initial code reality observed
- Prisma currently has only legacy `Shop` and `Product` baseline with `isDeleted`/`deletedAt`.
- `catalog` slice currently supports public reads, seller rename, and seller product create/update only.
- Test suite is mock-backed; it asserts repository contract shapes rather than real DB runtime.
