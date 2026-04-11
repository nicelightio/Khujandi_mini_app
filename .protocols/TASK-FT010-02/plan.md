# TASK-FT010-02 Plan

## Scope
- Add frontend routing scaffolding for the shared storefront boundary, narrow `/seller/*` contour, and admin provisioning route.
- Keep this task scaffold-only: no real seller auth/runtime mutations and no second storefront implementation.
- Add smoke coverage that freezes the new contour boundaries for later runtime tasks.

## Implementation steps
1. Extend root/app/admin route resolution so `/seller/*` is recognized separately and storefront routes can live under the existing `mini-app` contour.
2. Add a shared storefront route that still renders through the existing catalog route/component tree.
3. Add minimal `seller-web` router/page scaffold for a future status toggle surface.
4. Add minimal admin provisioning route/page scaffold inside the existing admin contour.
5. Add/update route smoke tests for root routing, admin route resolution, seller router, and shared storefront behavior.

## Non-goals for this task
- No backend provisioning submission flow.
- No seller session bootstrap or ownership enforcement.
- No real seller edit affordances on storefront components yet.
- No separate seller HTML/bootstrap entrypoint.

## Verification basis
- Backlog verify clause for `TASK-FT010-02`.
- `FT-010` acceptance on shared storefront reuse and narrow `/seller/*` contour.
- `testing/index.md` requirement for route shell/test skeletons and explicit no-second-storefront posture.
