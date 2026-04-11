# TASK-FT010-16 Red Verification

## Semantic verdict
- `semantic-concern`

## Top substance risk
- The task hardens root contour family matching and fixes unknown seller-route fallback, but the `admin-web` contour still silently accepts semantically foreign `/admin/*` paths by resolving them to the assignment screen.

## Hostile hypothesis list
- The task may have solved the convenient local interpretation of the bug: root `/admin*` and `/seller*` prefix detection plus seller fallback.
- The task may still miss the real intent stated in the task card: seller/admin scaffolds should no longer accept semantically foreign paths by accident.
- Focused tests may create false confidence because they prove the seller-side fix while leaving the admin-side implicit fallback unchanged.

## What was checked
- `frontend/src/app/root-router.tsx`: root contour selection is now slash-bounded for `/admin` and `/seller`.
- `frontend/src/seller/app/router.tsx`: unknown seller routes now return explicit not-found feedback.
- `frontend/src/admin/app/router.tsx`: `resolveAdminRoute()` still falls back to `adminRoutePaths.assignment` for any unknown admin pathname.
- `frontend/src/tests/admin/admin-router.spec.tsx`: existing test explicitly freezes `resolveAdminRoute("/admin/missing")` -> `AdminAssignmentRoute` as expected behavior.

## Cross-boundary impact
- `FT-010` owns the narrow `seller-web` contour and admin provisioning shell boundaries. Leaving admin unknown-path fallback in place means the same route-boundary hardening intent is only partially applied across adjacent operator-facing contours.
- This does not break Mini App storefront routing, but it keeps `admin-web` semantics broader than the spec wording suggests.

## Architectural concerns
- There is no architectural failure in the chosen helper-based route-family matching.
- The concern is semantic consistency: one contour (`seller-web`) now treats unsupported paths as explicit misses, while another (`admin-web`) still rewrites them into a valid operational screen.

## State/data consistency concerns
- None directly. This is a routing semantics concern rather than a state or persistence issue.

## Operational concerns
- An operator or test automation hitting a mistyped `/admin/*` path can land on a real screen (`assignment`) instead of getting explicit feedback that the route is invalid.
- That can mask broken links, stale bookmarks, or deployment mismatches and reduce observability of routing errors.

## Future maintenance cost
- Keeping asymmetric fallback semantics across seller/admin contours increases the chance of future route scaffolding drift and duplicated assumptions in tests.

## Hidden assumptions
- The current implementation assumes that implicit admin fallback to the assignment screen is acceptable operationally.
- The task card language suggests a stricter intent: unsupported seller/admin paths should not be treated as valid operational screens by accident.

## How this could still be wrong
- If product intent explicitly wants `/admin/*` unknown paths to canonicalize into the main assignment dashboard, this concern would be weaker. No such exception is documented in the current task card, feature note, or route-boundary contract.

## Counterproposal / escalation path
- Open follow-up `TASK-FT010-17` to remove the implicit unknown admin-route fallback, add explicit admin not-found behavior, and cover it with hostile route smoke.

## Evidence
- `frontend/src/admin/app/router.tsx`
- `frontend/src/tests/admin/admin-router.spec.tsx`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/features/FT-010-seller-storefront-editing-and-store-admin.md`
