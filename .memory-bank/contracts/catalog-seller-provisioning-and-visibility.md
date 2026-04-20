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
- Admin-side read view of already provisioned shops on the provisioning page.
- Binding a shop to the seller's Telegram-linked identity.
- Automatic creation of a template-based skeleton shop.
- Public vs seller-only visibility based on explicit shop status.
- Narrow first-version scope of the separate `seller-web` store-admin contour.

## Provisioning rules
- Admin provisioning MUST collect at minimum the shop name and the seller's Telegram-linked identity.
- Durable provisioning identity MUST be enforced at the persistence boundary with a canonical uniqueness key equivalent to `sellerId + shop name`, so concurrent identical retries cannot create duplicate starter shops.
- Один seller/Telegram-linked identity MAY быть привязан к нескольким shops, если эти shops provision-ятся admin-side flow; uniqueness MUST NOT ужесточаться до `sellerId`-only или `telegramId`-only блокировки.
- Successful provisioning MUST create a skeleton shop automatically; seller does not start from an empty shop canvas.
- Skeleton provisioning MUST create starter menu pages and starter products that can be edited later by the seller.
- Shop record creation, Telegram-linked binding creation, and starter catalog bootstrap MUST succeed or fail atomically.
- Successful provisioning MUST durably persist the shop, binding, and starter catalog data in the canonical DB-backed `catalog` runtime and MUST survive runtime restart/reset.
- Successful provisioning MUST also durably persist two immutable public paths for the shop: primary seller-ordinal path `sellerId + N` and secondary vanity translit path with conflict suffixing when needed.
- Starter menu pages and starter products created by provisioning become ordinary catalog records, not ephemeral demo fixtures.
- Duplicate or conflicting provisioning MUST fail closed with a controlled error and MUST NOT create partial or duplicate catalog state.

## Ownership and access rules
- Seller ownership is resolved from the Telegram-linked identity bound during provisioning.
- Provisioning MUST persist the same canonical seller identity in both `Shop.sellerId` and the created seller-binding record.
- Public routing identity is separate from provisioning identity: `shop.id` stays technical, `sellerId + shop name` remains the durable provisioning conflict key, and storefront resolution uses immutable persisted public paths.
- Наличие существующего seller binding для другого owned shop само по себе MUST NOT блокировать admin-side provisioning следующего shop для того же seller identity.
- Seller access to shared storefront edit mode and to `seller-web` store-admin MUST depend on that bound ownership.
- Missing or mismatched Telegram binding MUST NOT grant seller access.

## Visibility rules
- Shop visibility states are `WORKING` and `NOT_WORKING`.
- `WORKING` shop MUST be visible in public browse and to the owning seller.
- `NOT_WORKING` shop MUST stay hidden from public browse and remain visible only to the owning seller.

## Admin provisioning read view
- `/admin/catalog/shops/provision` MAY load a narrow admin-owned read model of already provisioned shops from the owning `catalog` slice.
- This read model exists only to support the admin provisioning page and MUST NOT become a second public browse or seller surface.
- The admin provisioning read view MUST read canonical persisted `catalog` state from the mounted runtime path rather than route-local synthetic UI state.
- The admin provisioning read view MUST include both `WORKING` and `NOT_WORKING` shops because it is an admin-owned operational surface, not a public visibility surface.
- The minimum summary fields for this read model are `shopId`, `shopName`, `status`, `sellerId`, `telegramId`, `primaryPublicPath`, and `secondaryPublicPath` when the public paths are naturally available from the same catalog-owned read path.

## Store-admin scope rules
- Separate `seller-web` store-admin exists to host light catalog-owned controls that do not fit the shared storefront editing flow.
- First-version `seller-web` baseline includes the shop status toggle and similarly light shop-level controls only.
- Sales stats, reporting, or other cross-slice analytics MUST NOT be pulled into the baseline `seller-web` scope without explicit spec expansion.

## Failure posture
- Provisioning conflicts, ownership conflicts, and invalid status changes MUST return controlled errors and MUST NOT leave partially bound seller/shop state.
- If the same durable `sellerId + shop name` identity invariant rejects a later seller rename, that conflict MUST also return a controlled `409` business error rather than a raw persistence failure.
- Error payloads follow the project-wide error contract.

## Related docs
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../features/FT-010-seller-storefront-editing-and-store-admin.md): feature acceptance and contours.
- [.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md](../features/FT-011-db-backed-catalog-runtime-baseline.md): durable runtime baseline and restart-safe provisioning semantics.
- [.memory-bank/contracts/catalog-public-api.md](catalog-public-api.md): public browse visibility boundary.
- [.memory-bank/contracts/seller-catalog-write-policy.md](seller-catalog-write-policy.md): seller-side edit policy.
- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md): contour split and owner-slice rules.
