---
description: S-04 Frontend Code Deep Review для FT-015 стартовой Витрины и curation UI.
status: final
---
# TASK-FT015-ARCH-REVIEW S-04 Frontend Code Deep Review

## VERDICT: REJECT

## Scope

- Owning slice: `catalog`.
- Owning contour: `mini-app` public showcase/storefront; admin curation affordances gated by `admin-web` session.
- Touched layers reviewed: frontend presentation, frontend API parsing, route resolution, focused frontend tests.
- Shared extraction: не требуется; curation behavior остается catalog-owned.

Reviewed files:
- `frontend/src/app/router.tsx`
- `frontend/src/shared/lib/routes.ts`
- `frontend/src/shared/i18n/copy.ts`
- `frontend/src/slices/catalog/api/catalog-api.ts`
- `frontend/src/slices/catalog/model/showcase-view-model.ts`
- `frontend/src/slices/catalog/hooks/use-start-showcase-view-model.ts`
- `frontend/src/slices/catalog/components/catalog-page.tsx`
- `frontend/src/slices/catalog/components/storefront-menu-sections.tsx`
- `frontend/src/slices/catalog/routes/catalog-route.tsx`
- `frontend/src/slices/catalog/routes/catalog-storefront-route.tsx`
- focused app/catalog/checkout tests

## Findings

### P1 - Storefront long-press curation product action is effectively not usable

Evidence:
- `frontend/src/slices/catalog/components/storefront-menu-sections.tsx:153-154` binds `onPointerUp={hideDescription}` on the product `<li>`.
- `frontend/src/slices/catalog/components/storefront-menu-sections.tsx:177-185` renders the admin "add product to showcase" button only while `descriptionAnchor !== null`.
- `frontend/src/slices/catalog/components/storefront-menu-sections.tsx:157-170` suppresses context menu for browse/admin mode but does not open the curation action.

Why this is blocking:
- For a platform admin browsing a `WORKING` storefront (`canEdit=false`, `canCurateShowcase=true`), long-press can briefly render the "Add to showcase" button, but releasing the pointer immediately clears `descriptionAnchor` and unmounts that button before the admin has a stable chance to activate it.
- The context-menu fallback also does not open the curation affordance in browse/admin mode.
- This breaks the FT-015 acceptance path: "Platform admin, находясь в активном `WORKING` магазине, long-press на товар и добавляет его на Витрину."
- Existing frontend tests cover customer long-press description behavior, but not admin storefront product curation.

Expected fix direction:
- Make long-press enter a persistent admin curation state/menu that survives pointer release, or handle the long-press command directly with an explicit confirmation/control.
- Add focused tests for `canEdit=false + canCurateShowcase=true`: long-press exposes an actionable add control and calls `addShowcaseProduct`.

### P2 - Curation writes are fire-and-forget with no frontend error, pending, or refresh state

Evidence:
- `frontend/src/slices/catalog/routes/catalog-route.tsx:52-57` calls `api.removeShowcaseProduct` / `api.removeShowcaseShop` with `void` and no error handling or view-model refresh.
- `frontend/src/slices/catalog/routes/catalog-storefront-route.tsx:69-75` calls `api.addShowcaseProduct` / `api.addShowcaseShop` with `void` and no error handling or view-model refresh.
- `frontend/src/slices/catalog/components/catalog-page.tsx:434-438` invokes remove without pending/error state.
- `frontend/src/slices/catalog/components/catalog-page.tsx:527-535` invokes favorite without pending/error state.

Impact:
- Expired admin session, `SHOWCASE_FAVORITE_LIMIT`, duplicate/conflict, or backend failure leaves the admin with no visible feedback.
- Successful remove/favorite actions do not update the current showcase/storefront UI until a manual reload.
- This conflicts with the spec expectation that invalid/expired admin session should hide/block curation controls and return controlled errors, and with baseline frontend loading/error state discipline.

Expected fix direction:
- Track curation mutation state in the route/hook, surface `role="status"` / `role="alert"` feedback, and refresh/reconcile showcase/admin state after successful mutation or auth/RBAC failure.
- Add tests for curation write success refresh and controlled failure rendering.

## Checked Areas With No Blocking Finding

- Route ambiguity: `/shops` is now an exact browse route and `/shops/:publicPath` requires exactly one segment. `resolveAppRoute` and `isStorefrontPathname` avoid the obvious `/shops` vs `/shops/:publicPath` ambiguity.
- Customer cart path: existing storefront add/update/remove/checkout tests still pass; I did not find a new FT-015 regression in the customer cart composition path.
- API payload parsing: showcase parser validates object/array shape, required ids/public paths, nullable media/description, price fields, and admin state. One caveat: client-side `favoriteShops.slice(0, 3)` masks an over-limit server response rather than failing loudly, but backend/runtime tests appear to own the cap.
- Public admin visibility: anonymous/customer state fails closed via `getShowcaseAdminState()` returning `canCurate=false` for `401/403/404`.

## Gate Evidence

- PASS: `npm run build:frontend`
- PASS: `npx jest --config jest.config.cjs frontend/src/tests/app/root-router.spec.tsx frontend/src/tests/slices/checkout-payment/app-router.spec.tsx frontend/src/tests/slices/catalog/catalog-api.spec.ts frontend/src/tests/slices/catalog/catalog-route.spec.tsx frontend/src/tests/slices/catalog/catalog-page.cart.spec.tsx frontend/src/tests/slices/catalog/catalog-page.public.spec.tsx frontend/src/tests/slices/catalog/catalog-page.storefront-events.spec.tsx`
  - 7 suites / 47 tests passed.
- FAIL: `npm run test:catalog`
  - 57 suites passed, 1 suite failed.
  - Failure is in `tests/slices/catalog/catalog.runtime.integration.spec.ts`, 4 tests failing with `TypeError: fetch failed` / `Cause: bad port` at `backend/src/dev-runtime/http-runtime.ts:204`.
  - This failure is runtime integration, not a focused frontend assertion failure, but it keeps the broader catalog gate red.

## Residual Risk

- No browser/Playwright or Telegram WebView manual smoke was run in this review.
- Admin curation UI lacks focused coverage for the exact FT-015 long-press add/remove flows, which is where the blocking frontend issue was found.
