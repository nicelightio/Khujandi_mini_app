# TASK-FT010-02 Red Verification

## Semantic verdict
- `semantic-concern`

## Hostile hypotheses checked
- The task might formally add `seller-web` and shared storefront scaffolds but still encode route boundaries too loosely to be trustworthy at runtime.
- The task might pass smoke coverage while accidentally hijacking unrelated same-origin routes into `admin-web` or `seller-web`.
- The task might freeze a friendly placeholder fallback that hides wrong-route behavior instead of making contour boundaries explicit.

## Top substance risks
- `frontend/src/app/root-router.tsx` uses `pathname.startsWith("/admin")` and `pathname.startsWith("/seller")`, which means unrelated paths such as `/admin-help` or `/seller-guide` are semantically treated as privileged contour families even though the spec defines route families as `/admin/*` and `/seller/*`.
- `frontend/src/seller/app/router.tsx` falls back from any unknown `/seller*` path directly to the shop-status page scaffold, which can hide route drift and gives false confidence that the seller contour is explicit when it is still accepting arbitrary seller-prefixed paths.

## Hidden assumptions
- The current scaffold assumes no other same-origin route family will ever begin with `/admin` or `/seller` without being part of those contours.
- It also assumes that a soft fallback to the only seller page is harmless, even though the route boundary is supposed to be part of the capability isolation contract.

## Cross-boundary impact
- This is not a domain/data break, but it is a boundary-definition risk across `mini-app`, `admin-web`, and `seller-web` contours.
- If later frontend routes add marketing/help/docs paths with `admin` or `seller` prefixes, this scaffold could silently route them into the wrong contour.

## Architectural concerns
- The change is minimal, but the current prefix matching is broader than the normative contour contract.
- For contour isolation work, imprecise path-family matching creates future maintenance cost because later routes must remember the hidden prefix trap.

## State and data consistency
- No state or persistence inconsistency was found in the checked-in scaffold scope.
- The concern is about route semantics, not data integrity.

## Operational concerns
- Current smoke tests prove happy-path contour selection only; they do not challenge malformed or adjacent prefixes.
- This can produce false confidence because the scaffold appears explicit while still accepting semantically foreign paths.

## Future maintenance cost
- Moderate if left unresolved: future route additions may accidentally collide with these broad prefix checks, and the bug will look like a routing/config issue rather than an intentional contour decision.

## How this could still be wrong
- If the product deliberately treats any `/admin*` and `/seller*` path as belonging to those contours, this concern would be overstated, but that is narrower neither in the specs nor in the route examples.
- If a later routing layer canonicalizes all paths before `RootRouter`, the practical risk could be smaller than it appears from the current checked-in files.

## Counterproposal / escalation path
- Open a small follow-up task to harden contour route-family matching to slash-bounded prefixes (`/admin` or `/admin/...`, `/seller` or `/seller/...`) and add hostile tests for adjacent prefixes plus unknown seller paths.
- No escalation beyond a follow-up task is needed right now.
