---
description: Adversarial semantic verification for TASK-FT010-07.
status: active
---
# TASK-FT010-07 Red Verification

## Semantic verdict
- VERDICT: `semantic-concern`

## Top substance risks
- `seller-web` status toggle is implemented by reusing the broad seller shop update payload, so a narrow `WORKING/NOT_WORKING` change can silently overwrite stale `shop.name/description/header/background` data last edited through the shared storefront.

## Hidden assumptions
- The implementation assumes the `GET /api/v1/seller/shops` snapshot held by `seller-web` is still current enough to act as the source of truth for all mutable shop metadata at submit time.
- It also assumes a narrow status-control surface can safely call a wide shop-update command without a dedicated status-only contract.

## Cross-boundary impact
- This risk crosses the two `FT-010` presentation surfaces owned by `catalog`: shared storefront editing and narrow `seller-web` status control.
- A seller can edit metadata in the shared storefront, then later toggle status from an older `seller-web` tab/session and unintentionally roll metadata back to stale values.

## Architectural concerns
- The solution widens a narrow store-admin action into a full-shop write, which weakens the boundary between the focused `seller-web` control and the broader storefront editor.
- The current contract shape encourages future light controls to piggyback on the same broad mutation path instead of introducing intention-revealing commands.

## State/data consistency concerns
- `frontend/src/seller/routes/seller-shop-status-route.tsx` submits `...selectedShop` plus the new status, so the request includes all locally cached metadata fields.
- `frontend/src/seller/api/seller-shop-status-api.ts` serializes those metadata fields into the request body instead of sending a status-only command.
- `backend/src/slices/catalog/application/catalog.service.ts` persists any provided metadata fields in the same update path, so stale seller-web state can overwrite newer shared-storefront changes.

## Operational concerns
- The overwrite can be hard to notice operationally because the resulting write still looks like a legitimate `catalog.shop.updated` event, not an explicit conflict or status-only mutation.

## Future maintenance cost
- Every additional light `seller-web` control built on this pattern will increase the chance of accidental cross-surface rollback and make the shop write contract harder to reason about.

## How this could still be wrong
- If the product intentionally treats seller-web as the sole authoritative surface for shop metadata while status control is used, this concern would be overstated. The checked-in `FT-010` direction, however, explicitly keeps shared storefront editing as a first-class canonical seller surface.

## Counterproposal / escalation path
- Introduce a dedicated status-only seller command/endpoint, or make the existing shop update path explicitly patch-like for `status` without resending unrelated metadata.
- Add a focused regression proving status toggles do not revert metadata last changed through the shared storefront.
