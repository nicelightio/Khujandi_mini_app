---
description: Adversarial semantic verification for TASK-FT010-18.
status: active
---
# TASK-FT010-18 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- The new canonical seller storefront payload currently groups content only through explicit `MenuPage` rows. In the checked-in repo-local runtime, existing seeded shops still have products with `menuPageId = null` and no menu pages, so an owning seller can reach `/shops/:shopId` and get an empty canonical storefront even though real catalog products exist.

## Hidden assumptions
- Assumes all seller-visible storefront content already satisfies the newer `skeleton shop with menu pages` shape.
- Assumes replacing synthetic fallback with strict canonical grouping is always semantically better, even for legacy/unpaged catalog records that are still present in the checked-in runtime state.

## Cross-boundary impact
- Public browse for seeded shops still shows products via `GET /api/v1/shops/:shopId/products`, but the protected seller storefront read can now hide those same products from the owning seller when they are not attached to a `MenuPage`.
- This creates a seller/customer read-model asymmetry on the same shared storefront contour, which is exactly the surface `FT-010` is trying to keep coherent.

## Architectural concerns
- The canonical read model moved closer to the intended `menuPages/products` shape, but it did so without a compatibility strategy for already-existing runtime/catalog records that still use `menuPageId = null`.
- The result is a stricter runtime contract than the surrounding checked-in data model currently guarantees.

## State/data consistency concerns
- Seller-owned storefront data can appear empty while product rows still exist for the same shop.
- The issue is especially visible on checked-in seeded shops because `buildSellerStorefrontPayload()` only emits products nested under explicit menu pages.

## Operational concerns
- Existing focused tests all pass because they provision a fresh skeleton shop with starter menu pages before reading the seller storefront.
- This leaves a false sense of closure for real checked-in shops/data shapes that were not normalized by this task.

## Future maintenance cost
- Follow-up work will now need either a canonical fallback page policy for unpaged products or a normalization/migration path that guarantees every seller-visible product belongs to a menu page before the seller storefront is considered risk-closed.

## How this could still be wrong
- If the project has already decided that all remaining seller-accessible shops must be admin-provisioned skeleton shops only, then this is merely a transitional repo-local runtime artifact. That intent is not currently enforced strongly enough in the checked-in runtime/data surface to dismiss the concern.

## Counterproposal / escalation path
- Add a follow-up task to close the unpaged-product semantic gap for canonical seller storefront reads: either normalize legacy/unpaged seller products into a deterministic menu-page bucket on read, or make the checked-in runtime guarantee/menu-page invariant explicit and test-backed for every seller-visible shop.
