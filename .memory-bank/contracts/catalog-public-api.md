---
description: Contract for public catalog read access, storefront response boundaries, and status-based visibility.
status: active
---
# Catalog Public API Contract

## Purpose
- Freeze the customer-facing read boundary for `catalog` before runtime scaffolding.

## Owner
- Owning slice: `catalog`
- Contour: `mini-app`

## Scope
- Public read access to storefront shops, menu pages, and products.
- Customer-facing browse works without authorization.
- Contract covers public visibility and browse-safe fields, not seller edit semantics or checkout behavior.

## Contract rules
- Public catalog reads MUST be available without JWT or seller session.
- Public reads MUST expose only browse-safe data needed for storefront rendering.
- Public reads MUST stay within `catalog` scope and MUST NOT leak seller-only edit semantics.
- Public reads MUST return only shops whose status is publicly visible according to the catalog visibility policy.
- Public storefront resolution MUST read canonical persisted catalog state from the DB-backed runtime baseline; route-local in-memory catalog state is not a normative source of truth.

## Resource boundary
- `shops`: customer-visible storefront entities with browse-safe metadata such as name, description, cover/background assets, and public status.
- `menu pages`: customer-visible menu groupings that belong to visible shops.
- `products`: customer-visible items that belong to visible menu pages and visible shops.

## Query policy
- Public browse includes only shops in status `WORKING`.
- Public browse excludes menu pages and products whose parent shop is not publicly visible.
- Preserve a stable browse contract so later runtime implementations can sit behind REST without changing product intent.

## Error posture
- Unauthorized error is not expected for public browse endpoints.
- Controlled error contract remains project-wide: `{ error: { code, message, details }, trace_id }`.

## Invariants
- `REQ-001`: public catalog browse remains accessible without auth.
- `REQ-020`: shop rename policy does not alter historical order snapshots.
- `REQ-026`: `NOT_WORKING` shops remain excluded from public storefront browse.
- `REQ-027`: public storefront reads resolve from durable catalog persistence rather than process-local runtime state.

## Related docs
- [.memory-bank/features/FT-001-catalog-browse-and-seller-management.md](../features/FT-001-catalog-browse-and-seller-management.md): public catalog baseline.
- [.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md](../features/FT-010-seller-storefront-editing-and-store-admin.md): shared storefront editing and visibility expansion.
- [.memory-bank/features/FT-011-db-backed-catalog-runtime-baseline.md](../features/FT-011-db-backed-catalog-runtime-baseline.md): durable runtime baseline for catalog reads and provisioning.
- [.memory-bank/contracts/catalog-seller-provisioning-and-visibility.md](catalog-seller-provisioning-and-visibility.md): shop visibility and seller binding rules.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): status, media and snapshot boundaries.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis for public browse coverage.
