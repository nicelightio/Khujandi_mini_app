# TASK-FT011-02 Context

## Task
- `TASK-FT011-02`
- Goal: replace the hidden in-memory demo bootstrap with a DB-backed catalog seed baseline so mounted runtime start data comes from durable persistence.

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
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-seller-access-and-session.md`
- `.memory-bank/contracts/seller-catalog-write-policy.md`
- `.memory-bank/architecture/system-contours-and-slices.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- backlog card with explicit touched files, verify target, constraints, and docs targets
- feature + implementation-plan docs with the accepted semantic concern from `TASK-FT011-01` and the required DB-backed seed follow-up

## Fallback used
- no pre-existing task-local protocol existed for `TASK-FT011-02`, so execution uses the backlog card plus `FT-011` feature/plan/contracts/architecture/testing docs as the normative basis.

## Implementation context
- `TASK-FT011-01` already moved the mounted repo-local `catalog` runtime onto `createCatalogModule(...)`, but the runtime still appears to derive baseline catalog data from hidden process-local seed state.
- This task must remove hidden `seededShops`/`seededProducts` style bootstrap from the mounted runtime path rather than adding compatibility backfill logic.
- Clean DB-backed local start data is acceptable as long as repeated start/restart resolves the same persisted catalog state.
