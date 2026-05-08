---
description: Verify #4 security/RBAC/error posture для FT-015/REQ-034.
---
# FT-015 / REQ-034 Verify #4: security/RBAC/error posture

## Scope

- Owning slice: `catalog`.
- Contours: `mini-app` public showcase read; storefront/admin-web admin-session affordances for curation writes.
- Touched layers verified: presentation/runtime route, application/domain curation checks, infrastructure reference writer/reader, frontend API/view state.
- Shared extraction: not justified; showcase curation is catalog-owned reference management with admin-session RBAC.

## Verification targets

- Curation writes require valid admin session.
- Only platform admin roles `BOSS`/`ADMIN` can curate.
- Seller/customer/anonymous cannot curate.
- Guard executes before any write.
- Frontend fails closed and does not show admin menu without positive admin state.
- Error contract remains controlled.

## Commands

- `npm run test:catalog:runtime -- --runInBand`
  - Result: PASS.
  - Evidence: `tests/slices/catalog/catalog.runtime.integration.spec.ts` passed 28/28.
  - Relevant passed cases:
    - `requires BOSS or ADMIN admin session before showcase writes`
    - `serves public showcase from live catalog references and hides not-working shop refs`
    - `unlinks showcase products without deleting the underlying product`
    - `returns the canonical error contract for missing dev-api routes`
    - protected seller route fail-closed cases.

- `npx jest --config jest.config.cjs frontend/src/tests/slices/catalog/catalog-api.spec.ts frontend/src/tests/slices/catalog/catalog-route.spec.tsx --runInBand`
  - Result: PASS.
  - Evidence: 2 suites passed, 20/20 tests.
  - Relevant passed cases:
    - `fails closed for missing showcase admin read support`
    - `sends showcase admin curation writes with included credentials`
    - `renders root start showcase instead of the generic shop list by default` and verifies no `data-start-showcase-admin="bar"` without admin state.

## Code evidence

- Backend admin-state probe and curation write endpoints call `resolveCatalogCurationAdminSession(...)` before invoking catalog write methods:
  - `backend/src/dev-runtime/routes/catalog.routes.ts:39`
  - `backend/src/dev-runtime/routes/catalog.routes.ts:405`
  - `backend/src/dev-runtime/routes/catalog.routes.ts:434`
- The guard resolves only the admin auth cookie session and rejects roles other than `admin`/`boss`:
  - `backend/src/dev-runtime/admin-access-runtime.ts:346`
  - `backend/src/slices/admin-access/presentation/admin-auth-http.ts:363`
  - `backend/src/slices/admin-access/domain/admin-access.types.ts:4`
- Mini App seller/customer sessions use a separate `khujandi_mini_app_session` cookie, so seller/customer identity alone is not accepted by the admin guard:
  - `backend/src/dev-runtime/checkout-payment-runtime.ts:139`
- Curation write methods are reachable only after the route-level admin guard; application/domain then validates target eligibility:
  - `backend/src/slices/catalog/presentation/catalog.controller.ts:66`
  - `backend/src/slices/catalog/application/catalog.service.ts:323`
  - `backend/src/slices/catalog/application/catalog.service.ts:353`
- Reference writers mutate only showcase/favorite reference rows and enforce favorite cap:
  - `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:27`
  - `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:58`
  - `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.writer.ts:79`
- Public showcase read filters inactive/deleted/`NOT_WORKING` refs and caps favorites to 3:
  - `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.reader.ts:79`
  - `backend/src/slices/catalog/infrastructure/prisma/catalog-start-showcase.reader.ts:97`
- Frontend admin affordances are gated on positive `canCurate` state and otherwise hidden:
  - `frontend/src/slices/catalog/hooks/use-start-showcase-view-model.ts:27`
  - `frontend/src/slices/catalog/routes/catalog-storefront-route.tsx:35`
  - `frontend/src/slices/catalog/components/catalog-page.tsx:343`
  - `frontend/src/slices/catalog/components/catalog-page.tsx:368`
  - `frontend/src/slices/catalog/components/catalog-page.tsx:514`
  - `frontend/src/slices/catalog/components/storefront-menu-sections.tsx:74`
- Frontend admin-state API maps `401/403/404` to `{ canCurate: false }`, and writes include cookies but rely on backend RBAC:
  - `frontend/src/slices/catalog/api/catalog-api.ts:642`
  - `frontend/src/slices/catalog/api/catalog-api.ts:663`
- Controlled error payload shape is defined by `AppError.toPayload` as `{ error: { code, message, details }, trace_id }` and route catches return it for auth/RBAC failures:
  - `backend/src/shared/errors/app-error.ts:24`
  - `backend/src/dev-runtime/routes/catalog.routes.ts:421`
  - `backend/src/dev-runtime/routes/catalog.routes.ts:450`

## Verdict

PASS.

FT-015/REQ-034 security/RBAC/error posture is verified for repo-local scope. Showcase writes are admin-session guarded before mutation, only `BOSS`/`ADMIN` platform admin roles can curate, non-admin roles are denied without writes, seller/customer sessions do not satisfy the admin guard, anonymous callers get controlled auth errors, frontend admin menus fail closed without positive admin state, and errors remain within the project-wide controlled contract.
