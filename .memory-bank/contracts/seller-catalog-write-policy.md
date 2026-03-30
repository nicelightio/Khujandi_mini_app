---
description: Contract for seller-scoped shop and product writes, including rename policy markers.
status: active
---
# Seller Catalog Write Policy

## Purpose
- Freeze seller write boundaries inside the owning `catalog` slice before runtime implementation.

## Owner
- Owning slice: `catalog`
- Actors: `seller`

## Scope
- Seller-scoped writes for shops and products.
- Ownership checks for all write operations.
- Shop rename policy markers for first-free then manual-paid handling.

## Authorization and ownership rules
- Every seller-side write MUST run under authenticated seller context.
- A seller MUST be able to create, update, or soft-delete only entities belonging to that seller's own shops.
- A seller MUST NOT mutate another seller's shop or product.
- Product writes MUST validate linkage to a shop owned by the same seller.

## Rename policy
- A shop has exactly one free rename in MVP.
- Any rename after the free attempt MUST be marked as requiring manual paid accounting.
- The manual paid path is a business marker only; it MUST NOT introduce a separate online payment flow in MVP.

## Snapshot invariant
- Renaming a shop MUST NOT mutate `shop_name` snapshot data already stored in existing orders.
- Runtime implementations MUST treat `shop_name_snapshot` as an immutable cross-slice boundary owned by order creation time.

## Soft-delete policy
- Seller write flows may soft-delete owned shops/products.
- Soft-deleted catalog entities become ineligible for public browse.

## Failure posture
- Ownership violations MUST return a controlled authorization/business error and MUST NOT partially mutate data.
- Error payloads follow the project-wide error contract.

## Related docs
- [.memory-bank/features/FT-001-catalog-browse-and-seller-management.md](../features/FT-001-catalog-browse-and-seller-management.md): feature acceptance and edge cases.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): snapshot and soft-delete boundaries.
- [.memory-bank/testing/index.md](../testing/index.md): integration/unit verification basis for ownership and rename rules.
