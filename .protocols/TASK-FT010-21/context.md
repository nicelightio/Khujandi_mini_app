# TASK-FT010-21 Context

## Task
- `TASK-FT010-21`
- Goal: replace synthetic `/shops/:shopId` fallback content with controlled missing/error states.

## Loaded docs
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
- `.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md`
- `.memory-bank/contracts/catalog-public-api.md`
- `.memory-bank/testing/index.md`

## Richer inputs found
- backlog card with explicit touched files, test target, and verify target
- feature doc note from post-closure `/review` describing swallowed missing/error cases on `/shops/:shopId`

## Fallback used
- no pre-existing task-local protocol/task artifacts existed for `TASK-FT010-21`, so execution uses backlog + feature + contract/testing docs as the normative basis.

## Implementation context
- `frontend/src/slices/catalog/routes/catalog-route.tsx` currently swallows both `listCatalog()` and `getSellerStorefrontAccess()` failures, then synthesizes a fake shop shell and starter product when neither source returns real data.
- Valid public browse and owner-visible seller storefront flows already resolve through the same route, so the fix should stay inside the shared route/component tree without adding a second storefront model.
