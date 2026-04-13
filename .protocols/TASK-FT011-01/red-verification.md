# TASK-FT011-01 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- `backend/src/dev-runtime/dev-api-server.ts:1564-1566` still mounts the default repo-local runtime on `createInMemoryCatalogPrisma(catalogState)`, so the source of truth remains process-local memory even though the repository class is now `PrismaCatalogRepository`.
- `backend/src/dev-runtime/dev-api-server.ts:656-666` and `125-197` keep the hidden `seededShops/seededProducts` bootstrap and process-local state as the runtime baseline, so the mounted path is still semantically non-durable.
- `tests/slices/catalog/catalog.runtime.integration.spec.ts:387-395` proves only the repository instance type, not that `dev:api` resolves catalog data through a real DB-backed persistence boundary.

## Hidden assumptions
- The implementation assumes that swapping `InMemoryCatalogRepository` for `PrismaCatalogRepository` is substantively enough even when the injected Prisma client is itself an in-memory shim.
- The verification assumes that repository type identity is a sufficient proxy for runtime-boundary correctness.

## Cross-boundary impact
- `FT-010` seller/admin/public catalog surfaces now pass through the same controller/service/repository composition as the slice, which is positive.
- But the runtime still does not meet the architectural intent from `REQ-027` and the `FT-011` feature narrative that contour surfaces share one canonical DB-backed catalog runtime path.

## Architectural concerns
- This is a facade-level alignment, not a persistence-boundary alignment: the checked-in runtime still defaults to route-local/process-local state, only wrapped behind a Prisma-shaped adapter.
- That creates a risk of false confidence because the code now looks "Prisma-backed" while preserving the same non-normative runtime data behavior.

## State/data consistency concerns
- Restart/reset semantics remain unchanged because catalog writes still land in `catalogState` memory.
- The hidden seeded baseline remains a parallel runtime source, so the task does not yet remove the core durability drift called out by `FT-011`.

## Operational concerns
- Repo-local manual testing can still observe successful provisioning and seller writes that disappear on restart/reset.
- Future reviewers may over-read this task as a DB/runtime hardening step when it is actually only a repository-wiring step.

## Future maintenance cost
- The in-memory Prisma shim is another compatibility layer to maintain until later `FT-011` tasks remove the process-local bootstrap.
- Tests that assert `PrismaCatalogRepository` by class can mask regressions in the actual persistence source.

## How this could still be wrong
- If the intended acceptance for `TASK-FT011-01` was strictly "mount the checked-in module composition without solving durability yet," then this concern is about over-interpretation rather than task failure.
- If later tasks quickly replace `createInMemoryCatalogPrisma(...)` with the real DB provider, the current shim may remain a tolerable short-lived bridge.

## Counterproposal / escalation path
- Keep `TASK-FT011-01` implemented but treat it as a narrow composition refactor, not substantive DB-backed runtime closure.
- Do not describe the mounted runtime as DB-backed in stronger terms than "boots through the Prisma repository boundary."
- Let `TASK-FT011-02`, `TASK-FT011-04`, and `TASK-FT011-05` remain the mandatory follow-up path, because they already cover the real semantic gap: persistent bootstrap, canonical persisted reads, and durability regressions.
