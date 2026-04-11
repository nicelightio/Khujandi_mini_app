# TASK-FT010-01 Plan

## Scope
- Extend backend persistence and repository contracts for `FT-010` foundation fields/entities.
- Keep this task scaffold-only: no full runtime provisioning command or seller access resolution yet.
- Add backend test coverage proving the new baseline is execution-ready.

## Implementation steps
1. Expand Prisma schema with explicit shop status, media/description fields, menu-page and seller-binding models, and starter-template entities needed by later tasks.
2. Update `backend/src/shared/db/prisma-client.ts` types so the catalog slice can target the new baseline without leaking logic into `shared`.
3. Extend catalog domain/repository code with scaffold read/write methods and types for menu pages, richer shop/product fields, seller bindings, and provisioning bootstrap.
4. Add repo-local unit/integration specs that assert the new repository/service baseline and query shapes.
5. Run targeted catalog tests, then sync progress and Memory Bank notes required for this task.

## Non-goals for this task
- No mounted admin provisioning HTTP path yet.
- No seller session/access resolution yet.
- No frontend `/seller/*` or shared storefront edit mode yet.

## Verification basis
- Backlog verify clause for `TASK-FT010-01`.
- `FT-010` acceptance around persistence readiness for shop status, pages, descriptions/media, and skeleton provisioning.
- `testing/index.md` catalog slice baseline.
