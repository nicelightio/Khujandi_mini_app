---
description: Adversarial semantic verification for TASK-FT010-06.
status: active
---
# TASK-FT010-06 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risks
- The shipped shared storefront edit mode does not read the canonical seller storefront data model for menu pages/products. Instead it derives one synthetic page from public browse products and falls back to a fabricated starter product when public data is absent.
- The default save path is frontend-local only: `persistStorefrontEdit()` returns a success message without hitting the checked-in backend seller write boundary, so the UI can claim "saved" while no catalog mutation occurs.

## Hidden assumptions
- Assumes a shop-level seller-access read is enough to reconstruct the storefront edit surface, although `FT-010` acceptance is explicitly about editing real shop/menu/product content.
- Assumes repo-local UX wiring is an acceptable semantic substitute for catalog-owned shared storefront editing, even though this task claims to wire seller edit mode into the existing tree rather than merely scaffold local editor state.

## Cross-boundary impact
- Creates drift between frontend shared storefront behavior and the already implemented backend `catalog` ownership/write boundary from `TASK-FT010-04` and `TASK-FT010-05`.
- Risks false confidence for downstream `TASK-FT010-08`, because route smoke passes while the actual owner-facing storefront data path is still disconnected from the owning slice.

## Architectural concerns
- `CatalogRoute` now embeds temporary synthetic storefront reconstruction logic (`createSyntheticStorefrontProducts`, single-page fallback naming) that does not belong to the canonical `catalog` boundary.
- The route mixes public browse data with protected seller-access metadata to simulate an owner edit surface instead of consuming one coherent seller storefront read model.

## State/data consistency concerns
- For `NOT_WORKING` owner-visible shops, public browse may legitimately return no products, causing the UI to render fabricated placeholder content unrelated to persisted catalog state.
- Menu pages and product descriptions/images shown in edit mode can diverge from persisted backend state because only shop-level seller access is loaded from the server.

## Operational concerns
- The success feedback path is misleading: the default submit path acknowledges save completion without server persistence or failure modes from the real catalog command boundary.
- Current smoke tests validate local state transitions rather than real shared-storefront mutation semantics.

## Future maintenance cost
- Follow-up runtime wiring will need to remove synthetic reconstruction and local-only save semantics, so the current implementation risks churn rather than de-risking the real feature.

## How this could still be wrong
- If the intended scope for `TASK-FT010-06` was strictly UI-only scaffolding, then the task card and docs should have said so explicitly. In the current wording, "wire seller edit mode" materially implies connection to the real storefront content surface.

## Counterproposal / escalation path
- Add a follow-up task to mount a canonical seller storefront read/write boundary for shared storefront editing: real seller-owned menu-page/product data load, owner-visible `NOT_WORKING` support, and submit wiring to the existing backend seller commands.
