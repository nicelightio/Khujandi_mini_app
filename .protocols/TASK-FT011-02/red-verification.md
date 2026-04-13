# TASK-FT011-02 Red Verification

## Semantic verdict
- `semantic-concern`

## Why
- Task closes the narrow restart-seed problem, but does so by introducing a separate `dev-runtime` SQLite snapshot store (`catalog_runtime_state.payload`) rather than moving the mounted runtime onto canonical catalog persistence.
- This means the checked-in runtime now survives restart, yet still does not satisfy the architectural substance behind the DB-backed `catalog` baseline: one canonical persisted state shared by public browse, seller surfaces, and admin provisioning.

## Top substance risks
- `backend/src/dev-runtime/dev-api-server.ts:185` persists the whole catalog state as opaque JSON in `catalog_runtime_state`, so starter shops/menu/products/bindings/events are not durable as ordinary catalog records.
- `backend/src/dev-runtime/dev-api-server.ts:669` builds a Prisma-shaped client over mutable in-memory arrays and only snapshots that mirror back to SQLite; this is adapter-shaped persistence, not the owning slice's canonical DB runtime.
- `backend/src/dev-runtime/dev-api-server.ts:1587` loads one in-process state blob at boot and then serves requests from that mirror, which preserves the second source of truth drift that `FT-011` is supposed to remove.

## Hidden assumptions
- Assumes "DB-backed" is satisfied by any persisted local store, even if it bypasses the real `catalog` tables and persistence semantics described in `FT-011` / `REQ-027`.
- Assumes later tasks can safely swap the runtime from snapshot-blob persistence to canonical catalog persistence without paying migration or drift cleanup cost.

## Cross-boundary impact
- Public browse, seller-protected reads/writes, and admin provisioning still do not share the same persistence truth as the owner slice contract expects.
- The code now looks Prisma-backed because it goes through `createCatalogModule(...)`, but the underlying provider is still a runtime-local mirror, which can create false confidence in downstream verification.

## Architectural concerns
- Conflicts with the normative direction in `.memory-bank/architecture/data-boundaries-and-persistence.md` and `.memory-bank/architecture/system-contours-and-slices.md`, which require one canonical DB-backed catalog runtime path.
- Introduces a temporary persistence model (`JSON blob in SQLite`) that is outside the declared catalog data boundary and likely needs removal rather than extension.

## State/data consistency concerns
- Catalog entities are persisted as one opaque payload, so row-level guarantees, schema-level constraints, and natural queryability of canonical catalog data are still absent on the mounted runtime path.
- Future partial migration risks divergence between runtime snapshot state and real catalog tables if both paths coexist even briefly.

## Operational concerns
- Runtime durability currently depends on a repo-local file path and snapshot rewrite behavior, not on the canonical Prisma/database rollout path.
- Corruption or manual deletion of the snapshot file removes the mounted runtime truth wholesale, with no reconciliation path to canonical catalog rows.

## Future maintenance cost
- Later `FT-011` tasks must now both complete the real runtime switch and retire this temporary snapshot persistence without breaking seeded local flows.
- Tests that currently pass against restart-safe snapshot persistence may overfit to the surrogate and need replacement rather than simple extension.

## How this could still be wrong
- If the intended interpretation of `TASK-FT011-02` was strictly "remove hidden process-local demo arrays and make restart deterministic" without requiring alignment to catalog-row persistence yet, then the concern is architectural rather than task-blocking.

## Counterproposal / escalation path
- Keep `TASK-FT011-02` as completed for its narrow bootstrap goal, but do not treat it as a semantic pass for DB-backed runtime closure.
- Carry forward an explicit follow-up requirement that `TASK-FT011-03/04/05` must eliminate the snapshot-store surrogate and move mounted reads/writes onto canonical catalog persistence before `FT-011` can be closed.
