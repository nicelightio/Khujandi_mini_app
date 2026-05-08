---
description: S-01 Architect review report for uncommitted FT-015 start showcase and curation changes.
status: final
---
# TASK-FT015-ARCH-REVIEW S-01 Architect

## Findings

### HIGH - Showcase curation writes bypass the catalog event/audit boundary

References:
- `doc/ARCHITECTURE.md:190` requires every significant write operation to publish a domain event.
- `.memory-bank/features/FT-015-start-showcase-and-curation.md:70` requires showcase write commands to follow project-wide audit/error conventions for admin writes.
- `backend/src/dev-runtime/routes/catalog.routes.ts:405` and `backend/src/dev-runtime/routes/catalog.routes.ts:434` mount admin curation write endpoints as `POST/DELETE`, but they only return `{ ok: true }` after controller calls.
- `backend/src/slices/catalog/application/catalog.service.ts:323` through `backend/src/slices/catalog/application/catalog.service.ts:368` define the four showcase curation commands as `Promise<void>` repository mutations.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:27` through `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:150` create/update showcase references without creating an event or audit record.
- `backend/src/slices/catalog/domain/catalog.types.ts:145` through `backend/src/slices/catalog/domain/catalog.types.ts:158` still models catalog write results around events only for `shop | menu_page | product`, while existing catalog writes use a transaction plus event creation, e.g. `backend/src/slices/catalog/infrastructure/prisma/catalog-seller.writer.ts:42` through `backend/src/slices/catalog/infrastructure/prisma/catalog-seller.writer.ts:66`.

Why this matters:
FT-015 curation changes the public customer entry surface and is an admin write. The implementation keeps the write in the `catalog` slice, which is correct, but it bypasses the established write contract used by other catalog mutations. That creates an observability/audit gap and architectural drift from the monolith's command flow. A later event consumer, audit review, or admin action trace cannot distinguish who curated/remediated the public showcase.

Expected correction:
Model showcase curation as catalog write events/audit-bearing commands. Keep it slice-local, but add explicit event types/entities or an equivalent approved admin audit path, and persist the reference mutation and event/audit in one transaction for DB-backed runtime.

### MEDIUM - The 3 favorite shops invariant is not atomic in DB-backed runtime

References:
- `.memory-bank/contracts/catalog-start-showcase-contract.md:46` through `.memory-bank/contracts/catalog-start-showcase-contract.md:49` requires active favorite shops to be capped at 3.
- `.memory-bank/features/FT-015-start-showcase-and-curation.md:53` repeats that favorite shops are limited to 3 active public references.
- `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:79` through `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:128` implements `favoriteShop` as `findUnique -> count active WORKING refs -> create/update`.
- `backend/prisma/schema.prisma` adds uniqueness per `shopId`, but there is no database or transaction-level guard for the global active favorite cap.

Why this matters:
Two valid admin requests can both observe `activeCount < 3` and then both create/reactivate references, resulting in more than 3 active public favorite references. The public reader slices output to 3 items, but the contract is stricter: active references themselves are capped, not merely the rendered array. This is a small concurrency window, but it is on a public curation invariant and DB-backed runtime path.

Expected correction:
Enforce the cap inside a transaction/serializable section or use a DB-enforced slot model. At minimum, make the check-and-write atomic for `CatalogFavoriteShop` mutations and add a focused concurrency/atomicity test.

## Architecture Assessment

Owning slice is correctly `catalog`. The implementation keeps showcase read/write concepts in catalog service/domain/infrastructure files and does not introduce a new recommendation, checkout, payment, or order slice.

Contours are mostly aligned: public `GET /api/v1/showcase` belongs to `mini-app`, while curation writes require the admin session boundary and `admin|boss` roles. I did not find seller-session or seller edit mode being treated as sufficient curation authority.

Layering is mostly aligned: frontend presentation, dev-runtime routing, catalog application checks, domain types, and infrastructure persistence are separated. The main layering drift is that the new write path stops at persistence mutation instead of going through the established catalog write-result/event boundary.

Shared extraction is acceptable in this diff. The changes in `frontend/src/shared/lib/routes.ts` and `frontend/src/shared/i18n/copy.ts` are technical/navigation/copy primitives, not shared business logic. I did not find a new shared curation service or cross-slice business abstraction.

C4/contract boundaries are partially aligned. Public reads use live `Product`/`Shop` references and hide `NOT_WORKING`/deleted references, which matches the contract. Write-side contract compliance is incomplete because admin curation lacks event/audit posture and the favorite cap is not atomically enforced.

## Tests

Not run. Per request, this was a review-only pass and no heavy tests were necessary to identify the architectural blockers.

## Verdict

REJECT
