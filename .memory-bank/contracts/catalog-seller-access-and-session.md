---
description: Contract for seller access resolution, session reuse, and route boundaries across shared storefront and `seller-web`.
status: active
---
# Catalog Seller Access And Session

## Purpose
- Freeze seller access/session rules for the shared storefront and the separate `seller-web` contour before runtime implementation.

## Owner
- Owning slice: `catalog`
- Actors: `seller`, `admin`, `client`

## Contours and route boundary
- Shared storefront lives inside the existing `mini-app` contour.
- Seller edit mode in the shared storefront uses the same shop/storefront routes and the same base component tree as customer browse.
- Separate `seller-web` lives under its own route family on the same origin and MUST stay distinct from `admin-web`; canonical first-version prefix: `/seller/*`.
- `seller-web` hosts narrow store-admin screens and MUST NOT become a second storefront implementation.

## Identity and access resolution
- Seller identity is Telegram-linked.
- Admin provisioning binds the shop to the seller's Telegram-linked identity.
- The same logical user MAY have both customer and seller capabilities.
- Backend access decisions MUST be made server-side from the authenticated Telegram-linked user plus shop ownership bindings.
- Seller access MUST NOT be inferred only from client-side route choice, local flags, or `initDataUnsafe`.

## Session model
- Shared storefront auth bootstrap uses `POST /auth/telegram`.
- Session transport baseline remains HttpOnly cookie.
- `seller-web` MUST reuse the same underlying Telegram-linked identity model and MUST NOT introduce a separate seller password or standalone credential store.
- First-version `seller-web` protection may reuse the same-origin authenticated session or a server-issued same-user handoff from an already authenticated seller context; whichever transport is implemented, it MUST stay within one shared identity/session family.
- Session identifiers remain outside JS-readable persistent storage.

## Permission behavior
- Anonymous user gets public storefront browse only.
- Authenticated user without seller binding gets customer capabilities only.
- Authenticated seller gets edit/store-admin access only for owned shops.
- Authenticated seller MUST NOT see edit mode or store-admin access for a foreign shop.
- Shared storefront edit affordances appear only after positive server-side ownership resolution.

## Failure posture
- Missing auth -> `401 AUTH_REQUIRED` for protected seller surfaces.
- Authenticated but not owning seller -> controlled `403 FORBIDDEN` / business error.
- Invalid handoff or expired seller session bootstrap MUST fail closed and MUST NOT fall back to implicit seller access.

## Related docs
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../features/FT-010-seller-storefront-editing-and-store-admin.md): feature acceptance and contour usage.
- [.memory-bank/contracts/telegram-mini-app-auth-contract.md](telegram-mini-app-auth-contract.md): Telegram auth bootstrap.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](catalog-seller-provisioning-and-visibility.md): admin provisioning and visibility rules.
- [.memory-bank/contracts/seller-catalog-write-policy.md](seller-catalog-write-policy.md): seller edit permissions.
- [.memory-bank/architecture/system-contours-and-slices.md](../architecture/system-contours-and-slices.md): contour split and route ownership.
