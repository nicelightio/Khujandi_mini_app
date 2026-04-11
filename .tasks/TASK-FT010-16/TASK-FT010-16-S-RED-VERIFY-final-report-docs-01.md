# TASK-FT010-16 Red-Verify Report

## Verdict
- `semantic-concern`

## Main finding
- Unknown `/admin/*` paths still resolve to the assignment route inside `admin-web`, so the checked-in change only partially closes the broader "seller/admin scaffolds must not accept semantically foreign paths by accident" intent.

## Evidence
- `frontend/src/admin/app/router.tsx`: `resolveAdminRoute()` falls back to `adminRoutePaths.assignment`.
- `frontend/src/tests/admin/admin-router.spec.tsx`: existing test locks in `/admin/missing` -> `AdminAssignmentRoute`.

## Follow-up
- Added `TASK-FT010-17` to remove implicit admin fallback and make admin contour semantics explicit for unsupported `/admin/*` paths.
