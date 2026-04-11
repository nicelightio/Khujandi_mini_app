# TASK-FT010-01 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- The scaffold introduces a dual ownership model: `Shop.sellerId` remains on the shop row while `SellerShopBinding` adds a second seller-binding record. Without an explicit canonical source of truth, later runtime code can resolve ownership from the wrong field and drift away from the Telegram-linked access model required by `FT-010`.

## Hidden assumptions
- Future tasks will keep `Shop.sellerId` and `SellerShopBinding.{sellerId, telegramId}` perfectly synchronized.
- Future seller capability resolution will always prefer Telegram-linked binding semantics instead of the easier legacy `shop.sellerId` path.
- Future provisioning will wrap `createShop + createSellerShopBinding + starter data creation` in one atomic transaction and never persist partial ownership state.

## Cross-boundary impact
- Impacts `catalog` provisioning (`TASK-FT010-03`) and seller capability/session resolution (`TASK-FT010-04`).
- If unresolved, the Mini App/session contour can drift into client-independent but still semantically wrong seller authorization based on stale `sellerId` instead of Telegram-linked identity.

## Architectural concerns
- The current scaffold is acceptable as a foundation, but it risks hardening a legacy ownership shortcut into the data model.
- `shared` stayed clean, which is good; the concern is not layer leakage but ownership duplication inside the slice boundary.

## State and data consistency concerns
- `Shop.sellerId` and `SellerShopBinding.sellerId/telegramId` can diverge unless later tasks define one canonical owner field and enforce synchronization/validation.
- The scaffold alone does not yet prove atomic provisioning, so a future non-transactional implementation could create partial shop/binding/template state.

## Operational concerns
- Repository-level mock tests do not exercise migration/runtime behavior against a real Prisma client or DB constraint set.
- There is no DB-level constraint yet tying `Shop.sellerId` to `SellerShopBinding.sellerId`, so drift would be silent unless application code guards it.

## Future maintenance cost
- If later tasks read `shop.sellerId` in some places and `SellerShopBinding` in others, ownership bugs will be subtle and expensive to debug.
- The longer both ownership representations coexist without an explicit rule, the more tests and code paths will need reconciliation later.

## How this could still be wrong
- `TASK-FT010-03` may implement a provisioning flow that accepts arbitrary `sellerId` and only secondarily writes Telegram binding, which would formally pass local tests but violate the product intent of Telegram-linked seller identity.
- `TASK-FT010-04` may resolve seller access from `shop.sellerId` because it is simpler than joining through binding/session state.

## Counterproposal / escalation path
- Treat `SellerShopBinding` plus Telegram-linked identity as the canonical access source for seller capability resolution.
- In `TASK-FT010-03`, make canonical ownership explicit and keep provisioning transactional.
- In `TASK-FT010-04`, verify that access resolution reads the binding/session family rather than trusting `shop.sellerId` alone.
- No new standalone follow-up task is required if `TASK-FT010-03/04` are updated to explicitly absorb this concern.
