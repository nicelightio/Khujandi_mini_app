# TASK-FT010-17 Final Report

## Scope
- Removed the implicit `unknown /admin/* -> assignment` fallback from `admin-web` routing.
- Added explicit admin not-found feedback under the existing `admin-web` shell.
- Extended router smoke tests to prove unknown admin paths do not render login or assignment fallbacks.

## Changed files
- `frontend/src/admin/app/router.tsx`
- `frontend/src/tests/admin/admin-router.spec.tsx`
- `frontend/src/tests/app/root-router.spec.tsx`
- `.protocols/TASK-FT010-17/*`

## Verification
- `npx jest --config jest.config.cjs frontend/src/tests/app/root-router.spec.tsx frontend/src/tests/admin/admin-router.spec.tsx`
- `npx eslint frontend/src/admin/app/router.tsx frontend/src/tests/admin/admin-router.spec.tsx frontend/src/tests/app/root-router.spec.tsx`

## Result
- Unknown `/admin/*` paths now stay inside the `admin-web` contour but render explicit not-found feedback instead of masquerading as valid admin screens.
