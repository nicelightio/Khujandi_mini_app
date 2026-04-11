# TASK-FT010-21 Plan

## Basis
- Use the explicit backlog/task verify target plus `FT-010` post-closure follow-up note.
- Preserve valid public browse and owner-visible seller flows; change only the missing/error fallback behavior.

## Steps
1. Replace default storefront loading logic so it prefers canonical seller data, falls back to real public shop data, and throws controlled `not found`/`error` outcomes instead of fabricating synthetic content.
2. Keep shared `CatalogPage` rendering on the same tree so storefront routes continue to show controlled states through existing error handling.
3. Add focused route regressions for missing and failing storefront loads, plus a positive case proving public storefront rendering still works when seller access fails.
4. Run repo-local catalog tests and sync protocol/Memory Bank artifacts.
