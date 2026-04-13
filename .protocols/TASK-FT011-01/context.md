# TASK-FT011-01 Context

## Task
- `TASK-FT011-01`
- Goal: switch the repo-local mounted `catalog` runtime to the Prisma-backed module instead of the default `InMemoryCatalogRepository` path.

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-001-customer-ordering-experience.md`
- `.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md`
- `.memory-bank/tasks/plans/IMPL-FT-011.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`

## Richer inputs found
- backlog card with explicit touched files, verify target, and normative inputs
- feature + implementation-plan docs that call out the current `dev-runtime` drift and the expected runtime switch

## Fallback used
- no pre-existing task-local protocol existed for `TASK-FT011-01`, so execution uses the backlog card plus `FT-011` feature/plan/contracts/architecture docs as the normative basis.

## Implementation context
- `backend/src/slices/catalog/presentation/catalog.module.ts` already exposes the checked-in Prisma-backed `catalog` module.
- `backend/src/dev-runtime/dev-api-server.ts` still mounts `CatalogController(new CatalogService(new InMemoryCatalogRepository(...)))` as the default repo-local runtime path.
- runtime tests currently validate mounted behavior, but they do not yet assert that the mounted path itself is Prisma-backed.
