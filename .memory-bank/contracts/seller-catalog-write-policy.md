---
description: Contract for seller-scoped catalog edits across shared storefront and narrow store-admin contours.
status: active
---
# Seller Catalog Write Policy

## Purpose
- Freeze seller edit boundaries inside the owning `catalog` slice before runtime implementation.

## Owner
- Owning slice: `catalog`
- Actors: `seller`

## Scope
- Seller-scoped edits for owned shops, menu pages, and products.
- Ownership checks for all seller write operations.
- Shop rename policy markers for first-free then manual-paid handling.
- No-delete policy for seller-facing catalog surfaces.

## Authorization and ownership rules
- Every seller-side write MUST run under authenticated seller context.
- Seller identity across both seller contours MUST stay Telegram-linked; introducing a second independent seller credential baseline requires explicit spec change.
- A seller MUST mutate only entities belonging to that seller's own shops.
- A seller MUST NOT mutate another seller's shop, menu page, or product.
- Product writes MUST validate linkage to a page/shop owned by the same seller.
- Canonical seller writes MUST land in durable catalog persistence and MUST NOT rely on process-local in-memory state as the normative runtime result.

## Shop edit surface
- Seller may edit owned `shop.name`, `shop.description`, `shop.header_image`, and `shop.background_image`.
- Seller storefront flows do not create the first shop from scratch; the initial skeleton shop is provisioned upstream by the admin-side catalog flow.

## Menu page and product edit surface
- Seller may add menu pages to an owned shop and edit menu page names.
- Seller may add products to an owned shop and edit `product.name`, `product.description`, `product.price`, and `product.image`.

## Status control
- Seller may toggle only the status of an owned shop between `WORKING` and `NOT_WORKING`.
- Shop status control belongs to the narrow `seller-web` store-admin contour, not to a separate operator/admin capability.

## Rename policy
- A shop has exactly one free rename in MVP.
- Any rename after the free attempt MUST be marked as requiring manual paid accounting.
- The manual paid path is a business marker only; it MUST NOT introduce a separate online payment flow in MVP.

## Snapshot invariant
- Renaming a shop MUST NOT mutate `shop_name` snapshot data already stored in existing orders.
- Runtime implementations MUST treat `shop_name_snapshot` as an immutable cross-slice boundary owned by order creation time.

## No-delete policy
- Seller-facing catalog surfaces MUST NOT expose destructive `delete` actions for shops, menu pages, or products in MVP.
- Absence of delete UI is a product rule, not a temporary placeholder for a hidden destructive path.

## Observability
- Seller shop/menu page/product writes are significant `catalog` domain changes and MUST emit explicit persisted events through the shared `events` store.
- MVP baseline for this seller write surface is event-backed observability owned by `catalog`; a separate catalog-specific audit table is not required unless a later scope change introduces operator review/reporting needs.
- The `CatalogRepository` boundary for seller shop/menu page/product writes MUST make the observability artifact explicit, so alternate adapters cannot silently mutate state without producing the corresponding seller write event.
- Non-persistent or test-only adapters MAY exist for repo-local verification, but they are non-normative and MUST NOT redefine the canonical DB-backed persistence and event semantics of the runtime path.
- Event payloads SHOULD identify the seller actor plus the mutated catalog entity so later shared storefront and `seller-web` flows can troubleshoot ownership-safe edits without reconstructing silent writes from raw row diffs.

## Failure posture
- Ownership violations MUST return a controlled authorization/business error and MUST NOT partially mutate data.
- Seller rename collisions against another owned shop on the durable `sellerId + shop name` boundary MUST return a controlled `409` conflict contract.
- Error payloads follow the project-wide error contract.

## Related docs
- [.memory-bank/features/FT-001-catalog-browse-and-seller-management.md](../features/FT-001-catalog-browse-and-seller-management.md): baseline ownership and rename policy.
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../features/FT-010-seller-storefront-editing-and-store-admin.md): seller contour expansion and acceptance.
- [.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md](../features/FT-011-db-backed-catalog-runtime-baseline.md): durable runtime baseline for seller writes.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](catalog-seller-provisioning-and-visibility.md): admin provisioning and visibility rules.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): snapshot, media and visibility boundaries.
- [.memory-bank/testing/index.md](../testing/index.md): integration/unit verification basis for ownership and rename rules.
