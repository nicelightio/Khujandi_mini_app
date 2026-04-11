---
description: Contract for admin-provisioned skeleton shops, Telegram-linked seller binding, and `WORKING/NOT_WORKING` visibility.
status: active
---
# Catalog Seller Provisioning And Visibility

## Purpose
- Freeze the provisioning and visibility boundary for seller-managed storefronts inside the owning `catalog` slice before runtime implementation.

## Owner
- Owning slice: `catalog`
- Actors: `admin`, `seller`, `client`

## Scope
- Admin-side creation of the initial shop record.
- Binding a shop to the seller's Telegram-linked identity.
- Automatic creation of a template-based skeleton shop.
- Public vs seller-only visibility based on explicit shop status.
- Narrow first-version scope of the separate `seller-web` store-admin contour.

## Provisioning rules
- Admin provisioning MUST collect at minimum the shop name and the seller's Telegram-linked identity.
- Successful provisioning MUST create a skeleton shop automatically; seller does not start from an empty shop canvas.
- Skeleton provisioning MUST create starter menu pages and starter products that can be edited later by the seller.
- Shop record creation, Telegram-linked binding creation, and starter catalog bootstrap MUST succeed or fail atomically.

## Ownership and access rules
- Seller ownership is resolved from the Telegram-linked identity bound during provisioning.
- Provisioning MUST persist the same canonical seller identity in both `Shop.sellerId` and the created seller-binding record.
- Seller access to shared storefront edit mode and to `seller-web` store-admin MUST depend on that bound ownership.
- Missing or mismatched Telegram binding MUST NOT grant seller access.

## Visibility rules
- Shop visibility states are `WORKING` and `NOT_WORKING`.
- `WORKING` shop MUST be visible in public browse and to the owning seller.
- `NOT_WORKING` shop MUST stay hidden from public browse and remain visible only to the owning seller.

## Store-admin scope rules
- Separate `seller-web` store-admin exists to host light catalog-owned controls that do not fit the shared storefront editing flow.
- First-version `seller-web` baseline includes the shop status toggle and similarly light shop-level controls only.
- Sales stats, reporting, or other cross-slice analytics MUST NOT be pulled into the baseline `seller-web` scope without explicit spec expansion.

## Failure posture
- Provisioning conflicts, ownership conflicts, and invalid status changes MUST return controlled errors and MUST NOT leave partially bound seller/shop state.
- Error payloads follow the project-wide error contract.

## Related docs
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../features/FT-010-seller-storefront-editing-and-store-admin.md): feature acceptance and contours.
- [.memory-bank/contracts/catalog-public-api.md](catalog-public-api.md): public browse visibility boundary.
- [.memory-bank/contracts/seller-catalog-write-policy.md](seller-catalog-write-policy.md): seller-side edit policy.
- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md): contour split and owner-slice rules.
