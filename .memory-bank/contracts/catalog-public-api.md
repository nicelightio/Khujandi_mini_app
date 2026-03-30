---
description: Contract for public catalog read access, response boundaries, and soft-delete filtering.
status: active
---
# Catalog Public API Contract

## Purpose
- Freeze the customer-facing read boundary for `catalog` before runtime scaffolding.

## Owner
- Owning slice: `catalog`
- Contour: `mini-app`

## Scope
- Public read access to shops and products.
- Customer-facing browse works without authorization.
- Contract covers visibility and filtering rules, not checkout behavior.

## Contract rules
- Public catalog reads MUST be available without JWT or seller session.
- Responses MUST exclude soft-deleted shops and products.
- Public reads MUST expose only browse-safe data needed for storefront rendering.
- Public reads MUST stay within `catalog` scope and MUST NOT leak seller-only write semantics.

## Resource boundary
- `shops`: customer-visible storefront entities.
- `products`: customer-visible items that belong to visible shops.

## Query policy
- Exclude entities marked deleted.
- Exclude products whose parent shop is deleted or otherwise not publicly visible.
- Preserve a stable browse contract so later runtime implementations can sit behind REST without changing product intent.

## Error posture
- Unauthorized error is not expected for public browse endpoints.
- Controlled error contract remains project-wide: `{ error: { code, message, details }, trace_id }`.

## Invariants
- `REQ-001`: public catalog browse remains accessible without auth.
- `REQ-020`: shop rename policy does not alter historical order snapshots.

## Related docs
- [.memory-bank/features/FT-001-catalog-browse-and-seller-management.md](../features/FT-001-catalog-browse-and-seller-management.md): feature acceptance criteria.
- [.memory-bank/architecture/data-boundaries-and-persistence.md](../architecture/data-boundaries-and-persistence.md): soft-delete and snapshot boundaries.
- [.memory-bank/testing/index.md](../testing/index.md): verification basis for public browse coverage.
