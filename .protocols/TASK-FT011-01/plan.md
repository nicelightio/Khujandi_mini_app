# TASK-FT011-01 Plan

## Basis
- Use the backlog verify target and `FT-011` acceptance that the mounted repo-local `catalog` path must stop defaulting to the in-memory repository.
- Keep `InMemoryCatalogRepository` only as an explicit non-normative helper for isolated tests/runtime internals.

## Steps
1. Add a minimal in-memory Prisma shim for the `catalog` runtime state so the mounted dev runtime can instantiate `createCatalogModule(...)` without introducing a new data source.
2. Switch `startDevApiServer()` to mount the checked-in Prisma-backed `catalog` module and return enough runtime state for existing tests.
3. Update runtime tests to prove the mounted repo-local server now uses the Prisma-backed module while preserving the isolated in-memory adapter coverage.
4. Run targeted catalog runtime verification and sync protocol/Memory Bank artifacts.
