# TASK-FT007-10 Final Report

## Result

- Shared frontend bootstrap now chooses `AdminRouter` for `/admin*` and `AppRouter` for non-admin paths.
- Production/static deploys no longer send `/admin/login` through the customer catalog fallback.

## Changed files

- `frontend/src/app/main.tsx`
- `frontend/src/app/root-router.tsx`
- `frontend/src/tests/app/root-router.spec.tsx`

## Evidence

- `npx jest --config jest.config.cjs frontend/src/tests/app/root-router.spec.tsx frontend/src/tests/admin/admin-router.spec.tsx --runInBand`
- `npm run build:frontend`
- `npx eslint "frontend/src/app/main.tsx" "frontend/src/app/root-router.tsx" "frontend/src/tests/app/root-router.spec.tsx"`
