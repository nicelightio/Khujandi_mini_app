# TASK-FT010-20 Verification

## Basis
- Task verify target from `.memory-bank/tasks/backlog.md`: narrow `/seller/*` status control must persist only `WORKING/NOT_WORKING` intent and must not roll back stale `shop.name/description/media`.
- `FT-010` follow-up note: `TASK-FT010-20` closes the stale shared-storefront metadata overwrite risk without widening `seller-web` scope.
- Contract basis from `seller-catalog-write-policy.md`: seller may toggle only owned shop status in the narrow `seller-web` contour.

## Verdict
- PASS

## Checks
- Check 1: seller route submit semantics
- Command: `npx jest --config jest.config.cjs frontend/src/tests/seller/seller-shop-status-route.spec.tsx`
- Result: PASS; the route submits only `id + status` for the selected owned shop.
- Evidence: repo-local Jest output plus `frontend/src/tests/seller/seller-shop-status-route.spec.tsx`.

- Check 2: mounted runtime stale-metadata preservation
- Command: `npx jest --config jest.config.cjs tests/slices/catalog/catalog.runtime.integration.spec.ts`
- Result: PASS; after a storefront metadata update, a later seller-web status-only toggle preserves `shop.name/description/headerImageUrl/backgroundImageUrl` while still changing visibility status.
- Evidence: repo-local Jest output plus `tests/slices/catalog/catalog.runtime.integration.spec.ts`.

- Check 3: regression sweep for related catalog/frontend scope
- Command: `npm run test:catalog`
- Result: PASS.
- Evidence: repo-local Jest output.

- Check 4: lint gate
- Command: `npm run lint`
- Result: PASS.
- Evidence: repo-local ESLint output.

- Check 5: frontend build gate
- Command: `npm run build:frontend`
- Result: PASS.
- Evidence: repo-local Vite build output.

## Verified behavior
- seller route submits only status intent for the selected owned shop
- mounted runtime preserves newer shop name/description/media when a later seller-web status toggle omits those fields
- public visibility gating for `WORKING/NOT_WORKING` remains intact

## Conclusion
- `TASK-FT010-20` satisfies its explicit verify target and remains aligned with `REQ-024`/`REQ-026` for the narrow seller status surface.
- No verify-time bug or follow-up was opened.
