# TASK-FT011-02 Red Verify Report

## Verdict
- `semantic-concern`

## Main concern
- Restart durability is now real, but it is implemented through a `dev-runtime` snapshot store (`catalog_runtime_state.payload`) instead of canonical catalog persistence, so the mounted runtime still carries a second source of truth.

## Evidence
- `backend/src/dev-runtime/dev-api-server.ts:185` stores the entire catalog runtime state as one JSON payload in SQLite.
- `backend/src/dev-runtime/dev-api-server.ts:669` uses an in-memory Prisma-shaped adapter over arrays, then persists snapshots of that mirror.
- `backend/src/dev-runtime/dev-api-server.ts:1587` boots the runtime from that snapshot path, not from ordinary catalog rows.

## Impact
- The task solves the narrow hidden-demo-bootstrap issue.
- The broader `FT-011` substance remains open: public browse, seller surfaces, and admin provisioning still are not on one canonical DB-backed catalog runtime path.

## Follow-up
- Treat `TASK-FT011-03/04/05` as required semantic closure, not polish.
